import { register } from "../../fixtures/auth.fixture";
import { vaultSelection } from "../../fixtures/vault.fixture";
import { fundICPPrincipal, fundIcrcAddress } from "../../utils/ledger";
import { setupConsoleLogger } from "../../utils/logging";
import { ScreenshotUtil } from "../../utils/screenshots";

vaultSelection(
  "user can create an icp transaction and is successfully executed",
  async ({ vaultDetailPage, page }) => {
    const address = await vaultDetailPage.getAddress();
    await fundICPPrincipal(address, 15);

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

vaultSelection(
  "user can create an icrc transaction and is successfully executed",
  async ({ vaultDetailPage, page }) => {
    const screenshotUtil = new ScreenshotUtil(page, register.info());
    await screenshotUtil.takeScreenshot("initial vault detail page");

    const vault_principal = await vaultDetailPage.getPrincipal();
    await fundIcrcAddress(vault_principal!, 15);
    await screenshotUtil.takeScreenshot("vault funded with ICRC tokens");

    const newTransactionPage = await vaultDetailPage.navigateToNewTransaction();
    await newTransactionPage.expectUrl();
    await newTransactionPage.expectFormFields();
    await screenshotUtil.takeScreenshot("new transaction form");

    const intent = {
      amount: "10",
      token: "MCK",
      recipient:
        "8611a2a90f0a3dacf14d980c6cf7ba6e51877022885ce020875a115e8db89021",
    };

    await setupConsoleLogger(page, register.info());

    await newTransactionPage.fillIntent(intent);
    await screenshotUtil.takeScreenshot("transaction form filled");

    await newTransactionPage.nextStep();
    await screenshotUtil.takeScreenshot("next step clicked");

    await newTransactionPage.expectReviewStep();
    await newTransactionPage.expectTransactionDetails({
      amount: `${intent.amount} ${intent.token}`,
      network: "MCK",
      recipient: intent.recipient,
    });
    await screenshotUtil.takeScreenshot("transaction review step");

    const transactionsPage = await newTransactionPage.confirmTransaction();
    await transactionsPage.expectUrl();
    await screenshotUtil.takeScreenshot("transaction submitted");

    // check if the last transaction was successful
    await transactionsPage.expectLastTransactionSuccessful();
    await screenshotUtil.takeScreenshot("transaction successful");

    // Additional screenshots of transaction details
    await screenshotUtil.takeScreenshot("transaction list overview");
    await screenshotUtil.takeScreenshot("transaction details expanded");
  }
);