import test from "@playwright/test";
import { HomePage } from "../../pages/home.page";

test("has 'Keygate' in title", async ({ page }) => {
  const homePage = new HomePage({ page, iiPage: null });
  await homePage.goto();
  await homePage.expectTitle();
});

test("has 'Connect with Internet Identity' button", async ({ page }) => {
  const homePage = new HomePage({ page, iiPage: null });
  await homePage.goto();
  await homePage.expectLoginButton();
});
