import {
  S3Client,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  DeleteObjectCommandOutput,
  DeleteObjectsCommandOutput,
} from '@aws-sdk/client-s3';

const S3_BUCKET = process.env.AWS_S3_BUCKET_NAME || '';
const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID || '';
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
const REGION = process.env.AWS_REGION || 'ap-south-1';

const getClient = () => {
  if (!ACCESS_KEY || !SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials are not configured on the server');
  }
  return new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: ACCESS_KEY,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
  });
};

export const deleteS3Object = async (bucketPath: string): Promise<DeleteObjectCommandOutput> => {
  const client = getClient();
  const params = {
    Bucket: S3_BUCKET,
    Key: bucketPath,
  };
  const command = new DeleteObjectCommand(params);
  return await client.send(command);
};

export const deleteMultipleS3Objects = async (
  keys: string[] = []
): Promise<DeleteObjectsCommandOutput | undefined> => {
  if (keys.length === 0) return;
  const client = getClient();
  const params = {
    Bucket: S3_BUCKET,
    Delete: {
      Objects: keys.map((key) => ({ Key: key })),
      Quiet: false,
    },
  };
  const command = new DeleteObjectsCommand(params);
  return await client.send(command);
};
