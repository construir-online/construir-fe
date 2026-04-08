import { test, expect, Page } from '@playwright/test';

const ADMIN_EMAIL = 'admin@construir.com';
const ADMIN_PASSWORD = 'Admin123.';
const DESKTOP = { width: 1280, height: 800 };

async function loginAsAdmin(page: Page) {
  await page.goto('/admin/login');
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
  await page.fill('input[type="email"], input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"], input[name="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin/dashboard**', { timeout: 15000 });
}

test.describe('Admin — Gestión de productos', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await loginAsAdmin(page);
  });

  test('la lista de productos carga con tabla o mensaje vacío', async ({ page }) => {
    await page.goto('/admin/dashboard/productos');
    await page.waitForLoadState('networkidle');

    const content = page.locator('table, [class*="rounded-lg"]').first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test('crear producto con nombre y SKU mínimos redirige a la lista', async ({ page }) => {
    await page.goto('/admin/dashboard/productos/nuevo');
    await page.waitForLoadState('networkidle');

    const productName = `Producto Test ${Date.now()}`;
    const sku = `SKU-${Date.now()}`;

    await page.fill('input[required]', productName);
    // SKU — segundo campo required
    const requiredInputs = await page.locator('input[required]').all();
    if (requiredInputs.length >= 2) {
      await requiredInputs[1].fill(sku);
    }

    await page.click('button[type="submit"]');

    // Debe redirigir a la lista o mostrar éxito
    await expect(page).toHaveURL(/\/admin\/dashboard\/productos/, { timeout: 15000 });
  });

  test('crear producto sin nombre muestra error de validación', async ({ page }) => {
    await page.goto('/admin/dashboard/productos/nuevo');
    await page.waitForLoadState('networkidle');

    await page.click('button[type="submit"]');

    // HTML5 validation o mensaje de error personalizado
    const nameInput = page.locator('input[required]').first();
    const validationMsg = await nameInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMsg).toBeTruthy();
  });

  test('buscar producto en la tabla filtra los resultados', async ({ page }) => {
    await page.goto('/admin/dashboard/productos');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="uscar"], input[type="search"]').first();
    if (await searchInput.count() === 0) {
      test.skip();
      return;
    }

    await searchInput.fill('zzz-producto-inexistente-xyz');
    await page.waitForTimeout(600);

    // La tabla debe tener menos filas o mostrar estado vacío
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    const emptyState = page.locator('[class*="text-gray-500"]:has-text("product"), p:has-text("Sin productos")');

    expect(rowCount === 0 || await emptyState.count() > 0).toBe(true);
  });

  test('precio e inventario son campos de solo lectura', async ({ page }) => {
    await page.goto('/admin/dashboard/productos/nuevo');
    await page.waitForLoadState('networkidle');

    const priceInput = page.locator('input[type="number"]').first();
    const isReadOnly = await priceInput.getAttribute('readonly');
    expect(isReadOnly).not.toBeNull();
  });
});
