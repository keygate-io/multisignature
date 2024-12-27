import { expect, Page } from "@playwright/test";
import { VaultsPage } from "./vaults.page";

export interface VaultCreationPageParams {
  page: Page; // Playwright page
}

export class VaultCreationPage {
  protected page: Page;

  constructor({ page }: VaultCreationPageParams) {
    this.page = page;
  }

  async expectUrl() {
    await expect(this.page).toHaveURL(/\/new-account\/create$/);
  }

  async expectAccountNameInput() {
    await expect(
      this.page.locator('[data-testid="account-name-input"]')
    ).toBeVisible();
  }

  async fillAccountName(name: string) {
    await this.page
      .locator('[data-testid="account-name-input"] input')
      .fill(name);
  }

  async expectAccountNameConfirmation(name: RegExp) {
    await expect(
      this.page.locator('[data-testid="account-name-confirmation"]')
    ).toHaveText(name);
  }

  async expectNetworkConfirmation(network: RegExp) {
    await expect(
      this.page.locator('[data-testid="network-confirmation"]')
    ).toHaveText(network);
  }

  async expectConfirmationButton() {
    await expect(
      this.page.locator('[data-testid="next-button"]')
    ).toBeVisible();

    await expect(this.page.locator('[data-testid="next-button"]')).toHaveText(
      "Create"
    );
  }

  async clickNext() {
    await this.page.locator('[data-testid="next-button"]').click();
  }

  async clickConfirm() {
    await this.expectConfirmationButton();
    await this.page.locator('[data-testid="next-button"]').click();
    await this.page.waitForURL(/\/vaults$/);
    return new VaultsPage({ page: this.page });
  }
}
