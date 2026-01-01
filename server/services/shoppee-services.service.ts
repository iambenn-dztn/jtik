import axios from "axios";
import { chromium } from "playwright";

export const refreshCookie = async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://shopee.vn/buyer/login");
  await page.fill('input[name="loginKey"]', "0338388565");
  await page.fill('input[name="password"]', "Iambenn99@");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/shopee.vn/**");
  const cookies = await context.cookies();
  console.log("Refreshed Shopee cookies:", cookies);
  await browser.close();
  return cookies;
};
