if (!process.env.CANISTER_ID_ICRC1_LEDGER_CANISTER) {
  throw new Error(
    "Environment variable CANISTER_ID_ICRC1_LEDGER_CANISTER is not set"
  );
}

export const ICRC1_LEDGER_CANISTER_ID: string =
  process.env.CANISTER_ID_ICRC1_LEDGER_CANISTER;
