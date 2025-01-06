import { expect, Page } from "@playwright/test";
import { VaultCreationPage } from "./vault-creation.page";
import { VaultDetailPage } from "../vault-detail/vault-detail.page";

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

  async navigateToVault(name: string) {
    await this.page
      .locator(
        `[data-testid="vault-${name.replace(/\s+/g, "-").toLowerCase()}"]`
      )
      .click();
    await this.page.waitForURL(/\/vaults\/[a-zA-Z0-9-]+$/);
    return new VaultDetailPage({ page: this.page });
  }

  async logout() {
    await this.page.locator('[data-testid="logout-button"]').click();
    await this.page.waitForLoadState("networkidle");
    await expect(this.page).toHaveURL(/\/$/);
  }
}
