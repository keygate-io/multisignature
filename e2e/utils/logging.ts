import { Page } from "@playwright/test";
import fs from "fs";
import path from "path";

export const setupConsoleLogger = async (
  page: Page,
  browserName: string,
  testName: string
) => {
  // Sanitize test name to be a valid filename
  const sanitizedTestName = testName.replace(/[^a-z0-9]/gi, "_").toLowerCase();

  const logDir = path.join("screenshots", browserName);
  const logPath = path.join(logDir, `${sanitizedTestName}.log`);

  // Ensure directory exists
  await fs.promises.mkdir(logDir, { recursive: true });

  // Clear existing log file if it exists
  if (
    await fs.promises
      .access(logPath)
      .then(() => true)
      .catch(() => false)
  ) {
    await fs.promises.unlink(logPath);
  }

  // Create write stream
  const logStream = fs.createWriteStream(logPath, { flags: "a" });

  // Add timestamp to logs
  const timestamp = () => new Date().toISOString();

  // Listen to all console events
  page.on("console", async (msg) => {
    const logEntry = `[${timestamp()}] ${msg.type()}: ${msg.text()}\n`;

    // Write to file
    logStream.write(logEntry);

    // Also log to console during test execution
    console.log(logEntry);

    // Handle console.trace() calls
    if (msg.type() === "trace") {
      logStream.write(`Stack trace: ${msg.text()}\n`);
    }
  });

  // Handle errors
  page.on("pageerror", (error) => {
    const errorEntry = `[${timestamp()}] Page Error: ${error}\n`;
    logStream.write(errorEntry);
    console.error(errorEntry);
  });

  // Handle console exceptions
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const errorEntry = `[${timestamp()}] Console Error: ${msg.text()}\n`;
      logStream.write(errorEntry);
      console.error(errorEntry);
    }
  });

  // Close stream when page closes
  page.on("close", () => {
    logStream.end();
  });

  // Return the log path for reference
  return logPath;
};
