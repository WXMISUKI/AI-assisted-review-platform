import { posix } from "node:path";
import yauzl from "yauzl";

const DEFAULT_MAX_ZIP_MANIFEST_ENTRIES = 500;

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

function createManifestEntry(sourceObjectId, relativePath, index, sizeBytes) {
  const fileName = posix.basename(relativePath);
  if (!fileName) {
    return null;
  }

  return {
    id: `${sourceObjectId}-entry-${index + 1}`,
    sourceObjectId,
    fileName,
    relativePath,
    summary: relativePath !== fileName ? relativePath : undefined,
    sizeBytes: Number.isFinite(sizeBytes) && sizeBytes >= 0 ? Math.floor(sizeBytes) : undefined,
  };
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
