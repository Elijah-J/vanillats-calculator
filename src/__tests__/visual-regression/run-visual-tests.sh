#!/bin/bash

# Visual Regression Test Runner
# This script helps run visual regression tests with helpful output

echo "🎨 Visual Regression Test Runner"
echo "================================"
echo ""

# Check if we're updating baselines
if [ "$1" == "update" ]; then
    echo "📸 Updating baseline images..."
    npm run test:visual:update
    echo ""
    echo "✅ Baseline images updated!"
    echo "⚠️  Make sure to review the changes before committing!"
elif [ "$1" == "watch" ]; then
    echo "👀 Running in watch mode..."
    npm run test:visual:watch
else
    echo "🔍 Running visual regression tests..."
    npm run test:visual
    
    # Check if tests failed
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ Visual tests failed!"
        echo "💡 Check the diff images in: src/__tests__/visual-regression/__image_snapshots__/__diff_output__/"
        echo ""
        echo "To update baselines if changes are intentional:"
        echo "  ./run-visual-tests.sh update"
    else
        echo ""
        echo "✅ All visual tests passed!"
    fi
fi