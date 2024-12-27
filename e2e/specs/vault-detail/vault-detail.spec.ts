import { expect } from "@playwright/test";
import { register, VaultFixtures } from "../../fixtures/auth.fixture";
import { setupConsoleLogger } from "../../utils/logging";
import { VaultDetailPage } from "../../pages/vault-detail/vault-detail.page";

register(
  "user can view a vault detail page",
  async ({ vaultsPage, browserName, page }: VaultFixtures) => {
    setupConsoleLogger(page, browserName, register.info().title);

    const createVaultPage = await vaultsPage.createVault();
    await createVaultPage.expectUrl();
    await createVaultPage.doAllStepsAndConfirm("Internet Computer", "My Vault");

    await vaultsPage.expectUrl();

    const vaultDetailPage = await vaultsPage.navigateToVault("My Vault");

    await vaultDetailPage.expectVaultName("My Vault");
    await vaultDetailPage.expectVaultBalance("0");
    await vaultDetailPage.expectValidVaultAddress();

    const vaultId = await vaultDetailPage.getVaultId();

    // Test straight from url
    await page.goto("/");
    await page.goto(`/vaults/${vaultId}`);

    const directUrlVaultDetailPage = new VaultDetailPage({ page });

    await directUrlVaultDetailPage.expectUrl();
    await directUrlVaultDetailPage.expectVaultName("My Vault");
    await directUrlVaultDetailPage.expectVaultBalance("0");
    await directUrlVaultDetailPage.expectValidVaultAddress();
  }
);
