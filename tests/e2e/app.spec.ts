import { test, expect } from "@playwright/test";

test.describe("PipeInspect E2E", () => {
  test("landing page loads with hero", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Visualize & Optimize");
    await expect(page.locator("text=Get Started")).toBeVisible();
  });

  test("navbar navigation works", async ({ page }) => {
    await page.goto("/");
    await page.click('a[href="/import"]');
    await expect(page).toHaveURL(/\/import/);

    await page.click('a[href="/settings"]');
    await expect(page).toHaveURL(/\/settings/);
  });

  test("import page shows three methods", async ({ page }) => {
    await page.goto("/import");
    await expect(page.locator("text=Paste Config")).toBeVisible();
    await expect(page.locator("text=Upload File")).toBeVisible();
    await expect(page.locator("text=GitHub URL")).toBeVisible();
  });

  test("load sample and analyze", async ({ page }) => {
    await page.goto("/import");
    await page.click("text=Load sample GitHub Actions config");

    // Wait for config to load
    const textarea = page.locator("textarea");
    await expect(textarea).toHaveValue(/.+/);

    // Click analyze
    await page.click("text=Analyze Pipeline");

    // Should navigate to visualize
    await page.waitForURL(/\/visualize/, { timeout: 15000 });
    await expect(page.locator("text=Pipeline Visualization")).toBeVisible();
  });

  test("settings page loads", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("text=Cost Model")).toBeVisible();
    await expect(page.locator("text=API Integrations")).toBeVisible();
  });

  test("compare page loads", async ({ page }) => {
    await page.goto("/compare");
    await expect(page.locator("text=Side-by-Side Comparison")).toBeVisible();
    await expect(page.locator("text=Before (Original Config)")).toBeVisible();
    await expect(page.locator("text=After (Optimized Config)")).toBeVisible();
  });

  test("health API returns healthy", async ({ page }) => {
    const response = await page.request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe("healthy");
    expect(data.service).toBe("pipeinspect");
  });

  test("badge API returns SVG", async ({ page }) => {
    const response = await page.request.get("/api/export-badge?label=test&value=passing&color=green");
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("image/svg+xml");
    const svg = await response.text();
    expect(svg).toContain("<svg");
    expect(svg).toContain("test");
    expect(svg).toContain("passing");
  });

  test("analyses page loads", async ({ page }) => {
    await page.goto("/analyses");
    await expect(page.locator("text=Saved Analyses")).toBeVisible();
  });

  test("footer is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=CI Pipeline Visualizer & Optimizer")).toBeVisible();
  });
});
