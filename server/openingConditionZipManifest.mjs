import { posix } from "node:path";
import yauzl from "yauzl";

const DEFAULT_MAX_ZIP_MANIFEST_ENTRIES = 500;
const DEFAULT_MAX_ZIP_EXTRACT_BYTES = 15 * 1024 * 1024;
const SUPPORTED_PREVIEW_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".txt",
  ".csv",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".bmp",
]);

const CONTENT_TYPE_BY_EXTENSION = new Map([
  [".pdf", "application/pdf"],
  [".doc", "application/msword"],
  [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  [".xls", "application/vnd.ms-excel"],
  [".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  [".txt", "text/plain; charset=utf-8"],
  [".csv", "text/csv; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".gif", "image/gif"],
  [".bmp", "image/bmp"],
]);

function normalizeZipEntryPath(value) {
  const normalized = String(value ?? "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^(\.\/)+/, "")
    .trim();

  if (!normalized) {
    return "";
  }

  const safePath = posix.normalize(normalized).replace(/^(\.\.(\/|\\|$))+/, "");
  if (!safePath || safePath === "." || safePath.endsWith("/")) {
    return "";
  }

  return safePath;
}

function createStableEntryId(sourceObjectId, relativePath, index) {
  const normalizedPath = normalizeZipEntryPath(relativePath);
  if (!normalizedPath) {
    return `${sourceObjectId}-entry-${index + 1}`;
  }

  const encodedPath = Buffer.from(normalizedPath, "utf8").toString("base64url").slice(0, 160);
  return `${sourceObjectId}-entry-${encodedPath || index + 1}`;
}

function createManifestEntry(sourceObjectId, relativePath, index, sizeBytes) {
  const fileName = posix.basename(relativePath);
  if (!fileName) {
    return null;
  }

  return {
    id: createStableEntryId(sourceObjectId, relativePath, index),
    sourceObjectId,
    fileName,
    relativePath,
    summary: relativePath !== fileName ? relativePath : undefined,
    sizeBytes: Number.isFinite(sizeBytes) && sizeBytes >= 0 ? Math.floor(sizeBytes) : undefined,
  };
}

function getFileExtension(relativePath = "") {
  const baseName = posix.basename(relativePath).toLowerCase();
  const dotIndex = baseName.lastIndexOf(".");
  return dotIndex >= 0 ? baseName.slice(dotIndex) : "";
}

function inferContentType(relativePath = "") {
  return CONTENT_TYPE_BY_EXTENSION.get(getFileExtension(relativePath)) ?? "application/octet-stream";
}

function isSupportedPreviewEntry(relativePath = "") {
  return SUPPORTED_PREVIEW_EXTENSIONS.has(getFileExtension(relativePath));
}

function readEntryBuffer(zipFile, entry) {
  return new Promise((resolve, reject) => {
    zipFile.openReadStream(entry, (streamError, readStream) => {
      if (streamError) {
        reject(streamError);
        return;
      }

      if (!readStream) {
        resolve(Buffer.alloc(0));
        return;
      }

      const chunks = [];
      readStream.on("data", (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      readStream.once("error", reject);
      readStream.once("end", () => resolve(Buffer.concat(chunks)));
    });
  });
}

export async function extractOpeningConditionZipManifestEntries(buffer, options = {}) {
  const sourceObjectId = String(options.sourceObjectId || "zip-object").trim() || "zip-object";
  const maxEntries = Math.max(1, Math.min(Number(options.maxEntries) || DEFAULT_MAX_ZIP_MANIFEST_ENTRIES, 5000));
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return [];
  }

  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (openError, zipFile) => {
      if (openError) {
        reject(openError);
        return;
      }

      if (!zipFile) {
        resolve([]);
        return;
      }

      const entries = [];
      let settled = false;

      const finish = (callback, value) => {
        if (settled) {
          return;
        }
        settled = true;
        zipFile.close();
        callback(value);
      };

      zipFile.on("entry", (entry) => {
        const relativePath = normalizeZipEntryPath(entry.fileName);
        if (relativePath && entries.length < maxEntries) {
          const manifestEntry = createManifestEntry(sourceObjectId, relativePath, entries.length, entry.uncompressedSize);
          if (manifestEntry) {
            entries.push(manifestEntry);
          }
        }

        if (entries.length >= maxEntries) {
          finish(resolve, entries);
          return;
        }

        zipFile.readEntry();
      });

      zipFile.once("error", (error) => finish(reject, error));
      zipFile.once("end", () => finish(resolve, entries));
      zipFile.readEntry();
    });
  });
}

export async function extractOpeningConditionZipPreviewEntries(buffer, options = {}) {
  const sourceObjectId = String(options.sourceObjectId || "zip-object").trim() || "zip-object";
  const maxEntries = Math.max(1, Math.min(Number(options.maxEntries) || DEFAULT_MAX_ZIP_MANIFEST_ENTRIES, 5000));
  const maxBytesPerEntry = Math.max(
    1024,
    Math.min(Number(options.maxBytesPerEntry) || DEFAULT_MAX_ZIP_EXTRACT_BYTES, 64 * 1024 * 1024),
  );
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return [];
  }

  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (openError, zipFile) => {
      if (openError) {
        reject(openError);
        return;
      }

      if (!zipFile) {
        resolve([]);
        return;
      }

      const entries = [];
      let settled = false;
      let reading = false;

      const finish = (callback, value) => {
        if (settled) {
          return;
        }
        settled = true;
        zipFile.close();
        callback(value);
      };

      zipFile.on("entry", async (entry) => {
        if (reading || settled) {
          return;
        }
        reading = true;
        try {
          const relativePath = normalizeZipEntryPath(entry.fileName);
          const manifestEntry =
            relativePath && entries.length < maxEntries
              ? createManifestEntry(sourceObjectId, relativePath, entries.length, entry.uncompressedSize)
              : null;

          if (
            manifestEntry &&
            isSupportedPreviewEntry(relativePath) &&
            Number(entry.uncompressedSize) > 0 &&
            Number(entry.uncompressedSize) <= maxBytesPerEntry
          ) {
            const fileBuffer = await readEntryBuffer(zipFile, entry);
            entries.push({
              ...manifestEntry,
              contentType: inferContentType(relativePath),
              buffer: fileBuffer,
            });
          }

          reading = false;
          if (entries.length >= maxEntries) {
            finish(resolve, entries);
            return;
          }
          zipFile.readEntry();
        } catch (error) {
          finish(reject, error);
        }
      });

      zipFile.once("error", (error) => finish(reject, error));
      zipFile.once("end", () => finish(resolve, entries));
      zipFile.readEntry();
    });
  });
}
