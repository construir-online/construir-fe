/**
 * Verificación en navegador del paso de la sesión a cookie `httpOnly`.
 *
 * No es una prueba de la suite: es el guion que produce la EVIDENCIA de que la
 * gente puede seguir entrando, porque una suite verde no lo demuestra. Vuelca
 * en crudo `localStorage`, `document.cookie` y la cabecera `Set-Cookie`.
 *
 *   node e2e-httponly/verificar-sesion.mjs
 */
import { chromium } from 'playwright';

const FE = process.env.FE_URL || 'http://localhost:3025';
const BE = process.env.BE_URL || 'http://localhost:3010';

const ADMIN = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD };
const ORDER_ADMIN = { email: process.env.ORDER_ADMIN_EMAIL, password: process.env.ORDER_ADMIN_PASSWORD };
const CLIENTE = { email: process.env.CLIENTE_EMAIL, password: process.env.CLIENTE_PASSWORD };

let fallos = 0;
const ok = (m) => console.log(`  OK   ${m}`);
const mal = (m) => { fallos++; console.log(`  FALLA ${m}`); };
const comprobar = (cond, m) => (cond ? ok(m) : mal(m));
const titulo = (t) => console.log(`\n=== ${t} ===`);

/** Vuelca sin filtrar todo lo que el JavaScript de la página puede ver. */
async function volcado(page, etiqueta) {
  const d = await page.evaluate(() => ({
    localStorage: Object.fromEntries(Object.entries(localStorage)),
    sessionStorage: Object.fromEntries(Object.entries(sessionStorage)),
    documentCookie: document.cookie,
  }));
  console.log(`\n--- VOLCADO CRUDO (${etiqueta}) ---`);
  console.log(`localStorage    = ${JSON.stringify(d.localStorage)}`);
  console.log(`sessionStorage  = ${JSON.stringify(d.sessionStorage)}`);
  console.log(`document.cookie = ${JSON.stringify(d.documentCookie)}`);
  console.log('---');
  return d;
}

/** ¿Hay algo con pinta de JWT en lo que el JS alcanza? */
const hayJwt = (d) => {
  const todo = JSON.stringify(d.localStorage) + JSON.stringify(d.sessionStorage) + d.documentCookie;
  return /eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\./.test(todo);
};

