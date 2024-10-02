import { Principal } from "@dfinity/principal";
import { central } from "../../../declarations/central";

export interface UserInfo {
  first_name: string;
  last_name: string;
}

export function isRegistered(principal: Principal): Promise<boolean> {
  return central.user_exists(principal);
}

export function registerUser(
  principal: Principal,
  firstName: string,
  lastName: string
): Promise<void> {
  return central.register_user(principal, firstName, lastName);
}

export async function getUser(principal: Principal): Promise<UserInfo | null> {
  const result = await central.get_user(principal);
  return result[0] ?? null;
}

export async function deployAccount(): Promise<Principal> {
  return central.deploy_account();
}

export async function getUserVaults(
  principal: Principal
): Promise<Principal[]> {
  return central.get_user_vaults(principal);
}

export function loadWalletWasm(): Promise<void> {
  return central.load_wallet_wasm();
}

// Helper functions

export async function hasAnAccount(principal: Principal): Promise<boolean> {
  const vaults = await getUserVaults(principal);
  return vaults.length > 0;
}

export async function getAccounts(principal: Principal): Promise<Principal[]> {
  const vaults = await getUserVaults(principal);
  return vaults;
}
