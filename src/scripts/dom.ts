import {
  checkSyntaxOnSolve,
  tokenize,
  normalizeSymbols,
  convertFromInfixToPostfix,
  evaluatePostfixExpression,
  isCalcNumber,
  isOperator,
} from "./utils";

const MAX_DISPLAY_CAPCITY = 17;
const MAX_DIGITS_WITH_DECIMAL = MAX_DISPLAY_CAPCITY - 1; // to account for negative sign
const MAX_DECIMAL_PRECISION = 16;

let solutionDisplaying = false;
let errorDisplaying = false;

// tested
export const initButtonClickListeners = (): void => {
  initTokenButtons();
  initClearButton();
  initBackspaceButton();
  initOppositeButton();
  initSolveButton();
  
  // Add ripple to all calculator buttons as a fallback
  const allButtons = document.querySelectorAll<HTMLButtonElement>('.calculator-button');
  allButtons.forEach(button => {
    if (!button.onclick) {
      button.addEventListener('click', function(e) {
        createRipple(e, button);
      });
    }
  });

  initKeyboardEventListeners();

  const display = document.getElementById("display");
  if (display) {
    display.innerText = "0";
  }
};

const initTokenButtons = (): void => {
  const tokenButtons = document.getElementsByClassName("calculator__button");

  [...tokenButtons].forEach((tokenButton) => {
    const button = tokenButton as HTMLButtonElement & { _skipRipple?: boolean };
    button.onclick = function (e: MouseEvent): void {
      if (!button._skipRipple) {
        createRipple(e, button);
      }
      const value = button.dataset.value || button.innerText.trim();
      printToDisplay(value);
    };
  });
};

const initClearButton = (): void => {
  const clearButton = document.getElementById("clear-expression") as HTMLButtonElement & { _skipRipple?: boolean };
  if (clearButton) {
    clearButton.onclick = function(e: MouseEvent): void {
      if (!clearButton._skipRipple) {
        createRipple(e, clearButton);
      }
      clearDisplay();
    };
  }
};

const initBackspaceButton = (): void => {
  const backspaceButton = document.getElementById("backspace") as HTMLButtonElement & { _skipRipple?: boolean };
  if (backspaceButton) {
    backspaceButton.onclick = function(e: MouseEvent): void {
      if (!backspaceButton._skipRipple) {
        createRipple(e, backspaceButton);
      }
      removeLastCharacter();
    };
  }
};

const initOppositeButton = (): void => {
  const oppositeButton = document.getElementById("calculator-opposite") as HTMLButtonElement & { _skipRipple?: boolean };
  if (oppositeButton) {
    oppositeButton.onclick = function(e: MouseEvent): void {
      if (!oppositeButton._skipRipple) {
        createRipple(e, oppositeButton);
      }
      switchSign();
    };
  }
};

const initSolveButton = (): void => {
  const solveButton = document.querySelector('[data-action="calculate"]') as HTMLButtonElement & { _skipRipple?: boolean };
  if (solveButton) {
    solveButton.onclick = function (e: MouseEvent): void {
      if (!solveButton._skipRipple) {
        createRipple(e, solveButton);
      }
      const display = document.getElementById("display");
      if (display) {
        calculateAndPrintSolution(display.innerText);
      }
    };
  }
};

const createRipple = (event: MouseEvent | null, button: HTMLElement): void => {
  try {
    const doc = button.ownerDocument || document;
    const ripple = doc.createElement("span");
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    // Handle keyboard events or missing coordinates by centering the ripple
    let x: number, y: number;
    if (event && event.clientX !== undefined && event.clientY !== undefined) {
      x = event.clientX - rect.left - size / 2;
      y = event.clientY - rect.top - size / 2;
    } else {
      // Center the ripple for keyboard events
      x = rect.width / 2 - size / 2;
      y = rect.height / 2 - size / 2;
    }
    
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = x + "px";
    ripple.style.top = y + "px";
    ripple.classList.add("ripple");
    
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 400);
  } catch (e) {
    // Ignore errors in test environment
    console.warn('Ripple effect failed:', e);
  }
};

const initKeyboardEventListeners = (): void => {
  document.addEventListener("keydown", clickButton);
  document.addEventListener("keyup", deactivateButton);
};

