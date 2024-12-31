"use client";

import { useState } from "react";
import { UploadButton } from "~/utils/uploadthing";
import { api } from "~/trpc/react";
import { Pages } from "./Pages";

export function Documents() {
    const { data: documents, refetch: refetchDocuments } = api.document.getAll.useQuery();
    const { data: voices, isLoading: voicesLoading, error: voicesError } = api.document.getListVoices.useQuery();

    const [selectedVoices, setSelectedVoices] = useState<Record<number, string>>({});

    const createDocument = api.document.create.useMutation({
        onSuccess: async () => {
            console.log("Document created successfully");
            await refetchDocuments();
        },
        onError: (error) => {
            console.error("Error creating document:", error);
        }
    });

    const deleteDocument = api.document.delete.useMutation({
        onSuccess: async () => {
            console.log("Document deleted successfully");
            await refetchDocuments();
        },
        onError: (error) => {
            console.error("Error deleting document:", error);
        }
    });

    const handleVoiceChange = (documentId: number, voiceId: string) => {
        setSelectedVoices((prev) => ({
            ...prev,
            [documentId]: voiceId,
        }));
    };

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
                {voicesLoading && <p>Loading voices...</p>}
                {voicesError && <p>Error loading voices: {voicesError.message}</p>}

                {documents?.map((document) => (
                    <div className="text-white p-4 border rounded-xl bg-white/5 my-2" key={document.id}>
                        {/* Dropdown for voices */}
                        <select
                            className="select select-bordered w-full bg-white/5 text-white"
                            name={`voice_id_${document.id}`}
                            id={`voice_id_${document.id ?? ""}`}
                            value={selectedVoices[document.id] ?? ""}
                            onChange={(e) => handleVoiceChange(document.id, e.target.value)}
                        >
                            <option value="" disabled className="text-black">
                                Select a voice
                            </option>
                            {voices?.voices?.map((voice) => (
                                <option key={voice.voice_id} value={voice.voice_id} className="text-black">
                                    {voice.name}
                                </option>
                            ))}
                        </select>

                        <div className="flex justify-between items-center mt-4">
                            <div>
                                <p>{document.name}</p>
                                <div className="text-sm text-gray-400">
                                    {document.pages.length} pages
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <button
                                    className="btn btn-error text-white"
                                    onClick={() => {
                                        deleteDocument.mutate({ id: document.id });
                                    }}
                                    disabled={deleteDocument.isPending}
                                >
                                    {deleteDocument.isPending ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </div>

                        {/* Pages component */}
                        <Pages
                            documentId={document.id}
                            documentName={document.name}
                            pages={document.pages ?? []}
                            refetchDocuments={refetchDocuments}
                            voice={selectedVoices[document.id] ?? ""} // Use selected voice
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
