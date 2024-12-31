import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { audioBufferToWav } from "~/utils/download-audio";

interface Page {
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
}

interface PagesProps {
    documentId: number;
    documentName: string;
    voice: string;
    pages: Page[];
    // disable @typescript-eslint/no-explicit-any
    refetchDocuments: () => Promise<any>;
}

export function Pages({ documentId, voice, pages, refetchDocuments, documentName }: PagesProps) {
    const [pageIdActive, setPageIdActive] = useState<null | number>(null);
    const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
        };
    }, [pollingInterval]);

    const pollJobStatus = (runId: string) => {
        const interval = setInterval(() => {
            console.log("Checking job status...");
            getJobStatus.mutate({ runId });
        }, 5000);
        setPollingInterval(interval);
    };

    const generateAudio = api.document.generateAudioBook.useMutation({
        onSuccess: async (data) => {
            const runId = data.pop()?.runId;
            if (runId) {
                console.log("Job started:", runId);
                pollJobStatus(runId);
            }
        },
        onError: (error) => {
            console.error("Error generating audio:", error);
            setPageIdActive(null);
        }
    });

    const getJobStatus = api.document.getJobStatus.useMutation({
        onSuccess: async (data) => {
            console.log("Job status:", data);
            if (data.status === "COMPLETED") {
                // Wait for a brief moment to ensure the audio file is available
                await new Promise(resolve => setTimeout(resolve, 1000));
                await refetchDocuments();

                if (pollingInterval) {
                    clearInterval(pollingInterval);
                    setPollingInterval(null);
                }
                setPageIdActive(null);
            }
        },
        onError: (error) => {
            console.error("Error checking job status:", error);
            if (pollingInterval) {
                clearInterval(pollingInterval);
                setPollingInterval(null);
            }
            setPageIdActive(null);
        }
    });

    function handleGenerateAudio(pageId: number) {
        if (!voice || voice.trim() === "") {
            alert("Please select a voice before generating audio.");
            return;
        }

        try {
            setPageIdActive(pageId);
            generateAudio.mutate({ documentId, pageIds: [pageId], voice });
        } catch (error) {
            console.error("Error generating audio:", error);
        }
    }

    const handleDownloadAll = async (pages: Page[]) => {
        const audioFiles = pages.flatMap(page =>
            page.audioFiles.filter(audio => audio.filePath.length > 0)
        );

        if (audioFiles.length === 0) {
            alert("No audio files are available to download. Please generate audio first.");
            return;
        }

        try {
            // Create audio context
            const AudioContext = window.AudioContext;
            const audioContext = new AudioContext();
            const audioBuffers: AudioBuffer[] = [];

            // Fetch and decode all audio files
            for (const audioFile of audioFiles) {
                const response = await fetch(audioFile.filePath);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                audioBuffers.push(audioBuffer);
            }

            // Calculate total duration
            const totalLength = audioBuffers.reduce((acc, buffer) => acc + buffer.duration, 0);
            const sampleRate = audioBuffers[0]?.sampleRate ?? 44100;
            const numberOfChannels = audioBuffers[0]?.numberOfChannels ?? 1;

            // Create the final buffer
            const finalBuffer = audioContext.createBuffer(
                numberOfChannels,
                totalLength * sampleRate,
                sampleRate
            );

            // Merge all buffers
            let offset = 0;
            for (const buffer of audioBuffers) {
                for (let channel = 0; channel < numberOfChannels; channel++) {
                    const channelData = finalBuffer.getChannelData(channel);
                    channelData.set(buffer.getChannelData(channel), offset * sampleRate);
                }
                offset += buffer.duration;
            }

            // Convert to wav blob
            const wavBlob = await audioBufferToWav(finalBuffer);

            // Create download link
            const url = URL.createObjectURL(wavBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${documentName}.wav`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error merging audio files:', error);
            alert('Error merging audio files. Falling back to individual downloads.');
            for (const audioFile of audioFiles) {
                const link = document.createElement('a');
                link.href = audioFile.filePath;
                link.download = audioFile.fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    };

    return (
        <div className="mt-8 grid gap-2">
            <button onClick={() => handleDownloadAll(pages)} className="p-2 bg-white/5 hover:bg-white/10 rounded-md">
                Download audiobook
            </button>
            {pages.map((page) => (
                <div key={page.id} className="p-4 bg-white/5 rounded-lg mb-2">
                    <div className="flex gap-2 items-center">
                        <div>
                            <p className="mb-2">Page {page.pageNumber}</p>
                            <button
                                className="p-2 rounded-md bg-white/10 hover:bg-white/20 text-xs flex items-center"
                                onClick={() => handleGenerateAudio(page.id)}>
                                {pageIdActive === page.id && (
                                    <span className="block size-4 border-2 border-dashed rounded-full animate-spin mr-2"></span>
                                )}
                                Generate audio
                            </button>
                        </div>
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
                </div>
            ))}
        </div>
    );
}
