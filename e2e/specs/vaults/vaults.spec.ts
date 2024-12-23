import { register } from "../../fixtures/auth.fixture";

register("new user can create a vault", async ({ vaultsPage }) => {
  await vaultsPage.expectUrl();
  await vaultsPage.expectVaultsListEmpty();

  const vaultCreationPage = await vaultsPage.createVault();
  await vaultCreationPage.expectUrl();
  await vaultCreationPage.expectAccountNameInput();
  await vaultCreationPage.fillAccountName("My Vault");
  await vaultCreationPage.clickNext();

  await vaultCreationPage.expectAccountNameConfirmation(/My Vault/);
  await vaultCreationPage.expectNetworkConfirmation(/Internet Computer/);
  await vaultCreationPage.expectConfirmationButton();

  await vaultCreationPage.clickConfirm();

  await vaultsPage.expectUrl();
  await vaultsPage.expectVaultsList();

  await vaultsPage.expectVaultWithName("My Vault");
});
