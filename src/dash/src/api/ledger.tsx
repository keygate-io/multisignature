import { ledger } from "../../../declarations/ledger";
import { fromHex } from "@dfinity/agent";
import { AccountIdentifier } from "../../../declarations/ledger/ledger.did";

export async function balanceOf(accountIdentifier: Uint8Array) {
  // Convert the account_id string to a Uint8Array
  const balance = await ledger.account_balance({
    account: accountIdentifier,
  });

  return balance;
}
