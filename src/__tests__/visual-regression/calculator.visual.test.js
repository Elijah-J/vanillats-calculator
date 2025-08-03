/**
 * @jest-environment node
 */
const puppeteer = require('puppeteer');
const { toMatchImageSnapshot } = require('jest-image-snapshot');
const path = require('path');
const config = require('./visual-regression.config');

// Extend Jest with image snapshot matcher
expect.extend({ toMatchImageSnapshot });

describe('Calculator Visual Regression Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    
    // Set consistent viewport for all tests
    await page.setViewport({ 
      width: 1200, 
      height: 800,
      deviceScaleFactor: 1 
    });
    
    // Navigate to calculator
    const filePath = path.join(__dirname, '../../../dist/index.html');
    await page.goto(`file://${filePath}`, {
      waitUntil: 'networkidle0'
    });
    
    // Disable animations and transitions for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-delay: 0.01ms !important;
          transition-duration: 0.01ms !important;
          transition-delay: 0.01ms !important;
        }
      `
    });
    
    // Disable font smoothing for consistent rendering
    await page.evaluate(() => {
      document.body.style.webkitFontSmoothing = 'none';
      document.body.style.fontSmoothing = 'none';
    });
    
    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');
    
    // Small delay to ensure everything is rendered
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(async () => {
    await page.close();
  });

  describe('Static States', () => {
    test('default calculator appearance', async () => {
      const screenshot = await page.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        ...config,
        customSnapshotIdentifier: 'calculator-default-state'
      });
    });

    test('calculator with single digit', async () => {
      await page.click('[data-value="7"]');
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const screenshot = await page.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        ...config,
        customSnapshotIdentifier: 'calculator-single-digit'
      });
    });

    test('calculator with multiple digits', async () => {
      await page.click('[data-value="1"]');
      await page.click('[data-value="2"]');
      await page.click('[data-value="3"]');
      await page.click('[data-value="4"]');
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const screenshot = await page.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        ...config,
        customSnapshotIdentifier: 'calculator-multiple-digits'
      });
    });

    test('calculator with decimal number', async () => {
      await page.click('[data-value="3"]');
      await page.click('[data-value="."]');
      await page.click('[data-value="1"]');
      await page.click('[data-value="4"]');
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const screenshot = await page.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        ...config,
        customSnapshotIdentifier: 'calculator-decimal-number'
      });
    });

    test('calculator with operation', async () => {
      await page.click('[data-value="5"]');
      await page.click('[data-value="+"]');
      await page.click('[data-value="3"]');
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const screenshot = await page.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        ...config,
        customSnapshotIdentifier: 'calculator-with-operation'
      });
    });

    test('calculator showing result', async () => {
      await page.click('[data-value="8"]');
      await page.click('[data-value="*"]');
      await page.click('[data-value="7"]');
      await page.click('[data-action="calculate"]');
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const screenshot = await page.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        ...config,
        customSnapshotIdentifier: 'calculator-showing-result'
      });
    });

    test('calculator error state - divide by zero', async () => {
      await page.click('[data-value="5"]');
      await page.click('[data-value="/"]');
      await page.click('[data-value="0"]');
      await page.click('[data-action="calculate"]');
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const screenshot = await page.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        ...config,
        customSnapshotIdentifier: 'calculator-error-divide-by-zero'
      });
    });
  });

  describe('Interactive States', () => {
    test('button hover state - number', async () => {
      const button = await page.$('[data-value="5"]');
      await button.hover();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const screenshot = await page.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        ...config,
        customSnapshotIdentifier: 'calculator-button-hover-number'
      });
    });

    test('button hover state - operator', async () => {
      const button = await page.$('[data-value="+"]');
      await button.hover();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const screenshot = await page.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        ...config,
        customSnapshotIdentifier: 'calculator-button-hover-operator'
      });
    });

    test('button active state - via mouse', async () => {
      const button = await page.$('[data-value="9"]');
      await button.hover();
      await page.mouse.down();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const screenshot = await page.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        ...config,
        customSnapshotIdentifier: 'calculator-button-active-mouse'
      });
      
      await page.mouse.up();
    });

    test('button focus state - keyboard navigation', async () => {
      // Tab to first button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab'); // Skip display
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const screenshot = await page.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        ...config,
        customSnapshotIdentifier: 'calculator-button-focus-state'
      });
    });
  });

  describe('Responsive Layouts', () => {
    const viewports = [
      { name: 'mobile', width: 320, height: 568 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1440, height: 900 }
    ];

    viewports.forEach(({ name, width, height }) => {
      test(`${name} viewport (${width}x${height})`, async () => {
        await page.setViewport({ width, height, deviceScaleFactor: 1 });
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const screenshot = await page.screenshot();
        expect(screenshot).toMatchImageSnapshot({
          ...config,
          customSnapshotIdentifier: `calculator-viewport-${name}`
        });
      });
    });

    test('landscape mobile viewport', async () => {
      await page.setViewport({ 
        width: 568, 
        height: 320,
        deviceScaleFactor: 1 
      });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const screenshot = await page.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        ...config,
        customSnapshotIdentifier: 'calculator-viewport-mobile-landscape'
      });
    });
  });

  describe('Theme Variations', () => {
    test('dark mode appearance', async () => {
      // Emulate dark mode preference
      await page.emulateMediaFeatures([
        { name: 'prefers-color-scheme', value: 'dark' }
      ]);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const screenshot = await page.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        ...config,
        customSnapshotIdentifier: 'calculator-dark-mode'
      });
    });

    // Skipping high contrast mode as it's not supported in Puppeteer 13
    test.skip('high contrast mode', async () => {
      // Note: prefers-contrast is not supported in Puppeteer 13
      // This test is kept for future when we upgrade Puppeteer
      const screenshot = await page.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        ...config,
        customSnapshotIdentifier: 'calculator-high-contrast'
      });
    });

    test('reduced motion preference', async () => {
      // Emulate reduced motion preference
      await page.emulateMediaFeatures([
        { name: 'prefers-reduced-motion', value: 'reduce' }
      ]);
      
      // Click a button to verify no animations
      await page.click('[data-value="5"]');
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const screenshot = await page.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        ...config,
        customSnapshotIdentifier: 'calculator-reduced-motion'
      });
    });
  });

  describe('Component Screenshots', () => {
    test('display area only', async () => {
      const display = await page.$('#display');
      const screenshot = await display.screenshot();
      
      expect(screenshot).toMatchImageSnapshot({
        ...config,
        customSnapshotIdentifier: 'component-display-area'
      });
    });

    test('number pad area', async () => {
      // Get bounding box of number buttons
      const buttons = await page.$$eval('[data-action="number"]', elements => {
        const rects = elements.map(el => el.getBoundingClientRect());
        const minX = Math.min(...rects.map(r => r.left));
        const minY = Math.min(...rects.map(r => r.top));
        const maxX = Math.max(...rects.map(r => r.right));
        const maxY = Math.max(...rects.map(r => r.bottom));
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
      });
      
      const screenshot = await page.screenshot({
        clip: buttons
      });
      
      expect(screenshot).toMatchImageSnapshot({
        ...config,
        customSnapshotIdentifier: 'component-number-pad'
      });
    });

    test('operator buttons column', async () => {
      const operators = await page.$$eval('[data-action="operator"]', elements => {
        const rects = elements.map(el => el.getBoundingClientRect());
        const minX = Math.min(...rects.map(r => r.left));
        const minY = Math.min(...rects.map(r => r.top));
        const maxX = Math.max(...rects.map(r => r.right));
        const maxY = Math.max(...rects.map(r => r.bottom));
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
      });
      
      const screenshot = await page.screenshot({
        clip: operators
      });
      
      expect(screenshot).toMatchImageSnapshot({
        ...config,
        customSnapshotIdentifier: 'component-operators'
      });
    });
  });
});