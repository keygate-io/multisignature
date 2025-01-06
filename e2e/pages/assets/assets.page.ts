import { expect, Page } from "@playwright/test";

export interface AssetsPageParams {
  page: Page;
}

export class AssetsPage {
  protected page: Page;

  constructor({ page }: AssetsPageParams) {
    this.page = page;
  }

  async expectUrl() {
    await expect(this.page).toHaveURL(/\/vaults\/[a-zA-Z0-9-]+\/assets$/);
  }
}
