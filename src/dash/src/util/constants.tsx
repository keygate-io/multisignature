import { SubAccount } from "@dfinity/ledger-icp";

export const ICP_DECIMALS = 8;

export const DEFAULT_SUBACCOUNT = SubAccount.fromBytes(
  Uint8Array.from([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
  ])
) as SubAccount;

if (!process.env.CANISTER_ID_ICRC1_LEDGER_CANISTER) {
  throw new Error("CANISTER_ID_ICRC1_LEDGER_CANISTER is not set");
}

export const TOKEN_URN_TO_SYMBOL = {
  "icp:native": "ICP",
  [`icp:icrc1:${process.env.CANISTER_ID_ICRC1_LEDGER_CANISTER}`]: "MCK",
};
