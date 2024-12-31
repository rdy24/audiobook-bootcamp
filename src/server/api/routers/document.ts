import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { env } from "~/env";
import { LlamaParseReader } from '@llamaindex/cloud/reader';
import { documents, pages, audioFiles  } from "~/server/db/schema";
import { ElevenLabsClient } from "elevenlabs";
import { S3Client } from "@aws-sdk/client-s3";
import { eq, inArray } from "drizzle-orm";
import { generateAudioTask } from "~/trigger/generate";
import { runs } from "@trigger.dev/sdk/v3";

const elevenlabs = new ElevenLabsClient({
  apiKey: env.ELEVENLABS_API_KEY,
});

const s3Client = new S3Client({
  region: "auto",
  endpoint: "https://fly.storage.tigris.dev",
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

async function getPdfContent(buffer: Buffer): Promise<{ pages: { number: number; content: string }[] }> {
  try {
    const reader = new LlamaParseReader({ 
	    resultType: "markdown", 
	    apiKey: env.LLAMA_CLOUD_API_KEY 
	  });
    const docs = await reader.loadDataAsContent(buffer);

    return {
      pages: docs.map((doc, index) => ({
        number: index + 1,
        content: doc.getText()
      }))
    };
  } catch (error) {
    console.error("Error processing PDF:", error);
    throw new Error("Failed to process PDF document: " + (error as Error).message);
  }
}

export const documentRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.documents.findMany({
      where: eq(documents.createdById, ctx.session.user.id),
      with: {
        pages: {
          with: {
            audioFiles: true
          }
        }
      },
      orderBy: (documents, { desc }) => [desc(documents.createdAt)],
    });
  }),
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      fileUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!env.ELEVENLABS_API_KEY) {
        throw new Error("ElevenLabs API key is not configured");
      }

      try {
        // Fetch PDF from URL
        const response = await fetch(input.fileUrl);
        if (!response.ok) {
          throw new Error("Failed to fetch PDF file");
        }
        const fileBuffer = await response.arrayBuffer();
        
        // Extract text from PDF
        const { pages: pdfPages } = await getPdfContent(Buffer.from(fileBuffer));

        // Save document
        const [doc] = await ctx.db.insert(documents).values({
          name: input.name,
          createdById: ctx.session.user.id,
        }).returning();

        if (!doc) {
          throw new Error("Failed to create document");
        }

        // Process each page
        const documentPages = await Promise.all(pdfPages.map(async (page, index) => {
          try {
            // Save page
            const [savedPage] = await ctx.db.insert(pages).values({
              documentId: doc.id,
              pageNumber: page.number,
              content: page.content,
            }).returning();

            if (!savedPage) {
              throw new Error("Failed to save page");
            }

            return savedPage;
          } catch (error) {
            console.error(`Error processing page ${index + 1}:`, error);
            throw new Error(`Failed to process page ${index + 1}: ${(error as Error).message}`);
          }
        }));

        return {
          documentId: doc.id,
          pages: documentPages,
        };
      } catch (error) {
        console.error("Error creating document:", error);
        throw new Error("Failed to create document: " + (error as Error).message);
      }
    }),
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {

      const document = await ctx.db.query.documents.findFirst({
        where: (documents, { and,eq }) => and(
          eq(documents.id, input.id),
          eq(documents.createdById, ctx.session.user.id)
        )
      });

      if (!document) {
        throw new Error("Document not found");
      }

      await ctx.db.delete(pages).where(eq(pages.documentId, input.id));

      const [deletedDoc] = await ctx.db.delete(documents).where(eq(documents.id, input.id)).returning();

      if (!deletedDoc) {
        throw new Error("Failed to delete document");
      }

      return deletedDoc;
    }),
  generateAudioBook: protectedProcedure
    .input(z.object({
      documentId: z.number(),
      pageIds: z.array(z.number()),
      voice: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!env.ELEVENLABS_API_KEY) {
        throw new Error("ElevenLabs API key is not configured");
      }

      // Get the specified pages
      const pagesToRegenerate = await ctx.db.query.pages.findMany({
        where: inArray(pages.id, input.pageIds)
      });

      // Process each page
      const results = await Promise.all(pagesToRegenerate.map(async (page) => {
        try {
          const handle = await generateAudioTask.trigger({ 
            documentId: input.documentId,
            pageId: page.id,
            voice: input.voice,
            content: page.content
          });
          const runId = handle.id;
          const run = await runs.retrieve<typeof generateAudioTask>(runId);

          return { pageId: page.id, success: true, runId };
        } catch (error) {
          console.error(`Error regenerating audio for page ${page.id}:`, error);
          return { pageId: page.id, success: false, error: (error as Error).message };
        }
      }));

      return results;
    }),
  getJobStatus: protectedProcedure
    .input(z.object({
      runId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const run = await runs.retrieve<typeof generateAudioTask>(input.runId);
      return run;
    }),
});
