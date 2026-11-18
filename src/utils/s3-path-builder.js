export function buildS3Path(params) {
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

  let cleanFileName = fileName.trim().replace(/^\/+/, "");
  if (cleanFileName === "") {
    throw new Error("Filename cannot consist only of slashes");
  }

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
