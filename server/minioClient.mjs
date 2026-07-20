import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { HeadBucketCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "./config.mjs";

const defaultPresignExpiresIn = 15 * 60;

function isConfigured() {
  return Boolean(config.minio.endpoint && config.minio.accessKey && config.minio.secretKey && config.minio.bucket);
}

function requireConfigured() {
  if (!isConfigured()) {
    throw new Error("MinIO configuration is incomplete. Check MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, and MINIO_BUCKET.");
  }
}

function createS3Client() {
  requireConfigured();
  return new S3Client({
    endpoint: config.minio.endpoint,
    region: config.minio.region,
    credentials: {
      accessKeyId: config.minio.accessKey,
      secretAccessKey: config.minio.secretKey,
    },
    forcePathStyle: true,
  });
}

function sanitizeFilename(filename) {
  const fallback = "document";
  const normalized = String(filename || fallback)
    .normalize("NFKD")
    .replace(/[^\w.\-() ]+/g, "")
    .trim()
    .replace(/\s+/g, "-");

  return normalized || fallback;
}

function createObjectKey(originalFilename) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const safeName = sanitizeFilename(originalFilename);
  const extension = extname(safeName);
  const baseName = extension ? safeName.slice(0, -extension.length) : safeName;
  return `uploads/${year}/${month}/${day}/${baseName}-${randomUUID()}${extension}`;
}

function withPublicEndpoint(url) {
  if (!config.minio.publicEndpoint || !config.minio.endpoint) {
    return url;
  }

  return url.replace(config.minio.endpoint, config.minio.publicEndpoint);
}

export function getMinioReadiness() {
  return {
    ok: isConfigured(),
    configured: isConfigured(),
    hasEndpoint: Boolean(config.minio.endpoint),
    hasPublicEndpoint: Boolean(config.minio.publicEndpoint),
    hasAccessKey: Boolean(config.minio.accessKey),
    hasSecretKey: Boolean(config.minio.secretKey),
    bucket: config.minio.bucket || null,
    region: config.minio.region,
  };
}

export async function checkMinioBucket() {
  const readiness = getMinioReadiness();
  if (!readiness.configured) {
    return {
      ...readiness,
      ok: false,
      status: "not_configured",
      message: "MinIO is not fully configured on the backend.",
    };
  }

  try {
    const client = createS3Client();
    await client.send(new HeadBucketCommand({ Bucket: config.minio.bucket }));
    return {
      ...readiness,
      ok: true,
      status: "ok",
      summary: "MinIO bucket reachable and ready for object uploads.",
    };
  } catch (error) {
    return {
      ...readiness,
      ok: false,
      status: "failed",
      message: error instanceof Error ? error.message : "MinIO bucket check failed.",
    };
  }
}

export async function uploadDocumentObject({ buffer, filename, contentType }) {
  if (!buffer || buffer.length === 0) {
    throw new Error("Uploaded file is empty.");
  }

  const objectKey = createObjectKey(filename);
  const client = createS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: config.minio.bucket,
      Key: objectKey,
      Body: buffer,
      ContentType: contentType || "application/octet-stream",
    }),
  );

  return {
    bucket: config.minio.bucket,
    key: objectKey,
    originalFilename: filename || "document",
    contentType: contentType || "application/octet-stream",
    size: buffer.length,
    summary: "Object uploaded to MinIO successfully.",
  };
}

export async function createPresignedDocumentUrl(key, expiresIn = defaultPresignExpiresIn) {
  if (!key || typeof key !== "string") {
    throw new Error("Object key is required.");
  }

  const normalizedExpiresIn = Math.min(Math.max(Number(expiresIn) || defaultPresignExpiresIn, 60), 60 * 60);
  const client = createS3Client();
  const command = new GetObjectCommand({
    Bucket: config.minio.bucket,
    Key: key,
  });
  const signedUrl = await getSignedUrl(client, command, { expiresIn: normalizedExpiresIn });

  return {
    bucket: config.minio.bucket,
    key,
    url: withPublicEndpoint(signedUrl),
    expiresIn: normalizedExpiresIn,
    summary: "Presigned document URL created successfully.",
  };
}

async function readSdkBodyToBuffer(body) {
  if (!body) {
    return Buffer.alloc(0);
  }

  if (typeof body.transformToByteArray === "function") {
    return Buffer.from(await body.transformToByteArray());
  }

  const chunks = [];
  for await (const chunk of body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function readDocumentObjectBuffer(key) {
  if (!key || typeof key !== "string") {
    throw new Error("Object key is required.");
  }

  const client = createS3Client();
  const result = await client.send(
    new GetObjectCommand({
      Bucket: config.minio.bucket,
      Key: key,
    }),
  );

  const buffer = await readSdkBodyToBuffer(result.Body);
  return {
    bucket: config.minio.bucket,
    key,
    buffer,
    contentType: result.ContentType || "application/octet-stream",
    size: Number(result.ContentLength) || buffer.length,
    eTag: result.ETag || undefined,
    summary: "Object read from MinIO successfully.",
  };
}
