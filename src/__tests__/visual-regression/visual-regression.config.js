// Visual regression test configuration
module.exports = {
  // Failure threshold: How much difference is acceptable
  failureThreshold: 0.01, // 1% difference allowed
  failureThresholdType: 'percent',
  
  // Where to store snapshots
  customSnapshotsDir: './src/__tests__/visual-regression/__image_snapshots__',
  customDiffDir: './src/__tests__/visual-regression/__image_snapshots__/__diff_output__',
  
  // Image comparison settings
  comparisonMethod: 'pixelmatch', // Use pixelmatch instead of ssim
  diffDirection: 'horizontal', // Shows before/after side by side
  
  // Anti-aliasing handling
  blur: 1, // Slight blur to handle anti-aliasing differences across platforms
  
  // Custom diff configuration for pixelmatch
  customDiffConfig: {
    threshold: 0.1,
    includeAA: false, // Ignore anti-aliasing
    alpha: 0.1,
    aaColor: [255, 255, 0],
    diffColor: [255, 0, 0],
  },
  
  // Snapshot naming
  customSnapshotIdentifier: ({ currentTestName, counter }) => {
    return currentTestName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
};