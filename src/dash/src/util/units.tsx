import { ICP_DECIMALS } from "./constants.js";

export const formatIcp = (value: bigint) => {
  return (value / BigInt(10 ** ICP_DECIMALS)).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
};

export const E8sToIcp = (value: bigint) => {
  return value / BigInt(10 ** 8);
};

export const icpToE8s = (value: bigint) => {
  return value * BigInt(10 ** 8);
};

export const formatIcrc = (value: bigint, decimals: number) => {
  return (value / BigInt(10 ** decimals)).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
};

export const formatCommaSeparated = (value: bigint) => {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
};