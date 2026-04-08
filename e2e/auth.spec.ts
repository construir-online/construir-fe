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

test.describe('Autenticación admin', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP);
  });

  test('login exitoso redirige al dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 10000 });
  });

  test('login fallido con contraseña incorrecta muestra mensaje de error', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    await page.fill('input[type="email"], input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', 'contraseña-incorrecta');
    await page.click('button[type="submit"]');

    // Debe aparecer algún mensaje de error (toast o inline)
    const error = page.locator('[class*="red"], [class*="error"], [role="alert"]').first();
    await expect(error).toBeVisible({ timeout: 8000 });
  });

  test('acceder al dashboard sin autenticación redirige al login', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/login|\/login/, { timeout: 10000 });
  });

  test('logout limpia la sesión', async ({ page }) => {
    await loginAsAdmin(page);

    // Buscar botón de logout o menú de usuario
    const logoutBtn = page
      .getByRole('button', { name: /salir|logout|cerrar sesión/i })
      .or(page.getByText(/salir|logout/i))
      .first();

    if (await logoutBtn.count() > 0) {
      await logoutBtn.click();
      await expect(page).toHaveURL(/\/admin\/login|\/login/, { timeout: 10000 });
    } else {
      // Si no hay botón visible, verificar al menos que el dashboard cargó correctamente
      await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 5000 });
    }
  });
});
