# Visual Regression Testing Guide

## Overview

Visual regression tests ensure that changes to the codebase don't unintentionally alter the appearance of the calculator. These tests capture screenshots and compare them against baseline images to detect visual changes.

## How It Works

1. **Baseline Images**: The first run creates reference screenshots stored in `__image_snapshots__/`
2. **Comparison**: Subsequent runs compare new screenshots against baselines
3. **Diff Generation**: When differences are found, diff images are created in `__diff_output__/`
4. **Pass/Fail**: Tests fail if differences exceed the configured threshold (default: 1%)

## Running Tests

### Run Visual Tests
```bash
npm run test:visual
```

### Update Baseline Images
When you've made intentional visual changes:
```bash
npm run test:visual:update
```

### Run Specific Test
```bash
npm run test:visual -- --testNamePattern="default calculator"
```

## Test Coverage

### Static States
- **Default State**: Calculator on initial load
- **With Input**: Calculator displaying entered numbers
- **With Result**: Calculator after calculation
- **Error States**: Overflow and divide by zero displays

### Interactive States
- **Hover Effects**: Button hover states
- **Active States**: Button pressed appearances
- **Focus States**: Keyboard navigation indicators
- **Ripple Animations**: Mid-animation captures

### Responsive Layouts
- **Mobile** (320px width)
- **Tablet** (768px width)  
- **Desktop** (1440px width)

### Theme Variations
- **Light Mode**: Default appearance
- **Dark Mode**: System preference dark theme

## Understanding Test Output

### Successful Test
```
✓ default calculator appearance (523ms)
```

### Failed Test
```
✗ default calculator appearance (689ms)
  Expected image to match or be a close match to snapshot but was 2.34% different from snapshot
```

### Diff Images
When tests fail, check `__diff_output__/` for visual comparisons:
- **Left**: Expected (baseline)
- **Center**: Difference highlighted
- **Right**: Actual (current)

## Common Issues & Solutions

### Issue: Tests Pass Locally but Fail in CI
**Cause**: Different OS/browser rendering
**Solution**: 
- Use consistent browser version
- Run tests in Docker container
- Adjust failure threshold if needed

### Issue: Font Rendering Differences
**Cause**: Anti-aliasing varies by OS
**Solution**: 
```javascript
// Add to test setup
await page.evaluate(() => {
  document.body.style.webkitFontSmoothing = 'none';
});
```

### Issue: Animation Timing
**Cause**: Screenshots taken mid-animation
**Solution**:
```javascript
// Wait for animations
await page.waitForTimeout(300);
// Or disable animations in tests
```

### Issue: False Positives
**Cause**: Threshold too strict
**Solution**: Adjust in test config:
```javascript
expect(screenshot).toMatchImageSnapshot({
  failureThreshold: 0.02, // 2% difference allowed
  failureThresholdType: 'percent'
});
```

## Best Practices

### 1. Review Before Updating Baselines
Always visually inspect diff images before running update command. Ask:
- Is this change intentional?
- Does it improve the user experience?
- Are all affected states captured?

### 2. Document Visual Changes
When updating baselines, include in commit message:
```
Update visual baselines: Changed button hover color from #ddd to #e5e5e5
```

### 3. Keep Baselines in Version Control
- Commit `__image_snapshots__/` to track visual history
- Don't commit `__diff_output__/` (add to .gitignore)

### 4. Organize Tests Logically
Group related visual tests:
```javascript
describe('Button States', () => {
  test('default button');
  test('hover button');
  test('active button');
});
```

### 5. Use Descriptive Identifiers
```javascript
expect(screenshot).toMatchImageSnapshot({
  customSnapshotIdentifier: 'calculator-mobile-dark-mode'
});
```

## Debugging Failed Tests

1. **Check the diff image** in `__diff_output__/`
2. **Run single test** to isolate issue
3. **Take debug screenshot** during test:
   ```javascript
   await page.screenshot({ path: 'debug.png' });
   ```
4. **Check browser console** for errors:
   ```javascript
   const logs = await page.evaluate(() => console.logs);
   ```
5. **Run headed mode** to watch test:
   ```javascript
   browser = await puppeteer.launch({ headless: false });
   ```

## Configuration Options

### Failure Threshold
```javascript
{
  failureThreshold: 0.01,        // 1% difference
  failureThresholdType: 'percent' // or 'pixel'
}
```

### Comparison Method
```javascript
{
  comparisonMethod: 'ssim' // or 'pixelmatch'
}
```

### Blur Level (for anti-aliasing)
```javascript
{
  blur: 1 // Slight blur to reduce false positives
}
```

### Custom Diff Config
```javascript
{
  customDiffConfig: {
    threshold: 0.1,
    includeAA: false
  }
}
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Visual Regression Tests
  run: npm run test:visual
  
- name: Upload Diffs on Failure
  if: failure()
  uses: actions/upload-artifact@v2
  with:
    name: visual-diffs
    path: src/__tests__/__image_snapshots__/__diff_output__/
```

### Storing Baselines
- Baselines must be in repo for CI to compare
- Use Git LFS for large image files if needed
- Consider separate baseline branches for major versions

## Maintenance

### Regular Tasks
- **Weekly**: Review and clean up outdated diff images
- **Monthly**: Audit baseline images for relevance
- **Quarterly**: Review and adjust failure thresholds

### When to Update Baselines
- ✅ Intentional design changes
- ✅ New features added
- ✅ Bug fixes that affect appearance
- ❌ Temporary development states
- ❌ Unintended side effects

## Troubleshooting

### "Cannot find module 'puppeteer'"
```bash
npm install --save-dev puppeteer
```

### "Timeout waiting for selector"
Increase timeout in jest.config.js:
```javascript
testTimeout: 30000
```

### "Screenshot size differs"
Ensure consistent viewport:
```javascript
await page.setViewport({ 
  width: 1200, 
  height: 800,
  deviceScaleFactor: 1 
});
```

## Additional Resources

- [jest-image-snapshot Documentation](https://github.com/americanexpress/jest-image-snapshot)
- [Puppeteer API](https://pptr.dev/)
- [Visual Testing Best Practices](https://www.browserstack.com/guide/visual-testing-best-practices)