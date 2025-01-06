import { expect, Page } from "@playwright/test";

export interface SettingsPageParams {
  page: Page;
}

export class SettingsPage {
  protected page: Page;

  constructor({ page }: SettingsPageParams) {
    this.page = page;
  }

  async expectUrl() {
    await this.page.waitForLoadState("networkidle");
    await expect(
      this.page.locator("[data-testid='loading-state']")
    ).not.toBeVisible();
    await expect(
      this.page.locator("[data-testid='settings-title']")
    ).toBeVisible();
    await expect(this.page).toHaveURL(/\/vaults\/[a-zA-Z0-9-]+\/settings$/);
  }

  async expectThreshold(a: number, b: number) {
    await expect(
      this.page.locator("[data-testid='threshold-range']")
    ).toHaveText(`${a} of ${b} signers`);
  }
}
