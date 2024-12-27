import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";

import type { UploadThingRouter } from "~/server/api/routers/uploadthing";

export const UploadButton = generateUploadButton<UploadThingRouter>();
export const UploadDropzone = generateUploadDropzone<UploadThingRouter>();