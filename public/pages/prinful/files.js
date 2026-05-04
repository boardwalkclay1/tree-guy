// /pages/printful/files.js
import { printfulRequest } from "./printful-client.js";

/**
 * Upload a file to Printful using a public URL
 */
export async function uploadFileFromUrl(fileUrl, filename = "design.png") {
  return await printfulRequest("/files", {
    method: "POST",
    body: {
      file_url: fileUrl,
      filename
    }
  });
}

/**
 * Upload a base64 data URL (from canvas or preview export)
 * You should host it or convert to a Blob + URL before calling this in production.
 * For now, this assumes you already have a reachable URL.
 */
export async function uploadDesignFromUrl(designUrl) {
  return await uploadFileFromUrl(designUrl, "rtg-design.png");
}
