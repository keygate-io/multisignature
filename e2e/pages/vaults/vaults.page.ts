import { expect, Page } from "@playwright/test";
import { VaultCreationPage } from "./vault-creation.page";

export interface VaultsPageParams {
  page: Page; // Playwright page
}

export class VaultsPage {
  protected page: Page;

  constructor({ page }: VaultsPageParams) {
    this.page = page;
  }

  async expectUrl() {
    await expect(this.page).toHaveURL(/\/vaults$/);
  }

  async expectVaultsList() {
    await expect(
      this.page.locator('[data-testid="vaults-list"]')
    ).toBeVisible();
  }

  async expectVaultsListEmpty() {
    await expect(
      this.page.locator('[data-testid="vaults-list-empty"]')
    ).toBeVisible();
  }

  async createVault() {
    await this.page.locator('[data-testid="create-vault-button"]').click();
    await expect(this.page).toHaveURL(/\/new-account\/create$/);
    return new VaultCreationPage({ page: this.page });
  }

  async expectVaultWithName(name: string) {
    await expect(
      this.page.locator(
        `[data-testid="vault-${name.replace(/\s+/g, "-").toLowerCase()}"]`
      )
    ).toBeVisible();
  }
}
