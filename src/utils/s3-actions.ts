"use server";

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3_BUCKET = process.env.AWS_S3_BUCKET_NAME || "";
const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID || "";
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || "";
const REGION = process.env.AWS_REGION || "ap-south-1";

const getClient = () => {
  if (!ACCESS_KEY || !SECRET_ACCESS_KEY) {
    throw new Error("AWS credentials are not configured on the server");
  }
  return new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: ACCESS_KEY,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
  });
};

const normalizeKey = (key: string): string => {
  let cleanKey = key.trim().replace(/^\/+/, "");
  cleanKey = cleanKey.replace(/^(ica\/)+/i, "");
  if (!cleanKey || cleanKey === "ica") {
    return "ica";
  }
  return `ica/${cleanKey}`;
};

export async function getPresignedUploadUrl(
  bucketPath: string,
  contentType: string,
  type: boolean = false,
  mediaType?: string,
  filename?: string
): Promise<string> {
  const client = getClient();
  
  let contentDisposition: string | undefined;
  if (type) {
    if (mediaType === "Photo" && filename) {
      contentDisposition = `attachment; filename="${filename}"`;
    }
  } else {
    contentDisposition = "inline";
  }

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: normalizeKey(bucketPath),
    ContentType: contentType,
    ...(contentDisposition ? { ContentDisposition: contentDisposition } : {}),
  });
  
  return await getSignedUrl(client, command, { expiresIn: 900 });
}

export async function deleteS3ObjectAction(
  bucketPath: string
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    const client = getClient();
    const params = {
      Bucket: S3_BUCKET,
      Key: normalizeKey(bucketPath),
    };
    const command = new DeleteObjectCommand(params);
    const data = await client.send(command);
    return { success: true, data: JSON.parse(JSON.stringify(data)) };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Image delete failed:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function deleteMultipleS3ObjectsAction(
  keys: string[] = []
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  if (keys.length === 0) {
    return { success: true, data: {} };
  }
  try {
    const client = getClient();
    const params = {
      Bucket: S3_BUCKET,
      Delete: {
        Objects: keys.map((key) => ({ Key: normalizeKey(key) })),
        Quiet: false,
      },
    };
    const command = new DeleteObjectsCommand(params);
    const data = await client.send(command);
    return { success: true, data: JSON.parse(JSON.stringify(data)) };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Batch delete failed:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

