export function extractTokenData(token: string): {
  network: string;
  standard: string;
  principalId: string;
} {
  const [network, standard, principalId] = token.split(":");
  return { network, standard, principalId };
}
