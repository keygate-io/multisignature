import { expect, Page } from "@playwright/test";

export interface HomePageParams {
  page: Page; // Playwright page
  iiPage: any; // Type should match your iiPage implementation
}

export class HomePage {
  protected page: Page;
  protected iiPage: any;
  private readonly baseUrl = "http://localhost:3000/";

  constructor({ page, iiPage }: HomePageParams) {
    this.page = page;
    this.iiPage = iiPage;
  }

  async goto(): Promise<void> {
    await this.page.goto(this.baseUrl);
  }

  async waitForReady(): Promise<void> {
    await this.page.waitForSelector("[data-tid=login-button]", {
      state: "attached",
    });
  }

  async expectTitle(): Promise<void> {
    await expect(this.page).toHaveTitle(/Keygate/);
  }

  async expectLoginButton(): Promise<void> {
    const connectButton = this.page.getByRole("button", {
      name: "Connect with Internet Identity",
    });
    await expect(connectButton).toBeVisible();
    await expect(connectButton).toHaveText("Connect with Internet Identity");
  }

  async register(): Promise<void> {
    await this.iiPage.signInWithNewIdentity({
      captcha: true,
    });
  }

  async login(): Promise<void> {
    await this.iiPage.signInWithExistingIdentity({
      captcha: true,
    });
  }
}
