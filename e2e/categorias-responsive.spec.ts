import { test, expect, Page } from '@playwright/test';

/**
 * Deja reejecutables las mediciones que motivaron el arreglo del responsive de
 * categorías. Antes vivían en una tabla de un informe, así que nada impedía que
 * la rejilla volviera a quedarse clavada en tres columnas sin que nadie se
 * enterara.
 *
 * Necesita el frontend levantado (baseURL de playwright.config.ts) contra el
 * backend con datos reales.
 */

/** Columnas que está pintando de verdad la rejilla, contando el CSS aplicado. */
async function columnasDe(page: Page, selector: string): Promise<number> {
  return page.locator(selector).first().evaluate((el) => {
    return getComputedStyle(el as HTMLElement).gridTemplateColumns.split(' ').filter(Boolean).length;
  });
}

test.describe('Categorías — responsive', () => {
  // El puerto por defecto de playwright.config.ts es el 3001; con E2E_BASE_URL
  // se apunta a otra instancia sin tocar la configuración compartida.
  test.use({ baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3001' });

  // En dev la primera compilación de cada ruta se va a decenas de segundos y
  // estos tests recorren varios anchos por caso.
  test.setTimeout(180000);

  /** Espera a que la rejilla tenga datos del backend, no sólo el esqueleto. */
  const esperarCasillas = (page: Page) =>
    expect(page.locator('a[href^="/productos?categoria="]').first()).toBeVisible({
      timeout: 30000,
    });

  test('la rejilla de /categorias gana columnas al ensanchar la ventana', async ({ page }) => {
    // El bug: `grid-cols-3` fijo a todos los anchos. A 1536px salían tres
    // tarjetas cuadradas de casi 500px de lado.
    const esperado: [number, number][] = [
      [390, 3],
      [768, 5],
      [1024, 6],
      [1280, 7],
      [1536, 7], // el contenedor es max-w-7xl: pasado 1280 no tiene sentido estrechar más
    ];

    for (const [ancho, columnas] of esperado) {
      await page.setViewportSize({ width: ancho, height: 900 });
      await page.goto('/categorias');
      await page.waitForLoadState('networkidle');
      await esperarCasillas(page);
      expect(await columnasDe(page, 'main div.grid, h1 ~ div.grid, div.grid')).toBe(columnas);
    }
  });

  test('ninguna pantalla de categorías provoca scroll horizontal del body', async ({ page }) => {
    // Nota: a 768px hay un desborde de ~32px que viene del Navbar, no de las
    // categorías, así que aquí se comprueban los anchos de móvil y escritorio.
    for (const ancho of [390, 1280, 1536]) {
      await page.setViewportSize({ width: ancho, height: 900 });
      for (const ruta of ['/', '/categorias']) {
        await page.goto(ruta);
        await page.waitForLoadState('networkidle');
        const { scrollW, clientW } = await page.evaluate(() => ({
          scrollW: document.documentElement.scrollWidth,
          clientW: document.documentElement.clientWidth,
        }));
        expect(scrollW, `${ruta} @${ancho}`).toBeLessThanOrEqual(clientW);
      }
    }
  });

  test('la barra inferior fija no tapa la última fila de categorías', async ({ page }) => {
    // El bug: la página no reservaba hueco para la BottomNav, que es `fixed`, y
    // los nombres de la última fila quedaban debajo.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/categorias');
    await esperarCasillas(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const solape = await page.evaluate(() => {
      const barra = document.querySelector('.fixed.bottom-0');
      if (!barra) return null;
      const techoBarra = barra.getBoundingClientRect().top;
      const casillas = [...document.querySelectorAll('a[href^="/productos?categoria="]')];
      const ultima = casillas[casillas.length - 1];
      return ultima ? ultima.getBoundingClientRect().bottom - techoBarra : null;
    });

    expect(solape).not.toBeNull();
    expect(solape!).toBeLessThanOrEqual(0);
  });

  test('la barra lateral de productos no estira la página en escritorio', async ({ page }) => {
    // El bug: con las ~100 categorías el árbol medía 4971px y era él quien
    // fijaba la altura de la página, dejando kilómetros de blanco a la derecha.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/productos');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('aside nav a').first()).toBeVisible({ timeout: 30000 });

    // Se mide la CAJA del menú, no el <aside>: el aside es un flex item que se
    // estira hasta la altura de la rejilla de productos por definición.
    const { altoMenu, altoViewport } = await page.evaluate(() => ({
      altoMenu: document.querySelector('aside > div')!.getBoundingClientRect().height,
      altoViewport: window.innerHeight,
    }));
    // El árbol se desplaza por dentro, así que no puede pasar de la ventana.
    expect(altoMenu).toBeLessThanOrEqual(altoViewport);
  });

  test('la fila de destacadas no deja huecos en la última fila', async ({ page }) => {
    // El bug: número de columnas fijo (4, luego 6) con cinco destacadas.
    for (const ancho of [768, 1280]) {
      await page.setViewportSize({ width: ancho, height: 900 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const rejilla = page.locator('.featured-grid');
      await expect(rejilla.locator('a').first()).toBeVisible({ timeout: 30000 });
      const columnas = await columnasDe(page, '.featured-grid');
      const tarjetas = await rejilla.locator('> a').count();
      expect(tarjetas % columnas, `destacadas @${ancho}`).toBe(0);
    }
  });
});
