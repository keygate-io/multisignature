import { ICP_DECIMALS } from "./constants";

export const formatIcp = (value: bigint) => {
  return (value / BigInt(10 ** ICP_DECIMALS)).toLocaleString();
};
