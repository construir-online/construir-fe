import { test, expect, Page } from '@playwright/test';

// ─── Constants ────────────────────────────────────────────────────────────────
const DESKTOP = { width: 1280, height: 800 };
const MOBILE  = { width: 390,  height: 844 };

// Known product UUID from local dev server
const PRODUCT_UUID = '8df3c796-3e06-4217-ad90-d7c2f00a443b';

const GUEST = {
  identificationType: 'V',
  identificationNumber: '12345678',
  firstName: 'Diego',
  lastName:  'Jesus',
  email:     'djesus1703@gmail.com',
  phone:     '04120000000',
};

const ZELLE = {
  senderName: 'Diego Jesus',
  senderBank: 'Bank of America',
};

// Minimal valid 1×1 PNG (67 bytes)
const FAKE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Seeds the cart via localStorage so we skip the product-browse UI step. */
async function seedCart(page: Page) {
  await page.goto('/');
  await page.evaluate((uuid) => {
    localStorage.setItem('cart', JSON.stringify({
      items: [{ productUuid: uuid, quantity: 1 }],
    }));
  }, PRODUCT_UUID);
}

/** Dismisses the "Data Found!" modal if it is open (uses Autofill). */
async function dismissGuestModal(page: Page): Promise<boolean> {
  const autofillBtn = page.locator('button:has-text("Autofill")');
  if (await autofillBtn.isVisible({ timeout: 500 }).catch(() => false)) {
    await autofillBtn.click();
    await page.waitForTimeout(300);
    return true;
  }
  return false;
}

/** Fills the contact information step (Step 0). */
async function fillContactStep(page: Page) {
  const idInput = page.locator('input[placeholder*="12345678"], input[placeholder*="identificaci" i], input[placeholder*="número" i]').first();
  await idInput.waitFor({ timeout: 10000 });
  await idInput.fill(GUEST.identificationNumber);
  // Trigger onBlur to fire the guest lookup API call
  await idInput.press('Tab');
  // Wait for the network (guest lookup) to complete
  await page.waitForLoadState('networkidle');

  // If a "Data Found!" modal appears (returning customer), use autofill
  if (await dismissGuestModal(page)) {
    return; // form already filled by autofill
  }

  await page.fill('input[name="firstName"]', GUEST.firstName);
  await page.fill('input[name="lastName"]',  GUEST.lastName);
  await page.fill('input[name="email"]',      GUEST.email);
  await page.fill('input[name="phone"]',      GUEST.phone);
}

/** Clicks the "Next" button and waits for transition. */
async function clickNext(page: Page) {
  // Dismiss any guest data modal that may have appeared after network settled
  await dismissGuestModal(page);
  await page.click('button:has-text("Next")');
  await page.waitForTimeout(400);
}

