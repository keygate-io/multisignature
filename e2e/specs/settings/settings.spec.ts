import { register } from "../../fixtures/auth.fixture";
import { vaultSelection } from "../../fixtures/vault.fixture";
import { ScreenshotUtil } from "../../utils/screenshots";

vaultSelection(
  "user can view settings in default state",
  async ({ vaultDetailPage, page }) => {
    // 1 of 1 signers
    // take screenshot using screenshotutil
    const screenshotUtil = new ScreenshotUtil(page, register.info());

    const settingsPage = await vaultDetailPage.navigateToSettings();

    await screenshotUtil.takeScreenshot("settings_default_state_1");
    await settingsPage.expectUrl();

    await screenshotUtil.takeScreenshot("settings_default_state_2");
  }
);
