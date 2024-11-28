import { Principal } from "@dfinity/principal";
import {
  createActor,
  icrc1_ledger_canister,
} from "../../../declarations/icrc1_ledger_canister/index.js";
import { Subaccount } from "../../../declarations/icrc1_ledger_canister/icrc1_ledger_canister.did.js";

// create a map of the principal_id to the actor
const actorMap = new Map<Principal, ReturnType<typeof createActor>>();

export function getActor(principal_id: Principal) {
  if (!actorMap.has(principal_id)) {
    const actor = createActor(principal_id);
    actorMap.set(principal_id, actor);
  }
  return actorMap.get(principal_id);
}

export async function getTokenName(principal_id: Principal) {
  return getActor(principal_id)?.icrc1_name();
}

export async function getTokenSymbol(principal_id: Principal) {
  return getActor(principal_id)?.icrc1_symbol();
}

export async function getTokenDecimals(principal_id: Principal) {
  return getActor(principal_id)?.icrc1_decimals();
}

export async function getTokenTotalSupply(principal_id: Principal) {
  return getActor(principal_id)?.icrc1_total_supply();
}

export async function getTokenMetadata(principal_id: Principal) {
  return getActor(principal_id)?.icrc1_metadata();
}

export async function getTokenFee(principal_id: Principal) {
  return getActor(principal_id)?.icrc1_fee();
}

export async function getTokenBalance(
  principal_id: Principal,
  owner_id: Principal,
  subaccount?: Subaccount
) {
  console.log("Subaccount", subaccount);
  console.log("Principal", principal_id.toString());

  return getActor(principal_id)?.icrc1_balance_of({
    owner: owner_id,
    subaccount: subaccount ? [subaccount] : [],
  });
}