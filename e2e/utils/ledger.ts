import { bigEndianCrc32 } from "@dfinity/utils";

export function isValidIcpAddress(hexAddress: string): boolean {
  // Validation constraints:
  // - Must be 64 characters (32 bytes) long
  // - First 8 characters (4 bytes) are CRC32 checksum
  // - Remaining 56 characters are SHA-224 hash
  // - Must contain only valid hex characters

  // Check length
  if (hexAddress.length !== 64) return false;

  // Check for valid hex characters
  if (!/^[0-9a-fA-F]+$/.test(hexAddress)) return false;

  // Extract checksum and hash portions
  const checksumHex = hexAddress.slice(0, 8);
  const hashHex = hexAddress.slice(8);

  // Convert hash portion to Uint8Array
  const hashBytes = new Uint8Array(
    hashHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
  );

  // Calculate checksum of hash portion
  const calculatedChecksumBytes = bigEndianCrc32(hashBytes);
  const calculatedChecksumHex = Array.from(calculatedChecksumBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Compare calculated checksum with provided checksum
  return calculatedChecksumHex === checksumHex.toLowerCase();
}
