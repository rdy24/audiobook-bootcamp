"use client";

import { UploadButton } from "~/utils/uploadthing";
import { api } from "~/trpc/react";

export function Documents() {
    const { data: documents, refetch: refetchDocuments } = api.document.getAll.useQuery();
    const createDocument = api.document.create.useMutation({
        onSuccess: async () => {
            console.log("Document created successfully");
            await refetchDocuments();
        },
        onError: (error) => {
            console.error("Error creating document:", error);
        }
    });
    return (
        <div>
            <UploadButton
                endpoint="pdfUploader"
                onClientUploadComplete={async (res) => {
                    if (!res?.[0]) return;
                    console.log(res[0]);
                    await createDocument.mutateAsync({
                        fileUrl: res[0].url,
                        name: res[0].name,
                    });
                }}
                onUploadError={(error: Error) => {
                    console.error(error.message);
                }}
                appearance={{
                    button:
                        "ut-ready:bg-green-500 ut-uploading:cursor-not-allowed bg-fuchsia-500 bg-none after:bg-fuchsia-400",
                    container: "w-max flex-row mx-auto",
                    allowedContent:
                        "flex h-8 flex-col items-center justify-center px-2 text-white",
                }}
            />
            <div className="mt-8">
                {documents?.map((document) => (
                    <div className="text-white p-4 border rounded-xl bg-white/5" key={document.id}>
                        <p>{document.name}</p>
                        <p>Pages</p>
                        {document.pages.map((page) => (
                            <div key={page.id}>
                                <p>Page {page.pageNumber}</p>
                                <p>{page.content}</p>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}