import { register } from "../../fixtures/auth.fixture";
import { vaultSelection } from "../../fixtures/vault.fixture";
import { fundAddress } from "../../utils/ledger";
import { setupConsoleLogger } from "../../utils/logging";
import { ScreenshotUtil } from "../../utils/screenshots";

vaultSelection(
  "user can create an icp transaction and is successfully executed",
  async ({ vaultDetailPage, page }) => {
    const address = await vaultDetailPage.getAddress();
    await fundAddress(address, 15);

    const newTransactionPage = await vaultDetailPage.navigateToNewTransaction();
    await newTransactionPage.expectUrl();
    await newTransactionPage.expectFormFields();

    const intent = {
      amount: "10",
      token: "ICP",
      recipient:
        "8611a2a90f0a3dacf14d980c6cf7ba6e51877022885ce020875a115e8db89021",
    };

    await setupConsoleLogger(page, register.info());

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

    await new ScreenshotUtil(page, register.info()).takeScreenshot(
      "transaction list state"
    );

    // check if the last transaction was successful
    await transactionsPage.expectLastTransactionSuccessful();

    await new ScreenshotUtil(page, register.info()).takeScreenshot(
      "transaction list state after transaction"
    );
  }
);
