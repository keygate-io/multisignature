import { vaultSelection } from "../../fixtures/vault.fixture";
import { ScreenshotUtil } from "../../utils/screenshots";

vaultSelection(
  "user can create an icp transaction and is successfully executed",
  async ({ vaultDetailPage, page }) => {
    const newTransactionPage = await vaultDetailPage.navigateToNewTransaction();
    await newTransactionPage.expectUrl();
    await newTransactionPage.expectFormFields();

    const intent = {
      amount: "0.000000000000000000",
      token: "ICP",
      recipient:
        "8611a2a90f0a3dacf14d980c6cf7ba6e51877022885ce020875a115e8db89021",
    };

    await newTransactionPage.fillIntent(intent);

    await newTransactionPage.nextStep();
    await newTransactionPage.expectReviewStep();
    await newTransactionPage.expectTransactionDetails({
      amount: `${intent.amount} ${intent.token}`,
      network: "ICP",
      recipient: intent.recipient,
    });

    const transactionsPage = await newTransactionPage.confirmTransaction();
    await transactionsPage.expectUrl();

    // screenshot
    // await new ScreenshotUtil(
    //   page,
    //   "user can create an icp transaction and is successfully executed"
    // ).takeElementScreenshot(
    //   "[data-testid='no-transactions-message']",
    //   "transaction list state"
    // );

    await new ScreenshotUtil(
      page,
      "user can create an icp transaction and is successfully executed"
    ).takeScreenshot("transaction list state");

    // check if the last transaction was successful
    await transactionsPage.expectLastTransactionSuccessful();
  }
);

vaultSelection(
  "user can create an icp transaction that fails execution",
  async ({ vaultDetailPage, page }) => {
    const newTransactionPage = await vaultDetailPage.navigateToNewTransaction();
  }
);
