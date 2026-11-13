// Creates the storage buckets from .env in the local RustFS (bun run infra:up).
import "dotenv/config";
import { CreateBucketCommand, HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";

const client = new S3Client({ forcePathStyle: true });
const buckets = [process.env.NEON_STORAGE_BUCKET, process.env.NEON_POST_BUCKET || "post"].filter(Boolean);

for (const bucket of buckets) {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log(`Bucket ${bucket}: já existe`);
  } catch (error) {
    if (error?.$metadata?.httpStatusCode !== 404) throw error;
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
    console.log(`Bucket ${bucket}: criado`);
  }
}
