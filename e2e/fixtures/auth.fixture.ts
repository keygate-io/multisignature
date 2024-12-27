import { HomePage } from "../pages/home.page";
import { testWithII } from "@dfinity/internet-identity-playwright";
import { VaultsPage } from "../pages/vaults/vaults.page";
import { Page } from "@playwright/test";

export type RegistrationFixture = {
  vaultsPage: VaultsPage;
  browserName: string;
  page: Page;
};

export const register = testWithII.extend<RegistrationFixture>({
  vaultsPage: async ({ page, iiPage, browserName }, use) => {
    await iiPage.waitReady({
      url: "http://localhost:4943/",
      timeout: 10000,
      canisterId: "bd3sg-teaaa-aaaaa-qaaba-cai",
    });

    const homePage = new HomePage({ page, iiPage });
    await homePage.goto();
    await homePage.register();

    const vaultsPage = new VaultsPage({ page });
    await vaultsPage.expectUrl();

    await use(vaultsPage);
  },
});
