import { register } from "../../fixtures/auth.fixture";

register("new user can create a vault", async ({ vaultsPage }) => {
  await vaultsPage.expectUrl();
  await vaultsPage.expectVaultsListEmpty();

  // screenshot
  await vaultsPage.page.screenshot({ path: "screenshots/vaults-list.png" });

  const vaultCreationPage = await vaultsPage.createVault();
  await vaultCreationPage.expectUrl();
  await vaultCreationPage.expectAccountNameInput();
  await vaultCreationPage.fillAccountName("My Vault");
  await vaultCreationPage.clickNext();

  await vaultCreationPage.expectAccountNameConfirmation(/My Vault/);
  await vaultCreationPage.expectNetworkConfirmation(/Internet Computer/);
  await vaultCreationPage.expectConfirmationButton();

  // screenshot
  await vaultCreationPage.page.screenshot({
    path: "screenshots/vault-creation-page.png",
  });

  await vaultCreationPage.clickConfirm();

  // screenshot
  await vaultsPage.page.screenshot({
    path: "screenshots/vaults-list-after-creation.png",
  });

  await vaultsPage.expectUrl();
  await vaultsPage.expectVaultsList();

  await vaultsPage.expectVaultWithName("My Vault");
});

register("user can create multiple vaults", async ({ vaultsPage }) => {
  await vaultsPage.expectUrl();
  await vaultsPage.expectVaultsListEmpty();

  // Create multiple vaults
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
    await vaultsPage.expectVaultsList();
    await vaultsPage.expectVaultWithName(vaultName);
  }

  // Verify all vaults exist in final list
  for (const vaultName of vaultNames) {
    await vaultsPage.expectVaultWithName(vaultName);
  }
});