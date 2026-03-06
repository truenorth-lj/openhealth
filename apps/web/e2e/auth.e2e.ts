import { test, expect } from "@playwright/test";

// Helper: open login dialog by clicking the FAB (+ button) on diary page
async function openLoginDialog(page: import("@playwright/test").Page) {
  await page.goto("/diary");
  const fab = page.getByTestId("add-entry-fab");
  await expect(fab).toBeVisible({ timeout: 15_000 });
  await fab.click();
  await expect(page.getByText("登入以繼續")).toBeVisible({ timeout: 10_000 });
}

// The mode toggle button is a <button> inside a <p> at the bottom of the dialog
function modeToggle(page: import("@playwright/test").Page, parentText: string) {
  return page.locator("p").filter({ hasText: parentText }).locator("button");
}

test.describe("Authentication flow", () => {
  test("FAB click opens login dialog for unauthenticated users", async ({ page }) => {
    await openLoginDialog(page);
  });

  test("login dialog has email and password fields", async ({ page }) => {
    await openLoginDialog(page);

    await expect(page.getByPlaceholder("電子郵件")).toBeVisible();
    await expect(page.getByPlaceholder("密碼")).toBeVisible();
    await expect(page.locator("button[type='submit']")).toBeVisible();
  });

  test("can switch between login and register modes", async ({ page }) => {
    await openLoginDialog(page);

    // Switch to register
    await modeToggle(page, "還沒有帳號").click();
    await expect(page.getByText("建立帳號")).toBeVisible();
    await expect(page.getByPlaceholder("名稱")).toBeVisible();
    await expect(page.getByPlaceholder("密碼 (至少 8 字元)")).toBeVisible();

    // Switch back to login
    await modeToggle(page, "已有帳號").click();
    await expect(page.getByText("登入以繼續")).toBeVisible();
  });

  test("shows Google and Apple OAuth buttons", async ({ page }) => {
    await openLoginDialog(page);

    await expect(page.getByRole("button", { name: /Google/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Apple/ })).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await openLoginDialog(page);

    await page.getByPlaceholder("電子郵件").fill("nonexistent@test.com");
    await page.getByPlaceholder("密碼").fill("wrongpassword123");
    await page.locator("button[type='submit']").click();

    // Better Auth returns error — dialog shows error div
    await expect(page.locator("[role='alert'], .rounded-md.p-3")).toBeVisible({ timeout: 10_000 });
  });

  test("register form has minlength validation on password", async ({ page }) => {
    await openLoginDialog(page);

    await modeToggle(page, "還沒有帳號").click();

    const passwordInput = page.getByPlaceholder("密碼 (至少 8 字元)");
    await expect(passwordInput).toHaveAttribute("minlength", "8");
  });
});
