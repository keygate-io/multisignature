import { Principal } from "@dfinity/principal";
import { Identity } from "@dfinity/agent";
import { createActor as createCentralActor } from "../../../declarations/central";
import { createActor as createAccountActor } from "../../../declarations/account";
import {
  IntentStatus,
  ProposedTransaction,
  ProposeTransactionArgs,
} from "../../../declarations/account/account.did";
import { Vault } from "../../../declarations/central/central.did";

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
  console.log("account_canister_id", account_canister_id.toString());
  console.log("identity", identity.getPrincipal().toString());

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

export async function getVaults(identity: Identity) {
  const response: Vault[] = await getCentralActor(identity).get_user_vaults();

  return response;
}

export function getSubaccount(
  account_canister_id: Principal,
  token: string,
  identity: Identity
) {
  return getAccountActor(account_canister_id, identity).get_subaccount(token);
}

export function getAdapters(
  account_canister_id: Principal,
  identity: Identity
) {
  return getAccountActor(account_canister_id, identity).get_adapters();
}

export function proposeTransaction(
  account_canister_id: Principal,
  request: ProposeTransactionArgs,
  identity: Identity
): Promise<ProposedTransaction> {
  console.log("request", request);
  return getAccountActor(account_canister_id, identity).propose_transaction(
    request
  );
}

export function executeTransaction(
  account_canister_id: Principal,
  proposal_id: bigint,
  identity: Identity
): Promise<IntentStatus> {
  return getAccountActor(account_canister_id, identity).execute_transaction(
    proposal_id
  );
}

export function getProposedTransactions(
  account_canister_id: Principal,
  identity: Identity
) {
  return getAccountActor(
    account_canister_id,
    identity
  ).get_proposed_transactions();
}

export function getTransactions(
  account_canister_id: Principal,
  identity: Identity
) {
  return getAccountActor(account_canister_id, identity).get_transactions();
}

export function getThreshold(
  account_canister_id: Principal,
  identity: Identity
) {
  return getAccountActor(account_canister_id, identity).get_threshold();
}

export function setThreshold(
  account_canister_id: Principal,
  threshold: bigint,
  identity: Identity
) {
  return getAccountActor(account_canister_id, identity).set_threshold(
    threshold
  );
}

export function getSigners(account_canister_id: Principal, identity: Identity) {
  return getAccountActor(account_canister_id, identity).get_signers();
}

export function addSigner(
  account_canister_id: Principal,
  identity: Identity,
  signer: Principal
) {
  return getAccountActor(account_canister_id, identity).add_signer(signer);
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
  return getAccountActor(account_canister_id, identity).get_icrc_account();
}

export async function getBalance(
  account_canister_id: Principal,
  chain: string,
  identity: Identity
) {
  const result = await getAccountActor(
    account_canister_id,
    identity
  ).get_balance(chain);
  return result;
}

export async function pubkeyBytesToAddress(
  account_canister_id: Principal,
  identity: Identity
) {
  const result = getAccountActor(
    account_canister_id,
    identity
  ).pubkey_bytes_to_address();
  return result;
}

export function getDebugInfo(
  account_canister_id: Principal,
  identity: Identity
) {
  return getAccountActor(account_canister_id, identity).get_debug_info();
}

export function getVaultName(
  account_canister_id: Principal,
  identity: Identity
) {
  return getAccountActor(account_canister_id, identity).get_name();
}
