import { Page, TestInfo } from "@playwright/test";
import fs from "fs";
import path from "path";

export const setupConsoleLogger = async (page: Page, testInfo: TestInfo) => {
  // Extract browser name from test info
  const browserName = testInfo.project.name;

  // Extract test name from test info
  const sanitizedTestName = testInfo.title
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();

  const logDir = path.join("screenshots", browserName, sanitizedTestName);
  const logPath = path.join(logDir, "log.txt");

  await fs.promises.mkdir(logDir, { recursive: true });

  if (
    await fs.promises
      .access(logPath)
      .then(() => true)
      .catch(() => false)
  ) {
    await fs.promises.unlink(logPath);
  }

  const logStream = fs.createWriteStream(logPath, { flags: "a" });
  const timestamp = () => new Date().toISOString();

  page.on("console", async (msg) => {
    const logEntry = `[${timestamp()}] ${msg.type()}: ${msg.text()}\n`;
    logStream.write(logEntry);
    console.log(logEntry);

    if (msg.type() === "trace") {
      logStream.write(`Stack trace: ${msg.text()}\n`);
    }
  });

  page.on("pageerror", (error) => {
    const errorEntry = `[${timestamp()}] Page Error: ${error}\n`;
    logStream.write(errorEntry);
    console.error(errorEntry);
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const errorEntry = `[${timestamp()}] Console Error: ${msg.text()}\n`;
      logStream.write(errorEntry);
      console.error(errorEntry);
    }
  });

  page.on("close", () => {
    logStream.end();
  });

  return logPath;
};
