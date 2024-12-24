import { testWithII } from "@dfinity/internet-identity-playwright";
import { HomePage } from "../../pages/home.page";
import { VaultsPage } from "../../pages/vaults/vaults.page";
import { register } from "../../fixtures/auth.fixture";

testWithII("new user can complete registration", async ({ page, iiPage }) => {
  // 0) Wait for II to be ready
  await iiPage.waitReady({
    url: "http://localhost:4943/",
    timeout: 10000,
    canisterId: "bd3sg-teaaa-aaaaa-qaaba-cai",
  });

  const homePage = new HomePage({ page, iiPage });
  // 1) Attempt to navigate to the home page
  await homePage.goto();
  // 1) Attempt to click on the login button
  // 2) Complete the II flow
  await homePage.register();

  // print url
  console.log("URL IS", await page.url());
  // 3) Navigate to the vaults page
  const vaultsPage = new VaultsPage({ page });
  await vaultsPage.expectUrl();
  await vaultsPage.expectVaultsListEmpty();
});

register(
  "new user sees empty vaults list after registration",
  async ({ vaultsPage }) => {
    await vaultsPage.expectUrl();
    await vaultsPage.expectVaultsListEmpty();
  }
);
