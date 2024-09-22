export function extractTokenData(path: string): {
  path: string;
  network: string;
  standard: string;
  principalId: string;
} {
  const [network, standard, principalId] = path.split(":");
  return { path, network, standard, principalId };
}
