import { Principal } from "@dfinity/principal";
import { registration } from "../../../declarations/registration";
import { account, createActor } from "../../../declarations/account";
import {
  Intent,
  IntentStatus,
} from "../../../declarations/account/account.did"; // Make sure this path is correct


export function deployAccount(principal: Principal) {
  return registration.deploy_account(principal);
}

export function createSubaccount(
  account_canister_id: Principal,
  token: string
) {
  return createActor(account_canister_id).add_subaccount(token);
}

export function getSubaccount(account_canister_id: Principal, token: string) {
  return createActor(account_canister_id).get_subaccount(token);
}

export function addIntent(
  account_canister_id: Principal,
  subaccount: Uint8Array,
  intent: Intent
) {
  return createActor(account_canister_id).add_intent(subaccount, intent);
}

export function getAdapters(account_canister_id: Principal) {
  return createActor(account_canister_id).get_adapters();
}

export function executeIntent(
  account_canister_id: Principal,
  intent_id: bigint
): Promise<IntentStatus> {
  return createActor(account_canister_id).execute_intent(intent_id);
}

export function createIntent(
  amount: bigint,
  token: string,
  to: string,
  from: string
): Intent {
  return {
    id: BigInt(Date.now()),
    intent_type: { Transfer: null },
    amount,
    token,
    to,
    from,
    network: { ICP: null },
    status: { Pending: null },
  };
}
