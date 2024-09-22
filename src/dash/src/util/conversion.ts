// util/conversion.ts

export function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(
    hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
}

export function base32ToBlob(base32: string): Uint8Array {
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const SHIFT = 5;
  const MASK = 31;

  let bytes = [];
  let buffer = 0;
  let bitsLeft = 0;

  for (let i = 0; i < base32.length; i++) {
    const char = base32.charAt(i).toUpperCase();
    const value = ALPHABET.indexOf(char);
    if (value === -1) continue; // Skip non-alphabet chars

    buffer = (buffer << SHIFT) | value;
    bitsLeft += SHIFT;
    if (bitsLeft >= 8) {
      bytes.push((buffer >> (bitsLeft - 8)) & 0xff);
      bitsLeft -= 8;
    }
  }

  return new Uint8Array(bytes);
}

export function blobToBase32(blob: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < blob.length; i++) {
    value = (value << 8) | blob[i];
    bits += 8;

    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }

  // Pad to multiple of 8 characters
  while (output.length % 8 !== 0) {
    output += "=";
  }

  return output;
}