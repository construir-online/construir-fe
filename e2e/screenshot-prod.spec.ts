import { test } from '@playwright/test';

test('DPR2 - get full URLs and network errors', async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });
  const page = await ctx.newPage();

  // Capture all network responses
  const responses: string[] = [];
  page.on('response', r => {
    if (r.url().includes('_next/image') || r.url().includes('s3.amazonaws')) {
      responses.push(`${r.status()} ${r.url().substring(0, 150)}`);
    }
  });

  await page.goto('https://www.constru-ir.com/productos/7cfad31f-c95a-4132-8b9c-abca30201d0b', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  console.log('Network responses:');
  responses.forEach(r => console.log(' ', r));

  // Get full srcset of the product image
  const srcset = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    for (const img of imgs) {
      if (img.src.includes('products') || img.src.includes('8455')) {
        return { src: img.src, srcset: img.srcset };
      }
    }
    return null;
  });
  console.log('Product img srcset:', JSON.stringify(srcset));

  await ctx.close();
});