/** Fills the Zelle payment form. */
async function fillZelleForm(page: Page) {
  await page.locator('input[placeholder*="Nombre de quien" i]').fill(ZELLE.senderName);
  await page.locator('input[placeholder*="Banco desde" i]').fill(ZELLE.senderBank);

  await page.locator('input[type="file"]').setInputFiles({
    name:     'comprobante-test.png',
    mimeType: 'image/png',
    buffer:   FAKE_PNG,
  });
  await page.waitForTimeout(400);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Checkout — purchase flow', () => {

  test('DESKTOP | full guest checkout (pickup + Zelle)', async ({ page }) => {
    await page.setViewportSize(DESKTOP);

    // 1. Seed cart via localStorage
    await seedCart(page);

    // 2. Go to checkout
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');

    // 3. Step 0 — Contact info
    await fillContactStep(page);
    await clickNext(page);

    // 4. Step 1 — Delivery method (select Pickup)
    const pickupOption = page.locator('button:has-text("Pickup"), label:has-text("Pickup")').first();
    await pickupOption.click().catch(() => {/* already selected */});
    await clickNext(page);

    // 5. Step — Payment
    const noPaymentScreen = page.locator('h3:has-text("próximamente")');
    const isNoPayment = await noPaymentScreen.isVisible({ timeout: 3000 }).catch(() => false);

    if (isNoPayment) {
      // Payments disabled: submit button must NOT appear, WhatsApp button must appear
      await expect(page.locator('button[type="submit"]:has-text("Place"), button[type="submit"]:has-text("Order")')).not.toBeVisible();
      await expect(page.locator('a:has-text("WhatsApp")')).toBeVisible();
      await page.screenshot({ path: '/tmp/checkout-no-payment-desktop.png' });
      console.log('ℹ️  Payment methods disabled — contact screen shown correctly');
      return;
    }

    // Payments enabled → fill Zelle form
    await fillZelleForm(page);
    await page.screenshot({ path: '/tmp/checkout-before-submit-desktop.png' });

    // 6. Submit order
    const submitBtn = page.locator('button[type="submit"]:has-text("Place Order")');
    await submitBtn.click();

    // 7. Wait for confirmation
    await page.waitForURL('**/checkout/confirmacion**', { timeout: 25000 });
    await expect(page).toHaveURL(/\/checkout\/confirmacion/);
    await page.screenshot({ path: '/tmp/checkout-confirmation-desktop.png' });
    console.log('✅  Order created — URL:', page.url());
  });

  test('MOBILE | full guest checkout (pickup + Zelle)', async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport:          MOBILE,
      deviceScaleFactor: 2,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
    const page = await ctx.newPage();

    await seedCart(page);
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');

    await fillContactStep(page);
    await clickNext(page);

    const pickupOption = page.locator('button:has-text("Pickup"), label:has-text("Pickup")').first();
    await pickupOption.click().catch(() => {});
    await clickNext(page);

    const noPaymentScreen = page.locator('h3:has-text("próximamente")');
    const isNoPayment = await noPaymentScreen.isVisible({ timeout: 3000 }).catch(() => false);

    if (isNoPayment) {
      await expect(page.locator('button[type="submit"]:has-text("Place"), button[type="submit"]:has-text("Order")')).not.toBeVisible();
      await expect(page.locator('a:has-text("WhatsApp")')).toBeVisible();
      await page.screenshot({ path: '/tmp/checkout-no-payment-mobile.png' });
      console.log('ℹ️  Payment methods disabled — mobile OK');
      await ctx.close();
      return;
    }

    await fillZelleForm(page);
    await page.screenshot({ path: '/tmp/checkout-before-submit-mobile.png' });

    const submitBtn = page.locator('button[type="submit"]:has-text("Place Order")');
    await submitBtn.click();

    await page.waitForURL('**/checkout/confirmacion**', { timeout: 25000 });
    await expect(page).toHaveURL(/\/checkout\/confirmacion/);
    await page.screenshot({ path: '/tmp/checkout-confirmation-mobile.png' });
    console.log('✅  Order created on mobile — URL:', page.url());

    await ctx.close();
  });

  test('"Place Order" button hidden when payment methods disabled', async ({ page }) => {
    await page.setViewportSize(DESKTOP);

    await seedCart(page);
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');

    await fillContactStep(page);
    await clickNext(page);
    await clickNext(page); // skip delivery step

    const submitVisible = await page.locator('button[type="submit"]:has-text("Place Order")').isVisible({ timeout: 5000 });
    const noPaymentVisible = await page.locator('h3:has-text("próximamente")').isVisible({ timeout: 3000 }).catch(() => false);

    if (noPaymentVisible) {
      // Bug was: submit appeared even with no payment methods — now it must NOT
      expect(submitVisible).toBe(false);
      console.log('✅  Fix verified: no payment methods → no submit button');
    } else {
      // Payment methods active → submit must be visible
      expect(submitVisible).toBe(true);
      console.log('✅  Payment methods active → submit button visible');
    }
  });

});
