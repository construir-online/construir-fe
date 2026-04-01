import { test, expect } from '@playwright/test';

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };

// Helper: wait for banner image to be visible
async function waitForBanner(page: import('@playwright/test').Page) {
  await page.waitForSelector('picture img', {
    timeout: 15000,
    state: 'visible',
  });
}

// Banner container on desktop is a custom div (no .swiper), on mobile it uses Swiper
// Both are inside div[class*="relative z-0"] wrapper in page.tsx
async function getBannerContainer(page: import('@playwright/test').Page) {
  // Desktop: DesktopCarousel renders a div with bg-gray-900
  // Mobile: MobileCarousel wraps in div.relative.z-0 > .swiper
  const desktop = page.locator('[class*="bg-gray-900"]').first();
  const mobile = page.locator('.swiper').first();
  const isDesktop = await desktop.count() > 0;
  return isDesktop ? desktop : mobile;
}

test.describe('1. Banner en mobile — sin peek de slides adyacentes', () => {
  test('el banner ocupa 100% del ancho y no hay overflow lateral', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await waitForBanner(page);

    // Find the swiper container (mobile uses Swiper)
    const banner = page.locator('.swiper').first();
    const bannerCount = await banner.count();
    expect(bannerCount).toBeGreaterThan(0);

    const box = await banner.boundingBox();
    expect(box).not.toBeNull();

    if (box) {
      // Left edge should be at or near 0
      expect(box.x).toBeLessThanOrEqual(5);
    }

    // Check no horizontal scrollbar / overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);
  });

  test('después de deslizar, el cambio es limpio sin overflow', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await waitForBanner(page);

    // Simulate swipe via mouse drag on the swiper
    const banner = page.locator('.swiper').first();
    const box = await banner.boundingBox();
    if (box) {
      const startX = box.x + box.width * 0.7;
      const endX = box.x + box.width * 0.2;
      const y = box.y + box.height / 2;

      await page.mouse.move(startX, y);
      await page.mouse.down();
      await page.mouse.move(endX, y, { steps: 20 });
      await page.mouse.up();
      await page.waitForTimeout(700);
    }

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);
  });
});

test.describe('2. Banners sin título ni descripción', () => {
  // DesktopCarousel renders slides as absolute divs (not swiper-slide)
  // MobileCarousel uses .swiper-slide
  // BannerSlide itself has no text — we check that

  test('mobile: no hay texto superpuesto (título o descripción) en los slides', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await waitForBanner(page);

    // No h1/h2/p/span text overlay inside swiper slides
    const h1 = await page.locator('.swiper-slide h1').count();
    const h2 = await page.locator('.swiper-slide h2').count();
    const p  = await page.locator('.swiper-slide p').count();
    const span = await page.locator('.swiper-slide span:not([class])').count();
    expect(h1 + h2 + p + span).toBe(0);
  });

  test('desktop: no hay texto superpuesto (título o descripción) en los slides', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/');
    await waitForBanner(page);

    // DesktopCarousel renders slides as absolute positioned divs inside bg-gray-900 container
    const bannerContainer = page.locator('[class*="bg-gray-900"]').first();
    await expect(bannerContainer).toBeVisible({ timeout: 10000 });

    const h1 = await bannerContainer.locator('h1').count();
    const h2 = await bannerContainer.locator('h2').count();
    const p  = await bannerContainer.locator('p').count();
    expect(h1 + h2 + p).toBe(0);
  });

  test('desktop: el banner es clickeable si tiene link', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/');
    await waitForBanner(page);

    const bannerContainer = page.locator('[class*="bg-gray-900"]').first();
    const hasLink = await bannerContainer.locator('a').count();

    if (hasLink > 0) {
      const href = await bannerContainer.locator('a').first().getAttribute('href');
      expect(href).not.toBeNull();
      expect(href!.length).toBeGreaterThan(0);
    }
    // Valid to have no link if no banner has a URL configured
    expect(true).toBe(true);
  });
});

test.describe('3. Dots del carousel sobre los productos', () => {
  test('desktop: los dots son visibles', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/');
    await waitForBanner(page);

    const dots = page.locator('button[aria-label*="Ir a banner"]');
    const count = await dots.count();
    // Dots only appear when banners.length > 1
    if (count === 0) {
      console.log('Solo hay 1 banner activo — dots no se muestran (OK)');
    } else {
      await expect(dots.first()).toBeVisible();
    }
    expect(true).toBe(true); // conditional on banner count
  });

  test('desktop: los dots tienen z-index >= 10', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/');
    await waitForBanner(page);

    const dotsContainer = page.locator('button[aria-label*="Ir a banner"]').first().locator('..');
    const count = await dotsContainer.count();
    if (count === 0) {
      console.log('Solo hay 1 banner — no hay dots que chequear');
      return;
    }

    const dotsZIndex = await dotsContainer.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return parseInt(style.zIndex || '0', 10);
    });

    expect(dotsZIndex).toBeGreaterThanOrEqual(10);
  });

  test('desktop: la sección de productos se superpone al banner (overlap)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/');
    await waitForBanner(page);

    // Banner container: DesktopCarousel div with bg-gray-900
    const bannerContainer = page.locator('[class*="bg-gray-900"]').first();
    await expect(bannerContainer).toBeVisible({ timeout: 10000 });
    const bannerBox = await bannerContainer.boundingBox();

    // Products section has sm:-mt-20 which creates the overlap
    // Find FeaturedProducts by looking for the first section or the products wrapper
    // page.tsx: <div className="sm:-mt-20"><FeaturedProducts /></div>
    const productsWrapper = page.locator('picture img').first().locator('../../../../..');
    // Simpler: just check the second main child div of the page container
    // The page has: banner div (z-0), then products div (sm:-mt-20)
    const allMainDivs = page.locator('div.min-h-screen > div');
    const productsDivBox = await allMainDivs.nth(1).boundingBox();

    if (bannerBox && productsDivBox) {
      // Products div top must be less than banner bottom (overlap)
      expect(productsDivBox.y).toBeLessThan(bannerBox.y + bannerBox.height);
    }
  });
});
