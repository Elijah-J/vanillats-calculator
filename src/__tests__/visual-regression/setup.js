// Visual regression test setup
const { toMatchImageSnapshot } = require('jest-image-snapshot');

// Extend Jest matchers
expect.extend({ toMatchImageSnapshot });

// Increase timeout for visual tests (screenshots can take time)
jest.setTimeout(30000);

// Global test helpers
global.waitForAnimation = (page, duration = 300) => {
  return page.waitForTimeout(duration);
};

// Helper to stabilize dynamic content
global.stabilizeCalculator = async (page) => {
  await page.evaluate(() => {
    // Ensure display shows consistent initial state
    const display = document.getElementById('display');
    if (display && display.innerText === '') {
      display.innerText = '0';
    }
    
    // Remove any active states
    document.querySelectorAll('.calculator__button--active').forEach(el => {
      el.classList.remove('calculator__button--active');
    });
    
    // Remove any ripple elements
    document.querySelectorAll('.ripple').forEach(el => {
      el.remove();
    });
  });
};