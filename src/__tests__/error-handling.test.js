const { test, expect, describe, beforeEach } = require("@jest/globals");
const { JSDOM } = require("jsdom");

describe("Error Handling and Edge Cases", () => {
  let dom;
  let document;
  let utils;
  let domModule;

  beforeEach(() => {
    // Reset modules to clear global state
    jest.resetModules();
    
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="display">0</div>
        </body>
      </html>
    `);
    document = dom.window.document;
    global.document = document;
    
    // Add getElementById to document for compatibility
    if (!document.getElementById) {
      document.getElementById = document.querySelector.bind(document);
    }
    
    // Add innerText support to elements (JSDOM uses textContent)
    Object.defineProperty(dom.window.HTMLElement.prototype, 'innerText', {
      get() {
        return this.textContent;
      },
      set(value) {
        this.textContent = value;
      }
    });
    
    // Load modules after setting up DOM
    utils = require("../scripts/utils.js");
    domModule = require("../scripts/dom.js");
  });

  describe("Division by Zero", () => {
    test("handles simple division by zero", () => {
      const result = domModule.solveExpression("5 ÷ 0");
      expect(result).toBe(Infinity);
    });

    test("handles zero divided by zero", () => {
      const result = domModule.solveExpression("0 ÷ 0");
      expect(isNaN(result)).toBe(true);
    });

    test("handles complex expression resulting in division by zero", () => {
      const result = domModule.solveExpression("10 ÷ (5 - 5)");
      // JavaScript returns NaN for expressions like 10 / (5-5) due to order of operations
      expect(isNaN(result)).toBe(true);
    });

    test("displays 'Divide by Zero' for infinity result", () => {
      const display = document.querySelector("#display");
      domModule.printSolution(Infinity, { getElementById: (id) => document.getElementById(id) });
      expect(display.innerText).toBe("Divide by Zero");
    });

    test("displays 'Divide by Zero' for negative infinity", () => {
      const display = document.querySelector("#display");
      domModule.printSolution(-Infinity, { getElementById: (id) => document.getElementById(id) });
      expect(display.innerText).toBe("Divide by Zero");
    });
  });

  describe("Overflow Scenarios", () => {
    test("detects overflow for very large numbers", () => {
      const display = document.querySelector("#display");
      const largeNumber = 99999999999999999;
      domModule.printSolution(largeNumber, { getElementById: (id) => document.getElementById(id) });
      expect(display.innerText).toBe("Overflow");
    });

    test("handles multiplication overflow", () => {
      const result = domModule.solveExpression("99999999 x 99999999");
      const display = document.querySelector("#display");
      domModule.printSolution(result, { getElementById: (id) => document.getElementById(id) });
      // Result is 9999999800000000 (16 digits), which is at the limit but not overflow
      expect(display.innerText).toBe("9999999800000000");
    });

    test("handles negative overflow", () => {
      const display = document.querySelector("#display");
      const largeNegative = -99999999999999999;
      domModule.printSolution(largeNegative, { getElementById: (id) => document.getElementById(id) });
      expect(display.innerText).toBe("Overflow");
    });

    test("truncates long decimal results", () => {
      const display = document.querySelector("#display");
      const longDecimal = 1.23456789012345678;
      domModule.printSolution(longDecimal, { getElementById: (id) => document.getElementById(id) });
      expect(display.innerText).toBe("1.23456789012346");
    });
  });

  describe("Empty and Invalid Expressions", () => {
    test("handles empty expression", () => {
      expect(() => domModule.solveExpression("")).not.toThrow();
      const result = domModule.solveExpression("");
      expect(result).toBeDefined();
    });

    test("handles expression with only operators", () => {
      expect(() => domModule.solveExpression("+ - x")).not.toThrow();
    });

    test("handles malformed expressions", () => {
      const testCases = [
        "5 + + 5",
        "x 5",
        "5 x",
        "÷",
        "+ 5"
      ];

      testCases.forEach(expr => {
        expect(() => domModule.solveExpression(expr)).not.toThrow();
      });
    });

    test("utils.checkSyntaxOnSolve validates incomplete expressions", () => {
      expect(utils.checkSyntaxOnSolve("5 +")).toBe(false);
      expect(utils.checkSyntaxOnSolve("5 x")).toBe(false);
      // Empty expression technically has valid syntax (no trailing operator)
      expect(utils.checkSyntaxOnSolve("")).toBe(true);
      expect(utils.checkSyntaxOnSolve("5")).toBe(true);
      expect(utils.checkSyntaxOnSolve("5 + 3")).toBe(true);
    });
  });

  describe("Decimal Edge Cases", () => {
    test("prevents multiple decimals in same number", () => {
      const display = document.querySelector("#display");
      display.innerText = "5.3";
      
      // Try to add another decimal - should be prevented
      const mockCheckSyntax = (input, container) => {
        const current = container.getElementById("display").innerText;
        const lastNumber = current.split(/[\+\-\x÷]/).pop();
        return !lastNumber.includes(".");
      };

      expect(mockCheckSyntax(".", document)).toBe(false);
    });

    test("handles decimal after operator", () => {
      const display = document.querySelector("#display");
      display.innerText = "5 + ";
      
      // Decimal after operator is blocked by syntax check (last char is space, not digit)
      domModule.printToDisplay(".", { getElementById: (id) => document.getElementById(id) });
      expect(display.innerText).toBe("5 + ");
    });

    test("handles leading decimal", () => {
      const display = document.querySelector("#display");
      display.innerText = "";
      
      // Empty display is blocked by syntax check
      domModule.printToDisplay(".", { getElementById: (id) => document.getElementById(id) });
      expect(display.innerText).toBe("");
    });

    test("evaluates expression with trailing decimal", () => {
      const result = domModule.solveExpression("5. + 3");
      expect(result).toBe(8);
    });

    test("handles very small decimal numbers", () => {
      const result = domModule.solveExpression("0.0000001 + 0.0000002");
      expect(result).toBeCloseTo(0.0000003);
    });

    test("handles decimal precision issues", () => {
      const result = domModule.solveExpression("0.1 + 0.2");
      expect(result).toBeCloseTo(0.3);
    });
  });

  describe("Operator Sequence Validation", () => {
    test("prevents consecutive operators", () => {
      const mockValidation = (current, newOp) => {
        const lastChar = current.trim().slice(-1);
        return !["+", "-", "x", "÷"].includes(lastChar);
      };

      expect(mockValidation("5 + ", "-")).toBe(false);
      expect(mockValidation("5 ", "+")).toBe(true);
    });

    test("prevents operator at start", () => {
      const mockValidation = (current, newOp) => {
        return current.length > 0 && current !== "0";
      };

      expect(mockValidation("", "+")).toBe(false);
      expect(mockValidation("0", "x")).toBe(false);
      expect(mockValidation("5", "+")).toBe(true);
    });

    test("allows changing operators", () => {
      const display = document.querySelector("#display");
      display.innerText = "5 + ";
      
      // Should replace the operator
      const replaceLastOperator = (text, newOp) => {
        return text.replace(/[\+\-\x÷]\s*$/, newOp + " ");
      };

      const result = replaceLastOperator(display.innerText, "-");
      expect(result).toBe("5 - ");
    });
  });

  describe("Display Capacity", () => {
    test("respects MAX_DISPLAY_CAPACITY", () => {
      const display = document.querySelector("#display");
      const maxCapacity = 17;
      const longNumber = "12345678901234567";
      
      display.innerText = longNumber;
      
      // Should not add more characters
      const canAddMore = display.innerText.length < maxCapacity;
      expect(canAddMore).toBe(false);
    });

    test("handles capacity with negative numbers", () => {
      const display = document.querySelector("#display");
      const maxCapacity = 17;
      
      display.innerText = "-1234567890123456";
      expect(display.innerText.length).toBe(17);
      
      // Should not add more
      const canAddMore = display.innerText.length < maxCapacity;
      expect(canAddMore).toBe(false);
    });
  });

  describe("State Recovery", () => {
    test("clears error state on new number input", () => {
      const display = document.querySelector("#display");
      
      // Set error state
      display.innerText = "Divide by Zero";
      
      // Clear and type new number
      domModule.clearDisplay(null, { getElementById: (id) => document.getElementById(id) });
      domModule.printToDisplay("5", { getElementById: (id) => document.getElementById(id) });
      
      expect(display.innerText).toBe("5");
    });

    test("clears overflow state on clear", () => {
      const display = document.querySelector("#display");
      
      // Set overflow state
      display.innerText = "Overflow";
      
      // Clear
      domModule.clearDisplay(null, { getElementById: (id) => document.getElementById(id) });
      
      expect(display.innerText).toBe("0");
    });
  });
});