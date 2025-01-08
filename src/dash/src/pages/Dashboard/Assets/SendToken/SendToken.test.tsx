import { describe, expect, it } from "vitest";

interface Intent {
  amount: number;
  token: string;
  to: string;
  network: { ETH: null } | { ICP: null };
  transaction_type: { Transfer: null };
  from: string;
}

describe("Intent creation", () => {
  const createIntent = (
    amount: string,
    token: string,
    recipient: string,
    nativeAccountId: string
  ): Intent => ({
    amount: Number(amount),
    token,
    to: recipient,
    network: token.toLowerCase().includes("eth")
      ? { ETH: null }
      : { ICP: null },
    transaction_type: { Transfer: null },
    from: nativeAccountId,
  });

  it("creates correct intent object for ICP", () => {
    const expectedIntent: Intent = {
      amount: 100,
      token: "icp:native",
      to: "z3hc7-f3wle-sfb34-ftgza-o7idl-vopan-733dp-5s6vi-wy4zo-tzwmv-4ae",
      network: { ICP: null },
      transaction_type: { Transfer: null },
      from: "account-id",
    };

    const result = createIntent(
      "100",
      "icp:native",
      "z3hc7-f3wle-sfb34-ftgza-o7idl-vopan-733dp-5s6vi-wy4zo-tzwmv-4ae",
      "account-id"
    );

    expect(result).toEqual(expectedIntent);
  });
});
