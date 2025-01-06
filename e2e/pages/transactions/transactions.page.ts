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
    await this.page.waitForLoadState("networkidle");
    await expect(
      this.page.locator("[data-testid='loading-state']")
    ).not.toBeVisible();
    await expect(
      this.page.locator("[data-testid='transactions-container']")
    ).toBeVisible();
    await expect(this.page).toHaveURL(/\/vaults\/[a-zA-Z0-9-]+\/transactions$/);
  }

  /**
   * Helper method to check the status of the last transaction
   */
  private async checkLastTransactionStatus(
    expectedStatus: "Completed" | "Failed"
  ) {
    // Wait for transactions list to load
    await this.page.waitForLoadState("networkidle", {
      timeout: 10000,
    });

    // Find transaction status directly in the list
    await this.page
      .locator(".MuiChip-root", {
        hasText: expectedStatus,
      })
      .first()
      .waitFor();
  }

  /**
   * Verifies that the last transaction in the list was completed successfully
   */
  async expectLastTransactionSuccessful() {
    await this.checkLastTransactionStatus("Completed");
  }

  /**
   * Verifies that the last transaction in the list has failed
   */
  async expectLastTransactionFailed() {
    await this.checkLastTransactionStatus("Failed");
  }
}
