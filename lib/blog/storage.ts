import "server-only";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const client = new S3Client({ forcePathStyle: true });
const bucket = () => process.env.NEON_POST_BUCKET || "post";
const key = (authorId: string, postId: string, assetId: string) =>
  `users/${encodeURIComponent(authorId)}/posts/${postId}/${assetId}`;

export async function putBlogAsset(authorId: string, postId: string, assetId: string, file: File) {
  await client.send(new PutObjectCommand({
    Bucket: bucket(), Key: key(authorId, postId, assetId),
    Body: new Uint8Array(await file.arrayBuffer()),
    ContentType: file.type || "application/octet-stream",
  }));
}

export async function getBlogAsset(authorId: string, postId: string, assetId: string) {
  return client.send(new GetObjectCommand({ Bucket: bucket(), Key: key(authorId, postId, assetId) }));
}

export async function deleteBlogAsset(authorId: string, postId: string, assetId: string) {
  await client.send(new DeleteObjectCommand({ Bucket: bucket(), Key: key(authorId, postId, assetId) }));
}

const adKey = (authorId: string, position: string) => `users/${encodeURIComponent(authorId)}/ads/${position}`;

export async function putAdImage(authorId: string, position: string, file: File) {
  await client.send(new PutObjectCommand({ Bucket: bucket(), Key: adKey(authorId, position),
    Body: new Uint8Array(await file.arrayBuffer()), ContentType: file.type }));
}

export async function getAdImage(authorId: string, position: string) {
  return client.send(new GetObjectCommand({ Bucket: bucket(), Key: adKey(authorId, position) }));
}

export async function deleteAdImage(authorId: string, position: string) {
  await client.send(new DeleteObjectCommand({ Bucket: bucket(), Key: adKey(authorId, position) }));
}
