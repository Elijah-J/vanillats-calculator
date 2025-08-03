# VanillaTS Calculator

A pure TypeScript calculator with zero runtime dependencies. This project demonstrates modern TypeScript development without frameworks, focusing on type safety, clean architecture, and best practices.

## Features

- ✨ Pure TypeScript - No frameworks or libraries
- 🎯 Strict type safety with TypeScript's strict mode
- 🧪 Comprehensive test suite with Jest and TypeScript
- 📱 Responsive design
- ♿ WCAG 2.1 Level AA compliant
- 🎨 Modern CSS with CSS Grid and Custom Properties
- ⚡ Webpack build with hot module replacement
- 🔍 ESLint with TypeScript support

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint
```

## Architecture

The calculator uses a modular TypeScript architecture:

- **Type Definitions**: Strongly typed interfaces for all data structures
- **Pure Functions**: Side-effect free calculation logic
- **DOM Manipulation**: Type-safe DOM interactions
- **Event Handling**: Typed event handlers with proper event types
- **State Management**: Immutable state updates with TypeScript guards

## Development

This project uses:
- TypeScript 5.3+ with strict mode
- Webpack 5 for bundling
- Jest with ts-jest for testing
- ESLint with TypeScript parser
- No runtime dependencies

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## License

MIT
