import { Principal } from "@dfinity/principal";
import { Identity } from "@dfinity/agent";
import { createActor as createCentralActor } from "../../../declarations/central";
import { createActor as createAccountActor } from "../../../declarations/account";
import {
  Intent,
  IntentStatus,
} from "../../../declarations/account/account.did";

// Create maps to cache the actors
const centralActorMap = new Map<
  string,
  ReturnType<typeof createCentralActor>
>();
const accountActorMap = new Map<
  string,
  ReturnType<typeof createAccountActor>
>();

function getCentralActor(identity: Identity) {
  const key = identity.getPrincipal().toString();
  if (!centralActorMap.has(key)) {
    const actor = createCentralActor(
      process.env.CANISTER_ID_CENTRAL as string,
      {
        agentOptions: { identity },
      }
    );
    centralActorMap.set(key, actor);
  }
  return centralActorMap.get(key)!;
}

function getAccountActor(account_canister_id: Principal, identity: Identity) {
  const key = `${account_canister_id.toString()}-${identity
    .getPrincipal()
    .toString()}`;
  if (!accountActorMap.has(key)) {
    const actor = createAccountActor(account_canister_id, {
      agentOptions: { identity },
    });
    accountActorMap.set(key, actor);
  }
  return accountActorMap.get(key)!;
}

export function deployAccount(identity: Identity, name: string) {
  return getCentralActor(identity).deploy_account({
    name,
  });
}

export function upgradeAccount(canister_id: Principal, identity: Identity) {
  return getCentralActor(identity).upgrade_account(canister_id);
}

export function getVaults(identity: Identity) {
  return getCentralActor(identity).get_user_vaults();
}

export function getSubaccount(
  account_canister_id: Principal,
  token: string,
  identity: Identity
) {
  return getAccountActor(account_canister_id, identity).get_subaccount(token);
}

export function addIntent(
  account_canister_id: Principal,
  intent: Intent,
  identity: Identity
) {
  return getAccountActor(account_canister_id, identity).add_intent(intent);
}

export function getAdapters(
  account_canister_id: Principal,
  identity: Identity
) {
  return getAccountActor(account_canister_id, identity).get_adapters();
}

export function executeIntent(
  account_canister_id: Principal,
  intent_id: bigint,
  identity: Identity
): Promise<IntentStatus> {
  return getAccountActor(account_canister_id, identity).execute_intent(
    intent_id
  );
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

export function getIntents(account_canister_id: Principal, identity: Identity) {
  return getAccountActor(account_canister_id, identity).get_intents();
}

export function getDecisions(
  account_canister_id: Principal,
  intent_id: bigint,
  identity: Identity
) {
  return getAccountActor(account_canister_id, identity).get_decisions(
    intent_id
  );
}

export function getTokens(account_canister_id: Principal, identity: Identity) {
  return getAccountActor(account_canister_id, identity).get_tokens();
}

export async function createIcrcAccount(
  principal_id: Principal,
  token_principal_id: Principal,
  identity: Identity
) {
  return getAccountActor(principal_id, identity).add_icrc_account(
    `icp:icrc1:${token_principal_id}`
  );
}

export async function getIcrcAccount(
  account_canister_id: Principal,
  token_principal_id: Principal,
  identity: Identity
) {
  return getAccountActor(account_canister_id, identity).get_icrc_account(
    `icp:icrc1:${token_principal_id}`
  );
}

export function getDebugInfo(
  account_canister_id: Principal,
  identity: Identity
) {
  return getAccountActor(account_canister_id, identity).get_debug_info();
}
