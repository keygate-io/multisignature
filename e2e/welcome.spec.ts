import { test } from "@playwright/test";
import { testWithII } from "@dfinity/internet-identity-playwright";
import { HomePage } from "./pages/home.page";

test("has Keygate in title", async ({ page }) => {
  const homePage = new HomePage({ page, iiPage: null });
  await homePage.goto();
  await homePage.expectTitle();
});

test("has Connect with Internet Identity button", async ({ page }) => {
  const homePage = new HomePage({ page, iiPage: null });
  await homePage.goto();
  await homePage.expectLoginButton();
});

testWithII("user can login", async ({ page, iiPage }) => {
  // 0) Wait for II to be ready
  await iiPage.waitReady({
    url: "http://localhost:4943/",
    timeout: 10000,
    canisterId: "bd3sg-teaaa-aaaaa-qaaba-cai",
  });

  const homePage = new HomePage({ page, iiPage });
  // 1) Attempt to navigate to the home page
  await homePage.goto();
  // 1) Attempt to click on the login button
  // 2) Complete the II flow
  await homePage.login();
});

