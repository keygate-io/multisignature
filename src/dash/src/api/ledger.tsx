import { ledger } from "../../../declarations/ledger";
import { AccountIdentifier } from "../../../declarations/ledger/ledger.did";

export function balanceOf(account_id: string) {
  // Convert the account_id string to a Uint8Array
  const accountIdentifier: AccountIdentifier = Uint8Array.from(
    Buffer.from(account_id)
  );

  return ledger.account_balance({
    account: accountIdentifier,
  });
}