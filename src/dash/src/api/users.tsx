import { Principal } from "@dfinity/principal";
import { registration } from "../../../declarations/registration";
import { UserInfo } from "../../../declarations/registration/registration.did";

export function isRegistered(principal: Principal): Promise<boolean> {
  return registration.user_exists(principal);
}

export function registerUser(
  principal: Principal,
  firstName: string,
  lastName: string
): Promise<void> {
  return registration.register_user(principal, firstName, lastName);
}

export async function getUser(principal: Principal): Promise<null | UserInfo> {
  const req = await registration.get_user(principal);
  return req[0] ?? null;
}

export async function hasAnAccount(principal: Principal): Promise<boolean> {
  const req = await registration.get_user(principal);
  return req[0] !== undefined && req[0].accounts.length > 0;
}

export async function deployAccount(
  principal: Principal,
  accountName: string,
  signers: string[],
  threshold: number
): Promise<Principal> {
  return registration.deploy_account(principal);
}