// tested
export const clickButton = (e: KeyboardEvent, container: Document = window.document): HTMLButtonElement | null => {
  const clickedButton = getButtonFromKeyEventCode(e, container);
  if (clickedButton !== null) {
    clickedButton.classList.add("calculator__button--active");
    
    // Create ripple effect for keyboard events
    createRipple(null, clickedButton);
    
    // Trigger the click without creating another ripple
    const buttonWithSkip = clickedButton as HTMLButtonElement & { _skipRipple?: boolean };
    buttonWithSkip._skipRipple = true;
    clickedButton.click();
    buttonWithSkip._skipRipple = false;

    return clickedButton;
  }
  return null;
};

// tested
export const deactivateButton = (e: KeyboardEvent, container: Document = window.document): HTMLButtonElement | null => {
  const clickedButton = getButtonFromKeyEventCode(e, container);
  if (clickedButton !== null) {
    clickedButton.classList.remove("calculator__button--active");

    return clickedButton;
  }
  return null;
};

// tested
export const getButtonFromKeyEventCode = (e: KeyboardEvent, container: Document = window.document): HTMLButtonElement | null => {
  const keyName = e.key.toString().toLowerCase();

  preventDefaultBehavior(e, keyName);
  const clickedButton = doGetButton(keyName, container);

  return clickedButton;
};

const preventDefaultBehavior = (e: KeyboardEvent, keyName: string): void => {
  if (keyName === "enter" || keyName === " " || keyName === "backspace" || keyName === "delete") {
    e.preventDefault();
  }
};

const doGetButton = (keyName: string, container: Document = window.document): HTMLButtonElement | null => {
  let clickedButton: HTMLButtonElement | null = null;
  if (keyName === "enter") {
    clickedButton = container.querySelector('[data-action="calculate"]');
  } else if (keyName === "escape") {
    clickedButton = container.getElementById("clear-expression") as HTMLButtonElement;
  } else if (keyName === "o") {
    clickedButton = container.getElementById("calculator-opposite") as HTMLButtonElement;
  } else if (keyName === "backspace" || keyName === "delete") {
    clickedButton = container.getElementById("backspace") as HTMLButtonElement;
  } else if (/^[0-9]$/.test(keyName)) {
    clickedButton = container.querySelector(`[data-value="${keyName}"][data-action="number"]`);
  } else if (keyName === "." || keyName === ",") {
    clickedButton = container.querySelector('[data-value="."]');
  } else if (keyName === "+" || keyName === "-" || keyName === "*" || keyName === "/") {
    clickedButton = container.querySelector(`[data-value="${keyName}"][data-action="operator"]`);
  } else {
    clickedButton = container.getElementById(keyName) as HTMLButtonElement;
  }
  return clickedButton;
};

// tested
export const printToDisplay = (symbol: string, container: Document = window.document): void => {
  if (errorDisplaying === true && errorDisplaying != undefined) {
    // TODO: extract this logic
    clearDisplay(undefined, container);
    errorDisplaying = false;
  }

  if (!isOperator(symbol)) {
    solutionDisplaying = clearSolution(container);
  }
  solutionDisplaying = false;

  const display = container.getElementById("display");
  if (!display) return;
  
  if (
    display.innerText.length >= MAX_DISPLAY_CAPCITY ||
    !checkSyntaxOnInput(symbol, container)
  )
    return;

  doPrintToDisplay(symbol, display);
};

const doPrintToDisplay = (symbol: string, display: HTMLElement): void => {
  // Clear the initial "0" if needed
  if (display.innerText === "0" && /\d/.test(symbol)) {
    display.innerText = "";
  }
  
  if (/\d/.test(symbol)) {
    display.innerText += `${symbol}`;
  } else if (/^\.$/.test(symbol)) {
    display.innerText += `${symbol}`;
  } else {
    display.innerText += `\xa0${symbol}\xa0`;
  }
};

// tested
export const checkSyntaxOnInput = (symbol: string, container: Document = window.document): boolean => {
  const display = container.getElementById("display");
  if (!display) return false;
  
  const tokenizedDisplayText = tokenize(display.innerText);
  const normalizedDisplayText = normalizeSymbols(tokenizedDisplayText);

  if ("+-x\u00F7".indexOf(symbol) !== -1) {
    if (
      !isCalcNumber(normalizedDisplayText[normalizedDisplayText.length - 1])
    ) {
      return false;
    }
  } else if (/^\.$/.test(symbol)) {
    if (
      normalizedDisplayText[normalizedDisplayText.length - 1].indexOf(".") !=
        -1 ||
      !/^\d+$/.test(display.innerText[display.innerText.length - 1])
    ) {
      return false;
    }
  }
  return true;
};

