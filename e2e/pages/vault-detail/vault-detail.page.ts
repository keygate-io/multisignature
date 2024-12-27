import { expect, Page } from "@playwright/test";
import { isValidIcpAddress } from "../../utils/ledger";

export interface VaultDetailPageParams {
  page: Page;
}

export class VaultDetailPage {
  protected page: Page;

  constructor({ page }: VaultDetailPageParams) {
    this.page = page;
  }

  async expectUrl() {
    await expect(this.page).toHaveURL(/\/vaults\/[a-zA-Z0-9-]+$/);
  }

  async expectVaultName(vaultName: string) {
    await expect(this.page.locator('[data-testid="vault-name"]')).toHaveText(
      vaultName
    );
  }

  async expectVaultBalance(vaultBalance: string) {
    await expect(this.page.locator('[data-testid="vault-balance"]')).toHaveText(
      vaultBalance
    );
  }

  async expectValidVaultAddress() {
    // Wait for address to be populated
    await this.page.waitForSelector('[data-testid="vault-address"] input', {
      state: "attached",
      timeout: 5000,
    });

    // Get input value instead of text content
    const address = await this.page.inputValue(
      '[data-testid="vault-address"] input'
    );

    expect(address).toBeTruthy();
    expect(isValidIcpAddress(address)).toBe(true);
  }

  async getVaultId() {
    return this.page.url().split("/").pop();
  }
}
