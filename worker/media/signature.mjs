// WEB-INC-004 (ML-DEVOS-RFC-007 / ML-DEVOS-AS-023 / D-029) media
// file-signature validation.
//
// AS23-F007 requires bounded file-signature validation, not trust in a
// client-supplied `Content-Type` header alone: this module inspects the
// leading bytes of an uploaded body and returns the one content type they
// actually match, or `null` if they match none of the three allowed image
// types. SVG (a text/XML format with no fixed binary signature) can never
// match any of these checks — it is rejected by construction, not by a
// separate SVG-specific blocklist rule.
//
// This module is pure and has no D1/R2/request dependency, so it is trivial
// to unit test directly against small fixture byte arrays.

export const ALLOWED_MEDIA_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const EXTENSION_FOR_CONTENT_TYPE = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// AS23-F007: maximum payload is 5 MiB of actual bytes.
export const MAX_MEDIA_BYTES = 5 * 1024 * 1024;

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function bytesStartWith(bytes, signature) {
  if (bytes.length < signature.length) return false;
  for (let i = 0; i < signature.length; i += 1) {
    if (bytes[i] !== signature[i]) return false;
  }
  return true;
}

function isWebp(bytes) {
  // RIFF <4-byte size> WEBP — the size field (bytes 4-7) is not checked
  // here since it is derived from the container, not a fixed signature
  // byte; only the two fixed ASCII markers are.
  if (bytes.length < 12) return false;
  const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  const webp = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
  return riff === "RIFF" && webp === "WEBP";
}

// Returns the one matching allowed content type for the given bytes, or
// `null` if the bytes match none of them (including any SVG/text/archive/
// arbitrary content).
export function detectImageContentType(bytes) {
  if (bytesStartWith(bytes, JPEG_SIGNATURE)) return "image/jpeg";
  if (bytesStartWith(bytes, PNG_SIGNATURE)) return "image/png";
  if (isWebp(bytes)) return "image/webp";
  return null;
}
