import { expect, Page } from "@playwright/test";

export interface TransactionsPageParams {
  page: Page;
}

export class TransactionsPage {
  protected page: Page;

  constructor({ page }: TransactionsPageParams) {
    this.page = page;
  }

  async expectUrl() {
    await expect(this.page).toHaveURL(/\/vaults\/[a-zA-Z0-9-]+\/transactions$/);
  }
}
