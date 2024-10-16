import { SubAccount } from "@dfinity/ledger-icp";

export const ICP_DECIMALS = 8;

export const DEFAULT_SUBACCOUNT = SubAccount.fromBytes(
  Uint8Array.from([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
  ])
) as SubAccount;
