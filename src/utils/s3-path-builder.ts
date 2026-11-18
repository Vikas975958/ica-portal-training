export type S3UploadType = "trainee" | "program" | "other";

export interface S3PathParams {
  type: S3UploadType;
  fileName: string;
  traineeId?: string;
}

/**
 * Builds a standardized, normalized S3 key/path based on the category of material.
 * Ensures the S3 key starts with "ica/" and has no leading slash.
 */
export function buildS3Path(params: S3PathParams): string {
  const { type, fileName, traineeId } = params;

  if (!fileName || fileName.trim() === "") {
    throw new Error("Filename is required and cannot be empty");
  }

  // Prevent path traversal
  if (
    fileName.includes("../") ||
    fileName.includes("./") ||
    fileName.includes("..\\") ||
    fileName.includes(".\\")
  ) {
    throw new Error("Path traversal characters are not allowed in filenames");
  }

  // Remove accidental leading/trailing slashes and spaces from filename
  let cleanFileName = fileName.trim().replace(/^\/+/, "");
  if (cleanFileName === "") {
    throw new Error("Filename cannot consist only of slashes");
  }

  // Avoid duplicate "ica/" prefix in filename itself (case-insensitive)
  cleanFileName = cleanFileName.replace(/^(ica\/)+/i, "");

  if (type === "trainee") {
    if (!traineeId || traineeId.trim() === "" || traineeId.trim() === "undefined") {
      throw new Error("A valid traineeId is required for trainee uploads");
    }
    return `ica/trainees/${traineeId.trim()}/${cleanFileName}`;
  }

  if (type === "program") {
    return `ica/programs/${cleanFileName}`;
  }

  if (type === "other") {
    return `ica/${cleanFileName}`;
  }

  throw new Error(`Unsupported S3 upload type: ${type}`);
}
