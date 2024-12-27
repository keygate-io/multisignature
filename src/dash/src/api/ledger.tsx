import { ledger } from "../../../declarations/ledger";

export async function balanceOf(accountIdentifier: Uint8Array) {
  // Convert the account_id string to a Uint8Array
  const balance = await ledger.account_balance({
    account: accountIdentifier,
  });

  return balance;
}
