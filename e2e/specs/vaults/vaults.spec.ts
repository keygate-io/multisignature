import { register } from "../../fixtures/auth.fixture";

register("new user can create a vault", async ({ vaultsPage }) => {
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
  await vaultsPage.expectVaultWithName("My Vault");
});

register("user can create multiple vaults", async ({ vaultsPage }) => {
  const vaultNames = ["Vault One", "Vault Two"];

  for (const vaultName of vaultNames) {
    const vaultCreationPage = await vaultsPage.createVault();
    await vaultCreationPage.expectUrl();
    await vaultCreationPage.expectAccountNameInput();
    await vaultCreationPage.fillAccountName(vaultName);
    await vaultCreationPage.clickNext();

    await vaultCreationPage.expectAccountNameConfirmation(
      new RegExp(vaultName)
    );
    await vaultCreationPage.expectNetworkConfirmation(/Internet Computer/);
    await vaultCreationPage.expectConfirmationButton();

    await vaultCreationPage.clickConfirm();

    await vaultsPage.expectUrl();
  }
});