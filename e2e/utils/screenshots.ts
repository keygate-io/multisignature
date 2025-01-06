import { Page, TestInfo } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

export class ScreenshotUtil {
  private readonly page: Page;
  private readonly testName: string;
  private readonly baseDir: string = "screenshots";

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.testName = testInfo.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  }

  /**
   * Takes a screenshot and saves it in organized directory structure
   * @param screenshotName - Identifier for the screenshot
   * @param fullPage - Whether to capture full page or viewport
   * @returns Path where screenshot was saved
   */
  async takeScreenshot(
    screenshotName: string,
    fullPage: boolean = false
  ): Promise<string> {
    const browserName =
      this.page.context().browser()?.browserType().name() ?? "unknown";
    const dirPath = path.join(this.baseDir, browserName, this.testName);

    await fs.promises.mkdir(dirPath, { recursive: true });

    const sanitizedName = screenshotName
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();
    const fileName = `${sanitizedName}.png`;
    const screenshotPath = path.join(dirPath, fileName);

    await this.page.screenshot({
      path: screenshotPath,
      fullPage,
    });

    return screenshotPath;
  }

  /**
   * Takes element screenshot by selector
   * @param selector - Element selector
   * @param screenshotName - Identifier for the screenshot
   * @returns Path where screenshot was saved
   */
  async takeElementScreenshot(
    selector: string,
    screenshotName: string
  ): Promise<string> {
    const browserName =
      this.page.context().browser()?.browserType().name() ?? "unknown";
    const dirPath = path.join(this.baseDir, browserName, this.testName);

    await fs.promises.mkdir(dirPath, { recursive: true });

    const fileName = `${screenshotName}.png`;
    const screenshotPath = path.join(dirPath, fileName);

    const element = this.page.locator(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    await element.screenshot({
      path: screenshotPath,
    });

    return screenshotPath;
  }
}
