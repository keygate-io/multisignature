import { expect, Page } from "@playwright/test";
import { TransactionsPage } from "./transactions.page";

export interface NewTransactionPageParams {
  page: Page;
}

export interface NewTransactionIntent {
  amount: string;
  token: string;
  recipient: string;
}

export class NewTransactionPage {
  protected page: Page;

  constructor({ page }: NewTransactionPageParams) {
    this.page = page;
  }

  async expectUrl() {
    await expect(this.page).toHaveURL(
      /\/vaults\/[a-zA-Z0-9-]+\/assets\/send-token$/
    );
  }

  async expectFormFields() {
    await expect(this.page.getByLabel("Recipient")).toBeVisible();
    await expect(this.page.getByLabel("Amount")).toBeVisible();
    await expect(this.page.getByLabel("Token")).toBeVisible();
  }

  async fillIntent(intent: NewTransactionIntent) {
    await this.page.getByLabel("Recipient").fill(intent.recipient);
    await this.page.getByLabel("Amount").fill(intent.amount);
    await this.page.getByLabel("Token").click();
    await this.page.getByRole("option", { name: intent.token }).click();
  }

  async nextStep() {
    await this.page.getByRole("button", { name: "Next" }).click();
  }

  async expectReviewStep() {
    await expect(this.page.getByText("Confirm transaction")).toBeVisible();
  }

  async expectTransactionDetails({
    amount,
    network,
    recipient,
  }: {
    amount: string;
    network: string;
    recipient: string;
  }) {
    await expect(this.page.getByText(`Amount: ${amount}`)).toBeVisible();
    await expect(this.page.getByText(`Network: ${network}`)).toBeVisible();
    await expect(this.page.getByText(`Recipient: ${recipient}`)).toBeVisible();
  }

  async confirmTransaction() {
    await this.page
      .getByRole("button", {
        name: "Confirm",
      })
      .click();

    await this.page.waitForURL(/\/vaults\/[a-zA-Z0-9-]+\/transactions$/);
    return new TransactionsPage({ page: this.page });
  }
}
