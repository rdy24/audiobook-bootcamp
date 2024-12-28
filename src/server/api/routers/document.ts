import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { env } from "~/env";
import { LlamaParseReader } from '@llamaindex/cloud/reader';
import { documents, pages } from "~/server/db/schema";
import { eq } from "drizzle-orm";

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
        pages: true
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
});
