import { vaultSelection } from "../../fixtures/vault.fixture";

vaultSelection("user can view assets", async ({ vaultDetailPage, page }) => {
  const assetsPage = await vaultDetailPage.navigateToAssets();
  await assetsPage.expectUrl();
});
