// Calculator operation types
export type Operator = '+' | '-' | '*' | '/';

// Button action types
export type ButtonAction = 
  | 'number' 
  | 'operator' 
  | 'decimal' 
  | 'clear' 
  | 'backspace' 
  | 'opposite' 
  | 'calculate';

// Calculator state interface
export interface CalculatorState {
  display: string;
  isShowingSolution: boolean;
  isShowingError: boolean;
}

// Calculator button interface
export interface CalculatorButton {
  action: ButtonAction;
  value?: string;
  element: HTMLButtonElement;
}

// Error types
export type CalculatorError = 
  | 'DIVIDE_BY_ZERO' 
  | 'OVERFLOW' 
  | 'INVALID_EXPRESSION';

// Token types for expression parsing
export type Token = 
  | { type: 'number'; value: number }
  | { type: 'operator'; value: Operator };

// Function signatures for calculator operations
export type CalculatorOperation = (a: number, b: number) => number;

// Error result interface
export interface ErrorResult {
  error: true;
  message: string;
  type: CalculatorError;
}

// Success result interface
export interface SuccessResult {
  error: false;
  value: number;
}

// Combined result type
export type CalculationResult = ErrorResult | SuccessResult;