/** Login por la pantalla indicada; devuelve la cabecera `Set-Cookie` cruda. */
async function entrarPorPantalla(page, ruta, cred) {
  let setCookie = null;
  const oyente = async (res) => {
    if (res.url().endsWith('/auth/login') && res.request().method() === 'POST') {
      const h = await res.allHeaders();
      setCookie = h['set-cookie'] ?? null;
    }
  };
  page.on('response', oyente);

  await page.goto(`${FE}${ruta}`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', cred.email);
  await page.fill('input[type="password"]', cred.password);
  await Promise.all([
    page.waitForResponse((r) => r.url().endsWith('/auth/login')),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(2500);
  page.off('response', oyente);
  return setCookie;
}

async function main() {
  const browser = await chromium.launch();

  // ───────────────────────── 1. TIENDA ─────────────────────────
  titulo('1. Entrar en la TIENDA (/login)');
  let ctx = await browser.newContext();
  let page = await ctx.newPage();

  const setCookieTienda = await entrarPorPantalla(page, '/login', CLIENTE);
  console.log(`\nSet-Cookie CRUDA (tienda):\n  ${setCookieTienda}`);
  comprobar(/HttpOnly/i.test(setCookieTienda || ''), 'la cookie llega con HttpOnly');
  comprobar(/SameSite=/i.test(setCookieTienda || ''), 'la cookie llega con SameSite');
  comprobar(/^token=/.test(setCookieTienda || ''), 'la cookie se llama `token` (la que lee el middleware)');

  const dTienda = await volcado(page, 'tienda, con sesión iniciada');
  comprobar(!hayJwt(dTienda), 'NO hay ningún JWT en localStorage / sessionStorage / document.cookie');
  comprobar(dTienda.localStorage.token === undefined, 'localStorage.token no existe');
  comprobar(!/(^|;\s*)token=/.test(dTienda.documentCookie), 'document.cookie no expone `token`');

  // La cookie sí existe, pero sólo el navegador la ve.
  const galletas = await ctx.cookies();
  const galleta = galletas.find((c) => c.name === 'token');
  console.log(`\nCookie vista por el navegador: ${JSON.stringify(galleta)}`);
  comprobar(!!galleta && galleta.httpOnly === true, 'el navegador la guarda marcada httpOnly');

  // Sesión de verdad: el perfil carga.
  const perfil = await page.evaluate(async (be) => {
    const r = await fetch(`${be}/auth/profile`, { credentials: 'include' });
    return { status: r.status, body: r.ok ? await r.json() : null };
  }, BE);
  console.log(`GET /auth/profile -> ${perfil.status} ${JSON.stringify(perfil.body?.email)}`);
  comprobar(perfil.status === 200, 'la sesión sirve: /auth/profile responde 200');

  // ── Recargar mantiene la sesión ──
  titulo('2. Recargar la página mantiene la sesión');
  await page.goto(`${FE}/mi-cuenta`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const trasRecarga = await page.evaluate(async (be) => {
    const r = await fetch(`${be}/auth/profile`, { credentials: 'include' });
    return r.status;
  }, BE);
  comprobar(trasRecarga === 200, `tras recargar sigue habiendo sesión (perfil ${trasRecarga})`);
  comprobar(!page.url().includes('/login'), `no rebotó a login (url: ${page.url()})`);

  // ── Carrito ──
  titulo('3. El carrito con sesión iniciada');
  const carrito = await page.evaluate(async (be) => {
    const prods = await (await fetch(`${be}/products?limit=60`, { credentials: 'include' })).json();
    const lista = Array.isArray(prods) ? prods : (prods.data ?? prods.products ?? []);
    const uuid = lista.find((p) => (p.inventory ?? 0) >= 1)?.uuid;
    if (!uuid) return { error: 'sin productos con existencias' };
    const r = await fetch(`${be}/cart/items`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productUuid: uuid, quantity: 1 }),
    });
    return { status: r.status, cuerpo: r.ok ? await r.json() : await r.text() };
  }, BE);
  console.log(`POST /cart/items -> ${carrito.status ?? carrito.error}`);
  comprobar(
    carrito.status === 200 || carrito.status === 201,
    'se puede agregar un producto al carrito con la cookie de sesión',
  );

  // ── Logout ──
  titulo('4. Cerrar sesión invalida de verdad');
  const antesDeSalir = await page.evaluate(async (be) => {
    const r = await fetch(`${be}/auth/profile`, { credentials: 'include' });
    return r.status;
  }, BE);
  const salida = await page.evaluate(async (be) => {
    const r = await fetch(`${be}/auth/logout`, { method: 'POST', credentials: 'include' });
    return { status: r.status, setCookie: r.headers.get('set-cookie') };
  }, BE);
  const despuesDeSalir = await page.evaluate(async (be) => {
    const r = await fetch(`${be}/auth/profile`, { credentials: 'include' });
    return r.status;
  }, BE);
  console.log(`perfil antes=${antesDeSalir}  POST /auth/logout=${salida.status}  perfil después=${despuesDeSalir}`);
  comprobar(antesDeSalir === 200 && despuesDeSalir === 401,
    'tras salir, una petición autenticada falla (401)');
  const galletasTrasSalir = await ctx.cookies();
  console.log(`cookies tras salir: ${JSON.stringify(galletasTrasSalir.map((c) => c.name))}`);
  comprobar(!galletasTrasSalir.some((c) => c.name === 'token' && c.value),
    'la cookie `token` ya no está en el navegador');

  await ctx.close();

  // ───────────────────── 5. Sincronización del carrito ─────────────────────
  titulo('5. El carrito de invitado se sincroniza al entrar');
  ctx = await browser.newContext();
  page = await ctx.newPage();
  await page.goto(`${FE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.evaluate((c) => { window.__CRED = c; }, CLIENTE);

  // Se vacía el carrito del servidor ANTES, o el renglón que quedó de la
  // sección 3 haría pasar la prueba sin que la sincronización hiciera nada.
  const limpieza = await page.evaluate(async (be) => {
    const l = await fetch(`${be}/auth/login`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: window.__CRED.email, password: window.__CRED.password }),
    });
    if (!l.ok) return { error: l.status };
    await fetch(`${be}/cart`, { method: 'DELETE', credentials: 'include' });
    const c = await (await fetch(`${be}/cart`, { credentials: 'include' })).json();
    await fetch(`${be}/auth/logout`, { method: 'POST', credentials: 'include' });
    return { renglonesTrasVaciar: (c.items ?? []).length };
  }, BE);
  console.log(`carrito del servidor vaciado: ${JSON.stringify(limpieza)}`);

  // Hay que elegir un producto CON EXISTENCIAS suficientes: si se siembra una
  // cantidad mayor que el inventario, la sincronización la rechaza con razón y
  // la prueba culpa a la sesión de algo que no es suyo.
  const semilla = await page.evaluate(async (be) => {
    const prods = await (await fetch(`${be}/products?limit=60`)).json();
    const lista = Array.isArray(prods) ? prods : (prods.data ?? prods.products ?? []);
    const apto = lista.find((p) => (p.inventory ?? 0) >= 2);
    return apto ? { uuid: apto.uuid, inventario: apto.inventory } : null;
  }, BE);
  console.log(`producto de prueba: ${JSON.stringify(semilla)}`);
  if (!semilla) { mal('no hay ningún producto con inventario >= 2 para la prueba'); }

  // `localCartService` guarda bajo la clave `cart`.
  await page.evaluate((sem) => {
    localStorage.setItem('cart', JSON.stringify({ items: [{ productUuid: sem.uuid, quantity: 2 }] }));
  }, semilla);
  console.log(`carrito de INVITADO sembrado: ${await page.evaluate(() => localStorage.getItem('cart'))}`);

  const setCookie2 = await entrarPorPantalla(page, '/login', CLIENTE);
  await page.waitForTimeout(6000);
  const trasSync = await page.evaluate(async (be) => {
    const r = await fetch(`${be}/cart`, { credentials: 'include' });
    const c = r.ok ? await r.json() : null;
    return {
      status: r.status,
      items: (c?.items ?? []).map((i) => ({ uuid: i.product?.uuid, cantidad: i.quantity })),
      carritoLocal: localStorage.getItem('cart'),
    };
  }, BE);
  console.log(`GET /cart -> ${trasSync.status}, renglones=${JSON.stringify(trasSync.items)}`);
  console.log(`carrito local tras entrar: ${trasSync.carritoLocal}`);
  comprobar(trasSync.status === 200, 'el carrito del servidor carga tras entrar');
  comprobar(
    trasSync.items.some((i) => i.uuid === semilla.uuid && i.cantidad === 2),
    'el carrito de INVITADO se sincronizó al servidor tras entrar (cantidad 2)',
  );
  comprobar(!trasSync.carritoLocal || JSON.parse(trasSync.carritoLocal).items.length === 0,
    'el carrito local quedó vacío tras sincronizar');
  comprobar(setCookie2 !== null, 'el segundo login también emitió la cookie');
  await ctx.close();

  // ───────────────────── 6. PANEL: login y pantallas ─────────────────────
  titulo('6. Entrar en el PANEL (/admin/login) y recorrer las pantallas');
  ctx = await browser.newContext();
  page = await ctx.newPage();

  const setCookieAdmin = await entrarPorPantalla(page, '/admin/login', ADMIN);
  console.log(`\nSet-Cookie CRUDA (panel):\n  ${setCookieAdmin}`);
  comprobar(/HttpOnly/i.test(setCookieAdmin || ''), 'la cookie del panel llega con HttpOnly');
  comprobar(/SameSite=/i.test(setCookieAdmin || ''), 'la cookie del panel llega con SameSite');

  const dAdmin = await volcado(page, 'panel, con sesión de admin');
  comprobar(!hayJwt(dAdmin), 'NO hay ningún JWT al alcance del JS en el panel');
  comprobar(dAdmin.localStorage.user === undefined,
    'tampoco queda el perfil (`user`) guardado en localStorage');

  console.log(`url tras entrar: ${page.url()}`);
  comprobar(page.url().includes('/admin/dashboard'), 'el login del panel redirige al dashboard');

  // Recorrido: se mira que CARGUEN DATOS, no que pinten.
  const pantallas = [
    { ruta: '/admin/dashboard', nombre: 'Dashboard', apis: ['/orders/admin/stats'] },
    { ruta: '/admin/dashboard/ordenes', nombre: 'Pedidos', apis: ['/orders/admin/filter'] },
    { ruta: '/admin/dashboard/clientes', nombre: 'Clientes', apis: ['/customers'] },
    { ruta: '/admin/dashboard/productos', nombre: 'Productos', apis: ['/products'] },
    { ruta: '/admin/dashboard/cupones', nombre: 'Cupones', apis: ['/discounts'] },
    { ruta: '/admin/dashboard/banners', nombre: 'Banners', apis: ['/banners'] },
    { ruta: '/admin/dashboard/api-keys', nombre: 'API keys', apis: ['/admin/api-keys'] },
    { ruta: '/admin/dashboard/categories', nombre: 'Categorías', apis: ['/categories'] },
  ];

  for (const p of pantallas) {
    // Se ESPERA la llamada concreta de la pantalla en vez de mirar una ventana
    // de tiempo fija: la navegación del panel es asíncrona y con una ventana
    // las peticiones de una pantalla caían en la captura de la siguiente.
    const esperada = page
      .waitForResponse(
        (r) => r.url().startsWith(BE) &&
               p.apis.some((a) => r.url().slice(BE.length).startsWith(a)),
        { timeout: 20000 },
      )
      .catch(() => null);

    const otras = [];
    const oyente = (res) => {
      const u = res.url();
      if (u.startsWith(BE)) otras.push({ url: u.slice(BE.length), status: res.status() });
    };
    page.on('response', oyente);

    await page.goto(`${FE}${p.ruta}`, { waitUntil: 'domcontentloaded' });
    const res = await esperada;
    await page.waitForTimeout(1500);
    page.off('response', oyente);

    const urlFinal = page.url();
    const cuerpo = res ? await res.text().catch(() => '') : '';

    console.log(`\n[${p.nombre}] ${p.ruta}`);
    console.log(`  url final: ${urlFinal}`);
    console.log(`  llamada esperada: ${res ? `${res.status()} ${res.url().slice(BE.length)}` : 'NO LLEGÓ'}`);
    console.log(`  datos recibidos: ${cuerpo.length} bytes — ${cuerpo.slice(0, 160).replace(/\s+/g, ' ')}`);
    console.log(`  otras llamadas: ${JSON.stringify(otras.map((r) => `${r.status} ${r.url}`))}`);

    comprobar(urlFinal.includes(p.ruta), `${p.nombre}: no rebotó a login`);
    comprobar(!!res && res.status() < 400 && cuerpo.length > 2,
      `${p.nombre}: cargó DATOS de la API con la cookie`);

    const no2xx = otras.filter((r) => r.status >= 400 && !r.url.startsWith('/analytics/page-view'));
    if (no2xx.length) console.log(`  AVISO respuestas >=400: ${JSON.stringify(no2xx)}`);
  }

  // Exportación a CSV: era un `fetch` suelto que leía el token de localStorage.
  titulo('7. Descargas del panel (los `fetch` sueltos migrados)');
  const csv = await page.evaluate(async (be) => {
    const a = await fetch(`${be}/customers/export/csv`, { credentials: 'include' });
    const b = await fetch(`${be}/orders/admin/export/csv`, { credentials: 'include' });
    return { clientes: a.status, pedidos: b.status };
  }, BE);
  console.log(`export clientes=${csv.clientes}  export pedidos=${csv.pedidos}`);
  comprobar(csv.clientes < 400 && csv.pedidos < 400, 'las exportaciones a CSV van con sesión');

  await ctx.close();

  // ───────────────────── 8. Middleware ─────────────────────
  titulo('8. El middleware de Next sigue protegiendo');
  ctx = await browser.newContext();
  page = await ctx.newPage();
  await page.goto(`${FE}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  console.log(`sin sesión, /admin/dashboard -> ${page.url()}`);
  comprobar(page.url().includes('/admin/login'), 'sin sesión, /admin/dashboard redirige a login');
  await ctx.close();

  // order_admin: las rutas de sólo-admin siguen vedadas.
  ctx = await browser.newContext();
  page = await ctx.newPage();
  await entrarPorPantalla(page, '/admin/login', ORDER_ADMIN);
  console.log(`order_admin entra en: ${page.url()}`);
  comprobar(page.url().includes('/admin/dashboard'), 'el order_admin entra al panel');

  for (const ruta of ['/admin/dashboard/productos', '/admin/dashboard/clientes', '/admin/dashboard/api-keys']) {
    await page.goto(`${FE}${ruta}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    console.log(`  order_admin -> ${ruta} : ${page.url()}`);
    comprobar(!page.url().includes(ruta), `order_admin sigue vedado de ${ruta}`);
  }

  const dOrderAdmin = await volcado(page, 'panel, sesión order_admin');
  comprobar(!hayJwt(dOrderAdmin), 'tampoco hay JWT al alcance del JS con order_admin');

  // ── El dashboard del gestor de pedidos ──
  // Se rompió al quitar `localStorage['user']`: sin rol, caía en la rama de
  // administrador, pedía estadísticas de productos, recibía 403 y el
  // `Promise.all` se llevaba por delante las de pedidos que sí habían llegado.
  titulo('8b. El dashboard del order_admin carga SUS datos y no pide los ajenos');
  const llamadas = [];
  const oyente = (res) => {
    const u = res.url();
    if (u.startsWith(BE)) llamadas.push({ url: u.slice(BE.length), status: res.status() });
  };
  page.on('response', oyente);
  await page.goto(`${FE}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
  page.off('response', oyente);

  console.log(`  url final: ${page.url()}`);
  console.log(`  llamadas: ${JSON.stringify(llamadas.map((r) => `${r.status} ${r.url}`))}`);

  const deProductos = llamadas.filter((r) => r.url.startsWith('/products/admin'));
  const deOrdenes = llamadas.filter((r) => r.url.startsWith('/orders/admin/stats'));
  const texto = await page.locator('body').innerText();

  comprobar(deProductos.length === 0,
    `no pide endpoints de productos, que le darían 403 (pidió ${deProductos.length})`);
  comprobar(deOrdenes.length > 0 && deOrdenes.every((r) => r.status === 200),
    'carga las estadísticas de pedidos, que son las suyas');
  comprobar(!/Cargando métricas/.test(texto), 'el panel deja de estar "Cargando" y pinta');
  comprobar(!llamadas.some((r) => r.status === 403), 'ninguna llamada devuelve 403');
  console.log(`  extracto del panel: ${texto.slice(0, 220).replace(/\s+/g, ' ')}`);

  await ctx.close();

  // ───────────────────── 9. CORS ─────────────────────
  titulo('9. La lista blanca de CORS rechaza un origen ajeno');
  ctx = await browser.newContext();
  page = await ctx.newPage();
  await page.route('https://sitio-malicioso.example/**', (r) =>
    r.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>ajeno</body></html>' }));
  await page.goto('https://sitio-malicioso.example/');
  const ataque = await page.evaluate(async (be) => {
    try {
      const r = await fetch(`${be}/auth/profile`, { credentials: 'include' });
      return { bloqueado: false, status: r.status };
    } catch (e) {
      return { bloqueado: true, error: String(e) };
    }
  }, BE);
  console.log(`petición desde origen ajeno: ${JSON.stringify(ataque)}`);
  comprobar(ataque.bloqueado === true, 'el navegador bloquea la petición del origen ajeno');
  await ctx.close();

  await browser.close();
  console.log(`\n════════ ${fallos === 0 ? 'TODO OK' : `${fallos} FALLAS`} ════════`);
  process.exit(fallos === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(2); });
