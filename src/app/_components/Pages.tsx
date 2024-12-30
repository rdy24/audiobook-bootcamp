import { useState } from "react";
import { api } from "~/trpc/react";

interface PagesProps {
    documentId: number;
    voice: string;
    pages: {
        documentId: number;
        id: number;
        createdAt: Date;
        pageNumber: number;
        content: string;
        audioFiles: {
            filePath: string;
            fileName: string;
            id: number;
        }[]
    }[];
    refetchDocuments: () => Promise<any>;
}

export function Pages({ documentId, voice, pages, refetchDocuments }: PagesProps) {
    const [pageIdActive, setPageIdActive] = useState<null | number>(null);

    const generateAudio = api.document.generateAudioBook.useMutation({
        onSuccess: async () => {
            console.log("Audio generated successfully");
            await refetchDocuments();
            setPageIdActive(null);
        },
        onError: (error) => {
            console.error("Error generating audio:", error);
        }
    });

    function handleGenerateAudio(pageId: number) {
        try {
            setPageIdActive(pageId);
            generateAudio.mutate({ documentId, pageIds: [pageId], voice });
        } catch (error) {
            console.error("Error generating audio:", error);
        }
    }

    return (
        <div className="mt-8 grid gap-2">
            {pages.map((page) => (
                <div key={page.id} className="p-4 bg-white/5 rounded-lg mb-2">
                    <div className="flex gap-2 items-center">
                        <p className="mb-2">Page {page.pageNumber}</p>
                        {page.audioFiles.map((audioFile) => (
                            <div key={audioFile.id} className="mt-4 flex-1">
                                <audio
                                    controls
                                    className="w-full"
                                    src={audioFile.filePath}
                                >
                                    Your browser does not support the audio element.
                                </audio>
                            </div>
                        ))}
                    </div>
                    <button
                        className="p-2 rounded-md bg-white/10 hover:bg-white/20 text-xs flex items-center"
                        onClick={() => handleGenerateAudio(page.id)}>
                        {generateAudio.isPending && pageIdActive === page.id && (
                            <span className="block size-4 border-2 border-dashed rounded-full animate-spin mr-2"></span>
                        )}
                        Generate audio
                    </button>
                </div>
            ))}
        </div>
    );
}