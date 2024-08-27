import { ledger } from "../../../declarations/ledger";
import { Buffer } from 'buffer';
import { fromHex } from "@dfinity/agent";
import { AccountIdentifier } from "../../../declarations/ledger/ledger.did";

export async function balanceOf(account_id: string) {
  // Convert the account_id string to a Uint8Array
  const accountIdentifier: AccountIdentifier = new Uint8Array(fromHex(account_id));

  const balance = await ledger.account_balance({
    account: accountIdentifier,
  });

  return balance;
}