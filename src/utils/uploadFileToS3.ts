import {
  getPresignedUploadUrl,
  deleteS3ObjectAction,
  deleteMultipleS3ObjectsAction,
} from "./s3-actions";

const normalizeKey = (key: string): string => {
  let cleanKey = key.trim().replace(/^\/+/, "");
  cleanKey = cleanKey.replace(/^(ica\/)+/i, "");
  if (!cleanKey || cleanKey === "ica") {
    return "ica";
  }
  return `ica/${cleanKey}`;
};

const uploadFileToS3 = async (
  file: File,
  bucketPath: string,
  type: boolean = false,
  mediaType?: string
): Promise<void> => {
  try {
    let contentDisposition: string | undefined;

    if (type) {
      if (mediaType === "Photo") {
        contentDisposition = `attachment; filename="${file.name}"`;
      }
    } else {
      contentDisposition = "inline";
    }

    const normalizedKey = normalizeKey(bucketPath);

    // 1. Generate presigned PUT URL
    const uploadUrl = await getPresignedUploadUrl(
      normalizedKey,
      file.type,
      type,
      mediaType,
      file.name
    );

    if (!uploadUrl) {
      throw new Error("Failed to generate S3 upload URL");
    }

    // 2. Headers MUST match the headers used while generating
    // the presigned URL
    const headers: Record<string, string> = {
      "Content-Type": file.type,
    };

    if (contentDisposition) {
      headers["Content-Disposition"] = contentDisposition;
    }

    // 3. Upload directly from browser to S3
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers,
      body: file,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();

      console.error("S3 upload failed:", {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        response: errorText,
      });

      throw new Error(
        `Failed to upload file to S3. Status: ${uploadResponse.status} ${errorText}`
      );
    }

    console.log("S3 upload key:", normalizedKey);
    console.log("PDF uploaded successfully to S3:", normalizedKey);
  } catch (error) {
    console.error("S3 upload failed:", error);
    throw error;
  }
};

export const deleteS3Object = async (
  bucketPath: string
): Promise<Record<string, unknown> | undefined> => {
  const result = await deleteS3ObjectAction(bucketPath);

  if (!result.success) {
    throw new Error(result.error || "Failed to delete S3 object");
  }

  return result.data;
};

export const deleteMultipleS3Objects = async (
  keys: string[] = []
): Promise<Record<string, unknown> | undefined> => {
  const result = await deleteMultipleS3ObjectsAction(keys);

  if (!result.success) {
    throw new Error(result.error || "Failed to delete multiple S3 objects");
  }

  return result.data;
};

export default uploadFileToS3;
