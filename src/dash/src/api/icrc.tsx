import { Principal } from "@dfinity/principal";
import {
  createActor,
  icrc1_ledger_canister,
} from "../../../declarations/icrc1_ledger_canister";

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
