import { Principal } from "@dfinity/principal";
import { registration } from "../../../declarations/registration";
import { createActor } from "../../../declarations/account";
import {
  Intent,
  IntentStatus,
} from "../../../declarations/account/account.did"; // Make sure this path is correct

// Create a map to cache the account actors
const accountActorMap = new Map<Principal, ReturnType<typeof createActor>>();

function getAccountActor(account_canister_id: Principal) {
  if (!accountActorMap.has(account_canister_id)) {
    const actor = createActor(account_canister_id);
    accountActorMap.set(account_canister_id, actor);
  }
  return accountActorMap.get(account_canister_id);
}

export function deployAccount() {
  return registration.deploy_account();
}

export function upgradeAccount(canister_id: Principal) {
  return registration.upgrade_account(canister_id);
}

export function createSubaccount(
  account_canister_id: Principal,
  token: string
) {
  return getAccountActor(account_canister_id)?.add_subaccount(token);
}

export function getSubaccount(account_canister_id: Principal, token: string) {
  return getAccountActor(account_canister_id)?.get_subaccount(token);
}

export function addIntent(account_canister_id: Principal, intent: Intent) {
  return getAccountActor(account_canister_id)?.add_intent(intent);
}

export function getAdapters(account_canister_id: Principal) {
  return getAccountActor(account_canister_id)?.get_adapters();
}

export function executeIntent(
  account_canister_id: Principal,
  intent_id: bigint
): Promise<IntentStatus> {
  return getAccountActor(account_canister_id)!.execute_intent(intent_id);
}

export function createIntent(
  amount: bigint,
  token: string,
  to: string,
  from: string
): Intent {
  return {
    intent_type: { Transfer: null },
    amount,
    token,
    to,
    from,
    network: { ICP: null },
    status: { Pending: "Pending" },
  };
}

export function getIntents(account_canister_id: Principal) {
  return getAccountActor(account_canister_id)?.get_intents();
}

export function getDecisions(
  account_canister_id: Principal,
  intent_id: bigint
) {
  return getAccountActor(account_canister_id)?.get_decisions(intent_id);
}

export async function createIcrcAccount(
  principal_id: Principal,
  token_principal_id: Principal
) {
  // TODO: automatically check if the token is icrc1, icrc2, etc
  return getAccountActor(principal_id)?.add_icrc_account(
    `icp:icrc1:${token_principal_id}`
  );
}