// tested
export const clearDisplay = (_e?: Event, container: Document = window.document): void => {
  const display = container.getElementById("display");
  if (display) {
    display.innerText = "0";
  }
};

// tested
export const removeLastCharacter = (_e?: Event, container: Document = window.document): void => {
  if (errorDisplaying === true && errorDisplaying != undefined) {
    clearDisplay(undefined, container);
    errorDisplaying = false;
  }

  solutionDisplaying = false;

  const display = container.getElementById("display");
  if (!display) return;
  
  let charactersToRemove = 1;

  if (/\s/.test(display.innerText[display.innerText.length - 1]))
    charactersToRemove = 2;

  do {
    display.innerText = display.innerText.slice(
      0,
      display.innerText.length - charactersToRemove
    );
    charactersToRemove = 1;
  } while (/(\s|-|\.)/.test(display.innerText[display.innerText.length - 1]));
  if (
    "+-x\u00F7".indexOf(display.innerText[display.innerText.length - 1]) !== -1
  ) {
    const displayElement = document.getElementById("display");
    if (displayElement) {
      displayElement.innerText += "\xa0";
    }
  }
};

// tested
export const printSolution = (solution: number | string | boolean, container: Document = window.document): void => {
  const display = container.getElementById("display");
  if (!display) return;
  
  if (typeof solution === 'boolean') {
    return;
  }
  
  if (typeof solution === 'number') {
    const stringSolution = solution.toString();

    if (stringSolution.includes(".")) {
      const symbolsBeforeMantissa = solution.toString().split(".")[0].length + 1;
      const mantissaLength = solution.toString().split(".")[1].length;

      if (stringSolution.length > MAX_DIGITS_WITH_DECIMAL) {
        solution = parseFloat(
          solution.toFixed(MAX_DIGITS_WITH_DECIMAL - symbolsBeforeMantissa)
        );
      } else if (mantissaLength < MAX_DECIMAL_PRECISION) {
        solution = parseFloat(solution.toFixed(mantissaLength));
      } else {
        solution = parseFloat(solution.toFixed(MAX_DECIMAL_PRECISION));
      }
    } else if (stringSolution.length > MAX_DIGITS_WITH_DECIMAL) {
      solution = "Overflow";
      errorDisplaying = true;
    } else if (!Number.isFinite(solution)) {
      // TODO: extract this logic
      solution = "Divide by Zero";
      errorDisplaying = true;
    }
  }

  display.innerText = solution + "";

  if (errorDisplaying === false) {
    solutionDisplaying = true;
  }
};

// tested
export const switchSign = (
  _e?: Event,
  container: Document = window.document,
  currentErrorState: boolean = errorDisplaying
): void => {
  if (currentErrorState === true && currentErrorState != undefined) {
    clearDisplay(undefined, container);
    errorDisplaying = false;
    return;
  }
  solutionDisplaying = false;

  const displayElement = container.getElementById("display");
  if (!displayElement) return;
  
  const tokenizedDisplay = tokenize(displayElement.innerText);

  let currentSymbol = tokenizedDisplay[tokenizedDisplay.length - 1];
  if (isCalcNumber(currentSymbol)) {
    if (currentSymbol.charAt(0) === "-") {
      currentSymbol = currentSymbol.slice(1, currentSymbol.length);
    } else {
      currentSymbol = "-" + currentSymbol;
    }

    tokenizedDisplay[tokenizedDisplay.length - 1] = currentSymbol;
    displayElement.innerText = tokenizedDisplay.join(" ");
  }
};

const calculateAndPrintSolution = (expression: string): void => {
  const solution = solveExpression(expression);
  printSolution(solution);
};

// tested
export const solveExpression = (expression: string): number | boolean => {
  const formattedExpression = formatExpression(expression);
  if (!checkSyntaxOnSolve(formattedExpression)) {
    return false;
  }
  const evaluatedExpression = doSolveExpression(formattedExpression);
  return evaluatedExpression;
};

const formatExpression = (expression: string): string[] => {
  return normalizeSymbols(tokenize(expression));
};

const doSolveExpression = (formattedExpression: string[]): number => {
  return evaluatePostfixExpression(
    convertFromInfixToPostfix(formattedExpression)
  );
};

// tested
export const clearSolution = (
  container: Document = window.document,
  currentState: boolean = solutionDisplaying
): boolean => {
  if (currentState === true) clearDisplay(undefined, container);
  currentState = false;
  return currentState;
};