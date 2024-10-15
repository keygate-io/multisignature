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

export function loadWalletWasm(): Promise<void> {
  return central.load_wallet_wasm();
}

