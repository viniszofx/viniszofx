import "server-only";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const client = new S3Client({ forcePathStyle: true });

function bucket() {
  const value = process.env.NEON_STORAGE_BUCKET;
  if (!value) throw new Error("NEON_STORAGE_BUCKET não configurado.");
  return value;
}

function key(userId: string, fileId: string) {
  return `users/${encodeURIComponent(userId)}/${fileId}`;
}

export async function putFile(userId: string, fileId: string, file: File) {
  await client.send(new PutObjectCommand({
    Bucket: bucket(), Key: key(userId, fileId),
    Body: new Uint8Array(await file.arrayBuffer()),
    ContentType: file.type || "application/octet-stream",
  }));
}

export async function getFile(userId: string, fileId: string) {
  return client.send(new GetObjectCommand({ Bucket: bucket(), Key: key(userId, fileId) }));
}

export async function deleteFile(userId: string, fileId: string) {
  await client.send(new DeleteObjectCommand({ Bucket: bucket(), Key: key(userId, fileId) }));
}
