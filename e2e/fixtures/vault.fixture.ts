import { Page } from "@playwright/test";
import { register } from "./auth.fixture";
import { VaultDetailPage } from "../pages/vault-detail/vault-detail.page";

export type VaultSelectionFixture = {
  vaultDetailPage: VaultDetailPage;
  vaultId: string;
  page: Page;
};

export const vaultSelection = register.extend<VaultSelectionFixture>({
  vaultDetailPage: async ({ vaultsPage }, use) => {
    const createVaultPage = await vaultsPage.createVault();
    await createVaultPage.doAllStepsAndConfirm(
      "Internet Computer",
      "Test Vault"
    );

    const vaultDetailPage = await vaultsPage.navigateToVault("Test Vault");
    await vaultDetailPage.expectUrl();

    await use(vaultDetailPage);
  },

  vaultId: async ({ vaultDetailPage }, use) => {
    const vaultId = await vaultDetailPage.getVaultId();
    if (!vaultId) {
      throw new Error("Vault ID not found");
    }

    await use(vaultId);
  },
});
