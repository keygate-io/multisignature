import { test } from "@playwright/test";
import { testWithII } from "@dfinity/internet-identity-playwright";
import { HomePage } from "./pages/home.page";

// test("has Keygate in title", async ({ page }) => {
//   const homePage = new HomePage({ page, iiPage: null });
//   await homePage.goto();
//   await homePage.expectTitle();
// });

// test("has Connect with Internet Identity button", async ({ page }) => {
//   const homePage = new HomePage({ page, iiPage: null });
//   await homePage.goto();
//   await homePage.expectLoginButton();
// });

// testWithII("user can login", async ({ page, iiPage }) => {
//   // 0) Wait for II to be ready
//   await iiPage.waitReady({
//     url: "http://localhost:4943/",
//     timeout: 10000,
//     canisterId: "bd3sg-teaaa-aaaaa-qaaba-cai",
//   });

//   const homePage = new HomePage({ page, iiPage });
//   // 1) Attempt to navigate to the home page
//   await homePage.goto();
//   // 1) Attempt to click on the login button
//   // 2) Complete the II flow
//   await homePage.login();
// });

testWithII("user can login", async ({ page, iiPage }) => {
  // 1. Network logging
  page.on("console", (msg) => console.log(`Page log: ${msg.text()}`));
  page.on("request", (req) => console.log(`Request: ${req.url()}`));
  page.on("response", (res) =>
    console.log(`Response: ${res.url()} - ${res.status()}`)
  );

  // 2. Add page error capture
  page.on("pageerror", (err) => console.error(`Page error: ${err}`));
  page.on("requestfailed", (req) =>
    console.error(`Failed request: ${req.url()}`)
  );

  // Gen 0 screenshot
  await page.screenshot({ path: "debug0.png" });

  // Gen 1 - Ensuring II Page is ready and fully loaded
  await iiPage.waitReady({
    url: "http://localhost:4943",
    canisterId: "bd3sg-teaaa-aaaaa-qaaba-cai",
  });

  // Gen 1 screenshot
  await page.screenshot({ path: "debug1.png" });

  await page.goto("http://localhost:3000/");

  // Gen 2 - Navigating to the home page
  await page.screenshot({ path: "debug2.png" });

  // Gen 3 - Clicking the login button
  await iiPage.signInWithNewIdentity({
    selector: "[data-tid=login-button]",
    captcha: true,
  });

  // Gen 4 - Screenshot after login
  await page.screenshot({ path: "debug3.png" });
});
