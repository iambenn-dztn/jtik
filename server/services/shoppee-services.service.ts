import { chromium } from "playwright";
import { dbService } from "./mongodb.service.js";

export const refreshCookie = async () => {
  // 📋 Lấy account active đầu tiên từ database
  const firstAccount = await dbService.getFirstActiveAccount();
  console.log("firstAccount", firstAccount);

  if (!firstAccount) {
    throw new Error("❌ Không tìm thấy account active trong database");
  }

  console.log(`🔐 Sử dụng account: ${firstAccount.username}`);

  const SHOPEE_USER = firstAccount.username;
  const SHOPEE_PASS = firstAccount.password;
  const browser = await chromium.launch({
    headless: false, // 👁️ HIỆN UI
    slowMo: 50, // 🐢 chạy chậm để nhìn rõ
    devtools: false, // 🔧 mở DevTools
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const context = await browser.newContext({
    locale: "vi-VN",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();

  // 🔎 LOG REQUEST / RESPONSE
  page.on("request", (req) => {
    if (req.url().includes("/api/")) {
      console.log("➡️", req.method(), req.url());
    }
  });

  page.on("response", (res) => {
    if (res.url().includes("/api/")) {
      console.log("⬅️", res.status(), res.url());
    }
  });

  // ❌ KHÔNG block asset khi debug
  await page.goto("https://shopee.vn/buyer/login", {
    waitUntil: "domcontentloaded",
  });

  // 🌐 Xử lý popup chọn ngôn ngữ (nếu có)
  try {
    const languageButton = await page.waitForSelector(
      'button.shopee-button-outline.vsIIDR:has-text("Tiếng Việt")',
      {
        timeout: 3000,
      }
    );
    if (languageButton) {
      await languageButton.click();
      console.log("✅ Đã chọn ngôn ngữ Tiếng Việt");
      await page.waitForTimeout(1000); // đợi popup đóng
    }
  } catch (error) {
    // Popup không xuất hiện, tiếp tục bình thường
    console.log("ℹ️ Không có popup chọn ngôn ngữ");
  }

  await page.fill('input[name="loginKey"]', SHOPEE_USER!);
  await page.fill('input[name="password"]', SHOPEE_PASS!);

  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle" }),
    page.click('button:has-text("Đăng nhập")'),
  ]);

  // 🧪 fake search để ép sinh cookie
  await page.evaluate(() =>
    fetch("https://shopee.vn/api/v4/search/search_hint?keyword=a&version=1", {
      credentials: "include",
    })
  );

  // 🍪 log cookie realtime
  const cookies = await context.cookies();
  console.table(
    cookies
      .filter((c) => c.name.startsWith("SPC"))
      .map((c) => ({
        name: c.name,
        domain: c.domain,
        expires: c.expires,
      }))
  );

  // ❗ KHÔNG close browser để bạn xem UI
  await browser.close();

  const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

  // 💾 Lưu cookie vào account trong database
  await dbService.updateAccount(firstAccount.id, { cookie: cookieString });
  console.log(`✅ Đã lưu cookie vào account ${firstAccount.username}`);

  return cookieString;
};

/**
 * Lấy cookie từ account active trong database
 * Nếu không có cookie hoặc cookie hết hạn, sẽ refresh cookie mới
 */
export const getCookie = async (): Promise<string> => {
  const accounts = await dbService.getAccounts();
  const firstAccount = accounts.find((acc) => acc.status === "active");

  if (!firstAccount) {
    throw new Error("❌ Không tìm thấy account active trong database");
  }

  // Nếu đã có cookie, trả về luôn
  if (firstAccount.cookie) {
    console.log(`🍪 Sử dụng cookie có sẵn của ${firstAccount.username}`);
    return firstAccount.cookie;
  }

  // Nếu chưa có, refresh cookie mới
  console.log(`🔄 Chưa có cookie, đang refresh...`);
  return await refreshCookie();
};
