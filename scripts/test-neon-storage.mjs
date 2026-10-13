import "dotenv/config";
import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucket = process.env.NEON_STORAGE_BUCKET;
if (!bucket) throw new Error("NEON_STORAGE_BUCKET não configurado.");

const s3 = new S3Client({ forcePathStyle: true });
const key = `uploads/.storage-check-${randomUUID()}.txt`;
const contents = "Neon Storage OK";
let uploaded = false;

try {
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: contents, ContentType: "text/plain" }));
  uploaded = true;

  const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 60 });
  const response = await fetch(url);
  if (!response.ok || await response.text() !== contents) {
    throw new Error(`Leitura assinada falhou (HTTP ${response.status}).`);
  }
  console.log(`Neon Storage OK: bucket ${bucket}, upload e leitura assinada confirmados.`);
} finally {
  if (uploaded) {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    console.log("Objeto temporário removido.");
  }
}
