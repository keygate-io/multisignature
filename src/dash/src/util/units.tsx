import { ICP_DECIMALS } from "./constants";

export const formatIcp = (value: bigint) => {
  return (value / BigInt(10 ** ICP_DECIMALS)).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
};

export const formatIcrc = (value: bigint, decimals: number) => {
  return (value / BigInt(10 ** decimals)).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
};