import { register, RegistrationFixture } from "../../fixtures/auth.fixture";
import { setupConsoleLogger } from "../../utils/logging";
import { VaultDetailPage } from "../../pages/vault-detail/vault-detail.page";
import { vaultSelection } from "../../fixtures/vault.fixture";

register(
  "user can view a vault detail page",
  async ({ vaultsPage, browserName, page }: RegistrationFixture) => {
    await setupConsoleLogger(page, register.info());

    const createVaultPage = await vaultsPage.createVault();
    await createVaultPage.expectUrl();
    await createVaultPage.doAllStepsAndConfirm("Internet Computer", "My Vault");

    await vaultsPage.expectUrl();

    const vaultDetailPage = await vaultsPage.navigateToVault("My Vault");

    await vaultDetailPage.expectVaultName("My Vault");
    await vaultDetailPage.expectVaultBalance("0");
    await vaultDetailPage.expectValidVaultAddress();

    const vaultId = await vaultDetailPage.getVaultId();

    await page.goto("/");
    await page.goto(`/vaults/${vaultId}`);

    const directUrlVaultDetailPage = new VaultDetailPage({ page });

    await directUrlVaultDetailPage.expectUrl();
    await directUrlVaultDetailPage.expectVaultName("My Vault");
    await directUrlVaultDetailPage.expectVaultBalance("0");
    await directUrlVaultDetailPage.expectValidVaultAddress();
  }
);

vaultSelection(
  "user can initiate the new transaction flow",
  async ({ vaultDetailPage, vaultId, page }) => {
    const newTransactionPage = await vaultDetailPage.navigateToNewTransaction();
    await newTransactionPage.expectUrl();
  }
);
