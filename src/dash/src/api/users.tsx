import { Principal } from "@dfinity/principal";
import { registration } from "../../../declarations/registration";

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
