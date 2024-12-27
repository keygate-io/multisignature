import { testWithII } from "@dfinity/internet-identity-playwright";
import { HomePage } from "../../pages/home.page";
import { VaultsPage } from "../../pages/vaults/vaults.page";

testWithII("new user can complete registration", async ({ page, iiPage }) => {
  // 0) Wait for II to be ready
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
});
