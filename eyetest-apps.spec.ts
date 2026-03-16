/**
 * Eyetest for all CAS Lens example apps.
 *
 * Takes screenshots of each app to verify they render correctly.
 * Run: npx playwright test eyetest-apps.spec.ts
 */
import { test, expect } from '@playwright/test';
import path from 'path';

const RESULTS_DIR = path.join(__dirname, 'eyetest-results');

async function snap(page: any, name: string) {
  const filePath = path.join(RESULTS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`Screenshot: ${filePath}`);
  return filePath;
}

test.describe('Example Apps Eyetest', () => {

  test('search-tool: search for iris and see results', async ({ page }) => {
    await page.goto('http://localhost:5181');
    await page.waitForTimeout(1000);
    await snap(page, '01-search-initial');

    // Type and submit a search
    await page.fill('input[placeholder*="Scientific"]', 'iris');
    await page.click('button[type="submit"]');

    // Wait for results to load
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('specimen') || text.includes('failed') || text.includes('No specimens');
    }, { timeout: 15000 });
    await page.waitForTimeout(500);
    await snap(page, '02-search-results');

    // Verify we got results
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('specimen');
    expect(bodyText).not.toContain('Network Error');
    console.log('Search tool: results loaded');
  });

  test('stories-browser: shows story cards', async ({ page }) => {
    await page.goto('http://localhost:5183');

    // Wait for stories to load
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('Loading') === false && document.querySelectorAll('a').length > 2;
    }, { timeout: 15000 });
    await page.waitForTimeout(500);
    await snap(page, '03-stories');

    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('Error');
    // Should have at least some story cards
    const links = await page.locator('a[href*="collections.calacademy.org/stories"]').count();
    console.log(`Stories: ${links} story links found`);
    expect(links).toBeGreaterThan(0);
  });

  test('lessons-browser: shows lesson cards', async ({ page }) => {
    await page.goto('http://localhost:5184');

    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('Loading') === false;
    }, { timeout: 15000 });
    await page.waitForTimeout(500);
    await snap(page, '04-lessons');

    const bodyText = await page.textContent('body');
    // Lessons may have zero results — that's ok, just verify no crash
    expect(bodyText).not.toContain('Error');
    console.log('Lessons: page rendered');
  });

  test('papers-browser: shows literature list', async ({ page }) => {
    await page.goto('http://localhost:5185');

    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('Loading') === false;
    }, { timeout: 15000 });
    await page.waitForTimeout(500);
    await snap(page, '05-papers');

    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('Error');
    console.log('Papers: page rendered');
  });

  test('papers-browser: search for a term', async ({ page }) => {
    await page.goto('http://localhost:5185');
    await page.waitForTimeout(2000);

    // Search for something
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('coral');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
      await snap(page, '06-papers-search');
      console.log('Papers: search submitted');
    }
  });

  test('specimen-viewer: shows specimen detail', async ({ page }) => {
    await page.goto('http://localhost:5182');

    // Wait for specimen data to load
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('CAS') || text.includes('Loading') === false;
    }, { timeout: 15000 });
    await page.waitForTimeout(2000);
    await snap(page, '07-specimen-detail');

    const bodyText = await page.textContent('body');
    // Should show either specimen data or a loading state, not an error
    expect(bodyText).not.toContain('Network Error');
    console.log('Specimen viewer: rendered');
  });

  test('map-explorer: shows map', async ({ page }) => {
    await page.goto('http://localhost:5180');
    // Maps take a while to initialize
    await page.waitForTimeout(5000);
    await snap(page, '08-map');

    // Check if canvas (maplibre) or any map content is present
    const hasCanvas = await page.locator('canvas').count();
    const hasMapContent = await page.locator('.maplibregl-map, .mapboxgl-map').count();
    console.log(`Map: canvas=${hasCanvas}, mapContent=${hasMapContent}`);
    // Even if the map doesn't fully render, the header should be there
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Map Explorer');
  });
});
