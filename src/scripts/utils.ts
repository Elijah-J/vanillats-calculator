import { Operator } from './types';

// tested
export const checkSyntaxOnSolve = (normalizedExpression: string[]): boolean => {
  let syntaxCorrect = true;

  if (isLastSymbolAnOperator(normalizedExpression)) {
    syntaxCorrect = false;
  }

  return syntaxCorrect;
};

const isLastSymbolAnOperator = (normalizedExpression: string[]): boolean => {
  const lastSymbol = normalizedExpression[normalizedExpression.length - 1];
  return isOperator(lastSymbol);
};

// tested
export const tokenize = (expression: string): string[] => {
  return expression.split(/\s/);
};

// tested
export const normalizeSymbols = (tokenizedExpression: string[]): string[] => {
  for (let i = 0; i < tokenizedExpression.length; i++) {
    if (tokenizedExpression[i] === "\u00F7") {
      tokenizedExpression[i] = "/";
    } else if (tokenizedExpression[i] === "x") {
      tokenizedExpression[i] = "*";
    }
  }
  return tokenizedExpression;
};

// tested
export const convertFromInfixToPostfix = (tokenizedExpression: string[]): string[] => {
  const precedence: Record<Operator, number> = {
    "*": 2,
    "/": 2,
    "+": 1,
    "-": 1,
  };
  const operatorStack: string[] = [];
  const postfixList: string[] = [];

  const expression = {
    tokenizedExpression,
    precedence,
    operatorStack,
    postfixList,
  };

  return doConvert(expression);
};

interface ConversionState {
  tokenizedExpression: string[];
  precedence: Record<Operator, number>;
  operatorStack: string[];
  postfixList: string[];
}

// Variable to hold current token in scope for existsOperatorOfLowerPrecedence
let token: string;

const doConvert = ({
  tokenizedExpression,
  precedence,
  operatorStack,
  postfixList,
}: ConversionState): string[] => {
  for (let i = 0; i < tokenizedExpression.length; i++) {
    token = tokenizedExpression[i];
    if (isCalcNumber(token)) {
      postfixList.push(token);
    } else {
      while (existsOperatorOfLowerPrecedence(operatorStack, precedence)) {
        postfixList.push(operatorStack.pop()!);
      }

      operatorStack.push(token);
    }
  }
  while (operatorStack.length > 0) {
    postfixList.push(operatorStack.pop()!);
  }

  return postfixList;
};

const existsOperatorOfLowerPrecedence = (
  operatorStack: string[], 
  precedence: Record<Operator, number>
): boolean => {
  const stackLength = operatorStack.length;
  return (
    stackLength > 0 &&
    precedence[operatorStack[stackLength - 1] as Operator] >= precedence[token as Operator]
  );
};

// tested
export const evaluatePostfixExpression = (postfixExpression: string[]): number => {
  const operandStack: string[] = [];
  for (let i = 0; i < postfixExpression.length; i++) {
    const token = postfixExpression[i];

    if (isCalcNumber(token)) {
      operandStack.push(token);
    } else {
      const operandTwo = parseFloat(operandStack.pop()!);
      const operandOne = parseFloat(operandStack.pop()!);
      const result = doMath(operandOne, operandTwo, postfixExpression[i] as Operator);
      operandStack.push(result.toString());
    }
  }

  return parseFloat(operandStack.pop()!);
};

// tested
export const doMath = (operandOne: number, operandTwo: number, operator: Operator): number => {
  if (operator === "+") return operandOne + operandTwo;
  else if (operator === "-") return operandOne - operandTwo;
  else if (operator === "*") return operandOne * operandTwo;
  else if (operator === "/") return operandOne / operandTwo;
  
  // TypeScript exhaustiveness check
  const _exhaustiveCheck: never = operator;
  return _exhaustiveCheck;
};

// tested
export const isCalcNumber = (symbol: string): boolean => {
  return /^-?\d+\.*\d*$/.test(symbol);
};

export const isOperator = (symbol: string): symbol is Operator => {
  return "+-x\u00F7".indexOf(symbol) !== -1;
};