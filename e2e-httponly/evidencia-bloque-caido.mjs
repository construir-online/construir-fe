/**
 * Evidencia: qué ve el ADMIN cuando un bloque del panel devuelve 500 de verdad.
 *
 * Se intercepta la respuesta real del backend y se sustituye por un 500, que es
 * como se reprodujo el problema: `allSettled` sin estado de error pintaba
 * "Total Productos 0" a una tienda con 1267 productos.
 *
 *   node e2e-httponly/evidencia-bloque-caido.mjs
 */
import { chromium } from 'playwright';

const FE = 'http://localhost:3025';
const BE = 'http://localhost:3010';

const b = await chromium.launch();
const ctx = await b.newContext();
const page = await ctx.newPage();

await page.goto(`${FE}/admin/login`);
await page.fill('input[type="email"]', 'admin@construir.com');
await page.fill('input[type="password"]', 'Admin123.');
await Promise.all([
  page.waitForResponse((r) => r.url().endsWith('/auth/login')),
  page.click('button[type="submit"]'),
]);
await page.waitForTimeout(3000);

const escenarios = [
  { nombre: 'ESTADÍSTICAS DE PRODUCTOS caídas (500)', patron: '**/products/admin/stats*' },
  { nombre: 'MÉTRICAS DE VENTAS caídas (500)', patron: '**/orders/admin/stats*' },
];

for (const e of escenarios) {
  await page.route(e.patron, (r) =>
    r.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ statusCode: 500, message: 'Internal server error' }),
    }),
  );

  await page.goto(`${FE}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
  // Se espera a que el panel TERMINE de cargar en vez de contar segundos: en
  // el primer acceso Next compila la ruta y un tiempo fijo se quedaba corto,
  // capturando un "Cargando..." que no dice nada de lo que se quiere mostrar.
  await page
    .locator('text=/No se pudieron cargar|Total Productos|No hay datos disponibles/')
    .first()
    .waitFor({ timeout: 30000 });
  await page.waitForTimeout(1500);

  const texto = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  const avisa = /No se pudieron cargar/i.test(texto);

  console.log(`\n${'═'.repeat(72)}`);
  console.log(`ESCENARIO: ${e.nombre}`);
  console.log('═'.repeat(72));
  console.log(texto.slice(0, 700));
  console.log(`\n  ¿avisa de error en pantalla? ${avisa ? 'SÍ' : 'NO'}`);
  console.log(`  ¿pinta "Total Productos 0"?  ${/Total Productos 0(?!\d)/.test(texto) ? 'SÍ (MAL)' : 'no'}`);
  console.log(`  ¿pinta "Bajo Stock 0"?       ${/Bajo Stock 0(?!\d)/.test(texto) ? 'SÍ (MAL)' : 'no'}`);
  console.log(`  ¿hay botón de reintentar?    ${/Reintentar/.test(texto) ? 'SÍ' : 'no'}`);

  await page.unroute(e.patron);
}

// Control: sin ningún fallo, ningún aviso y números reales.
await page.goto(`${FE}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
await page.locator('text=/Total Productos/').first().waitFor({ timeout: 30000 });
await page.waitForTimeout(1500);
const sano = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
console.log(`\n${'═'.repeat(72)}`);
console.log('CONTROL: todo responde bien');
console.log('═'.repeat(72));
console.log(sano.slice(0, 500));
console.log(`\n  ¿avisa de error? ${/No se pudieron cargar/i.test(sano) ? 'SÍ (MAL)' : 'no'}`);

await b.close();
