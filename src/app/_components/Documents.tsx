"use client";

import { UploadButton } from "~/utils/uploadthing";

export function Documents() {
    return (
        <div>
            <UploadButton
                endpoint="pdfUploader"
                onClientUploadComplete={async (res) => {
                    if (!res?.[0]) return;
                    console.log(res[0].url);
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
        </div>
    );
}