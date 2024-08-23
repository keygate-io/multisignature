import { Principal } from "@dfinity/principal";
import { registration } from "../../../declarations/registration";
import { account, createActor } from "../../../declarations/account";

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
