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

  /**
   * Helper method to check the status of the last transaction
   */
  private async checkLastTransactionStatus(
    expectedStatus: "Completed" | "Failed"
  ) {
    const executedTab = this.page.locator('button[role="tab"]', {
      hasText: /^Executed$/,
    });

    await executedTab.waitFor({
      state: "attached",
      timeout: 15000,
    });

    const isSelected = await executedTab.getAttribute("aria-selected");
    if (isSelected !== "true") {
      await executedTab.click();
      await this.page.waitForLoadState("networkidle", {
        timeout: 10000,
      });
    }

    // Find transaction status
    await this.page
      .locator(".MuiChip-root", {
        hasText: expectedStatus,
      })
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