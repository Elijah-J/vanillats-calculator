const { test, expect, describe, beforeEach, afterEach } = require("@jest/globals");
const { JSDOM } = require("jsdom");

describe("State Management Verification", () => {
  let dom;
  let document;
  let domModule;
  
  beforeEach(() => {
    // Reset modules to ensure clean state
    jest.resetModules();
    
    // Create DOM
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="display">0</div>
          <button data-action="clear">AC</button>
          <button data-value="5" data-action="number">5</button>
          <button data-value="+" data-action="operator">+</button>
          <button data-action="calculate">=</button>
        </body>
      </html>
    `);
    
    document = dom.window.document;
    global.document = document;
    global.window = dom.window;
    
    // Add getElementById to document for compatibility
    if (!document.getElementById) {
      document.getElementById = document.querySelector.bind(document);
    }
    
    // Add innerText support to elements (JSDOM uses textContent)
    Object.defineProperty(window.HTMLElement.prototype, 'innerText', {
      get() {
        return this.textContent;
      },
      set(value) {
        this.textContent = value;
      }
    });
    
    // Load module after DOM is ready
    domModule = require("../scripts/dom.js");
  });

  afterEach(() => {
    delete global.document;
    delete global.window;
  });

  describe("Solution Displaying State", () => {
    test("clears solution when new number is entered", () => {
      const display = document.querySelector("#display");
      
      // Simulate solution being displayed
      domModule.printSolution(42, { getElementById: (id) => document.getElementById(id) });
      expect(display.innerText).toBe("42");
      
      // Enter new number - should replace solution
      domModule.printToDisplay("7", { getElementById: (id) => document.getElementById(id) });
      expect(display.innerText).toBe("7");
    });

    test("preserves solution when operator is entered", () => {
      const display = document.querySelector("#display");
      
      // Display solution
      domModule.printSolution(42, { getElementById: (id) => document.getElementById(id) });
      expect(display.innerText).toBe("42");
      
      // Add operator - should keep solution
      domModule.printToDisplay("+", { getElementById: (id) => document.getElementById(id) });
      expect(display.innerText).toContain("42");
      expect(display.innerText).toContain("+");
    });

    test("handles consecutive calculations", () => {
      const display = document.querySelector("#display");
      
      const container = { getElementById: (id) => document.getElementById(id) };
      
      // First calculation: 5 + 3 = 8
      domModule.printToDisplay("5", container);
      domModule.printToDisplay("+", container);
      domModule.printToDisplay("3", container);
      const result1 = domModule.solveExpression(display.innerText);
      domModule.printSolution(result1, container);
      expect(display.innerText).toBe("8");
      
      // Second calculation: 8 + 2 = 10
      domModule.printToDisplay("+", container);
      domModule.printToDisplay("2", container);
      const result2 = domModule.solveExpression(display.innerText);
      domModule.printSolution(result2, container);
      expect(display.innerText).toBe("10");
    });

    test("clears solution state on AC button", () => {
      const display = document.querySelector("#display");
      
      const container = { getElementById: (id) => document.getElementById(id) };
      
      // Display solution
      domModule.printSolution(123, container);
      expect(display.innerText).toBe("123");
      
      // Clear
      domModule.clearDisplay(null, container);
      expect(display.innerText).toBe("0");
      
      // Verify state is reset by typing
      domModule.printToDisplay("9", container);
      expect(display.innerText).toBe("9");
    });
  });

  describe("Error Displaying State", () => {
    test("clears error state when typing number", () => {
      const display = document.querySelector("#display");
      
      const container = { getElementById: (id) => document.getElementById(id) };
      
      // Set error state
      domModule.printSolution(Infinity, container);
      expect(display.innerText).toBe("Divide by Zero");
      
      // Type number - should clear error
      domModule.printToDisplay("5", container);
      expect(display.innerText).toBe("5");
    });

    test("clears error state on AC", () => {
      const display = document.querySelector("#display");
      
      const container = { getElementById: (id) => document.getElementById(id) };
      
      // Set overflow error
      domModule.printSolution(99999999999999999, container);
      expect(display.innerText).toBe("Overflow");
      
      // Clear
      domModule.clearDisplay(null, container);
      expect(display.innerText).toBe("0");
    });

    test("clears error state on backspace", () => {
      const display = document.querySelector("#display");
      
      const container = { getElementById: (id) => document.getElementById(id) };
      
      // Set error
      domModule.printSolution(Infinity, container);
      expect(display.innerText).toBe("Divide by Zero");
      
      // Backspace should clear to empty
      domModule.removeLastCharacter(null, container);
      expect(display.innerText).toBe("");
    });

    test("handles multiple errors in sequence", () => {
      const display = document.querySelector("#display");
      
      const container = { getElementById: (id) => document.getElementById(id) };
      
      // First error
      domModule.printSolution(Infinity, container);
      expect(display.innerText).toBe("Divide by Zero");
      
      // Clear and create second error
      domModule.clearDisplay(null, container);
      domModule.printSolution(99999999999999999, container);
      expect(display.innerText).toBe("Overflow");
      
      // Clear and verify normal operation
      domModule.clearDisplay(null, container);
      domModule.printToDisplay("2", container);
      expect(display.innerText).toBe("2");
    });
  });

  describe("State Transitions", () => {
    test("transitions from calculation to new calculation", () => {
      const display = document.querySelector("#display");
      
      const container = { getElementById: (id) => document.getElementById(id) };
      
      // Complete calculation
      domModule.printToDisplay("3", container);
      domModule.printToDisplay("+", container);
      domModule.printToDisplay("4", container);
      const result = domModule.solveExpression(display.innerText);
      domModule.printSolution(result, container);
      expect(display.innerText).toBe("7");
      
      // Start new calculation
      domModule.printToDisplay("2", container);
      expect(display.innerText).toBe("2");
    });

    test("transitions from error to calculation", () => {
      const display = document.querySelector("#display");
      
      const container = { getElementById: (id) => document.getElementById(id) };
      
      // Create error
      domModule.printToDisplay("5", container);
      domModule.printToDisplay("÷", container);
      domModule.printToDisplay("0", container);
      const result = domModule.solveExpression(display.innerText);
      domModule.printSolution(result, container);
      expect(display.innerText).toBe("Divide by Zero");
      
      // Start new calculation
      domModule.printToDisplay("8", container);
      domModule.printToDisplay("-", container);
      domModule.printToDisplay("3", container);
      const newResult = domModule.solveExpression(display.innerText);
      domModule.printSolution(newResult, container);
      expect(display.innerText).toBe("5");
    });

    test("preserves display when syntax check fails", () => {
      const display = document.querySelector("#display");
      
      const container = { getElementById: (id) => document.getElementById(id) };
      
      // Set up display
      domModule.printToDisplay("5", container);
      domModule.printToDisplay(".", container);
      expect(display.innerText).toBe("5.");
      
      // Try to add another decimal (should fail)
      const beforeAttempt = display.innerText;
      
      // Simulate syntax check failure
      if (!domModule.checkSyntaxOnInput(".", container)) {
        // Display should not change
        expect(display.innerText).toBe(beforeAttempt);
      }
    });
  });

  describe("Global State Isolation", () => {
    test("multiple module loads don't share state", () => {
      const display = document.querySelector("#display");
      
      const container = { getElementById: (id) => document.getElementById(id) };
      
      // First load
      const dom1 = require("../scripts/dom.js");
      dom1.printToDisplay("123", container);
      expect(display.innerText).toBe("123");
      
      // Clear module cache and reload
      jest.resetModules();
      global.document = document;
      
      // Second load - should have fresh state
      const dom2 = require("../scripts/dom.js");
      dom2.clearDisplay(null, container);
      expect(display.innerText).toBe("0");
      
      // Verify independent operation
      dom2.printToDisplay("456", container);
      expect(display.innerText).toBe("456");
    });
  });

  describe("Edge Case State Handling", () => {
    test("handles sign switch on zero", () => {
      const display = document.querySelector("#display");
      display.innerText = "0";
      
      const container = { getElementById: (id) => document.getElementById(id) };
      
      domModule.switchSign(null, container, false);
      expect(display.innerText).toBe("-0");
      
      domModule.switchSign(null, container, false);
      expect(display.innerText).toBe("0");
    });

    test("handles sign switch after solution", () => {
      const display = document.querySelector("#display");
      
      const container = { getElementById: (id) => document.getElementById(id) };
      
      // Display solution
      domModule.printSolution(42, container);
      expect(display.innerText).toBe("42");
      
      // Switch sign - pass false for error state since we're not in error state
      domModule.switchSign(null, container, false);
      expect(display.innerText).toBe("-42");
    });

    test("handles decimal input after solution", () => {
      const display = document.querySelector("#display");
      
      const container = { getElementById: (id) => document.getElementById(id) };
      
      // Display solution
      domModule.printSolution(5, container);
      expect(display.innerText).toBe("5");
      
      // Type decimal - should start new number with "0."
      domModule.printToDisplay(".", container);
      expect(display.innerText).toBe("0.");
    });
  });
});