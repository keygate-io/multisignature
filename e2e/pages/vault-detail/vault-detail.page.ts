import { expect, Page } from "@playwright/test";
import { isValidIcpAddress } from "../../utils/ledger";
import { NewTransactionPage } from "../transactions/new-transaction.page";
import { AssetsPage } from "../assets/assets.page";
import { SettingsPage } from "../settings/settings.page";

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

  async getAddress() {
    await this.page.waitForSelector('[data-testid="vault-address"] input', {
      state: "attached",
      timeout: 5000,
    });

    return this.page
      .locator('[data-testid="vault-address"] input')
      .inputValue();
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

  async navigateToNewTransaction() {
    await this.page.click('[data-testid="new-transaction-button"]');

    expect(
      this.page.locator('[data-testid="create-transaction-modal"]')
    ).toBeVisible();

    await this.page
      .getByRole("button")
      .filter({
        hasText: "Send token",
      })
      .click();

    return new NewTransactionPage({ page: this.page });
  }

  async navigateToAssets() {
    await this.page.click('[data-testid="assets-navigator"]');
    return new AssetsPage({ page: this.page });
  }

  async navigateToSettings() {
    await this.page.click('[data-testid="settings-navigator"]');
    return new SettingsPage({ page: this.page });
  }
}
