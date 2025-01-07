import { bigEndianCrc32 } from "@dfinity/utils";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

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

export async function fundICPPrincipal(
  address: string,
  amount: number
): Promise<void> {
  const scriptPath = path.join(process.cwd(), "scripts/fund-icp.sh");

  try {
    const { stdout, stderr } = await execAsync(
      `${scriptPath} ${address} ${amount}`
    );

    // Log result
    console.log(`Funded ${address} with ${amount} ICP`);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error) {
    throw new Error(`Funding failed: ${error.message}`);
  }
}

export async function fundIcrcAddress(vault_principal: string, amount: number) {
  const execAsync = promisify(exec);

  try {
    await execAsync("dfx identity use default");

    // principal = account principal id
    const command = `dfx canister call icrc1_ledger_canister icrc1_transfer '(record {
        to = record { owner = principal "${vault_principal}"; subaccount = null };
        amount = ${amount * 10 ** 3};
      })'`;

    const result = await execAsync(command);

    if (result.stderr) {
      console.error("Error funding ICRC address:", result.stderr);
      throw new Error(result.stderr);
    }

    return result.stdout;
  } catch (error) {
    console.error("Failed to fund ICRC address:", error);
    throw error;
  }
}