const { test, expect, describe, beforeEach } = require("@jest/globals");

describe("Module Boundary Tests", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe("utils.js module exports", () => {
    test("exports all expected public functions", () => {
      const utils = require("../scripts/utils.js");
      
      const expectedExports = [
        "checkSyntaxOnSolve",
        "tokenize", 
        "normalizeSymbols",
        "convertFromInfixToPostfix",
        "evaluatePostfixExpression",
        "doMath",
        "isCalcNumber",
        "isOperator"
      ];
      
      expectedExports.forEach(funcName => {
        expect(utils[funcName]).toBeDefined();
        expect(typeof utils[funcName]).toBe("function");
      });
    });

    test("does not expose internal implementation functions", () => {
      const utils = require("../scripts/utils.js");
      
      // These should be internal only
      const internalFunctions = [
        "doConvert",
        "existsOperatorOfLowerPrecedence",
        "precedes"
      ];
      
      internalFunctions.forEach(funcName => {
        expect(utils[funcName]).toBeUndefined();
      });
    });

    test("all exported functions have correct signatures", () => {
      const utils = require("../scripts/utils.js");
      
      // Test function signatures by calling with expected parameters
      expect(() => utils.isCalcNumber("5")).not.toThrow();
      expect(() => utils.isOperator("+")).not.toThrow();
      expect(() => utils.tokenize("1 + 2")).not.toThrow();
      expect(() => utils.normalizeSymbols(["x", "÷"])).not.toThrow();
      expect(() => utils.doMath(1, 2, "+")).not.toThrow();
      expect(() => utils.checkSyntaxOnSolve("1 + 2")).not.toThrow();
      expect(() => utils.convertFromInfixToPostfix(["1", "+", "2"])).not.toThrow();
      expect(() => utils.evaluatePostfixExpression(["1", "2", "+"])).not.toThrow();
    });
  });

  describe("dom.js module exports", () => {
    let dom;
    let document;

    beforeEach(() => {
      const { JSDOM } = require("jsdom");
      dom = new JSDOM(`<!DOCTYPE html><html><body><div id="display">0</div></body></html>`);
      document = dom.window.document;
      global.document = document;
      global.window = dom.window;
      
      // Add innerText support to elements (JSDOM uses textContent)
      Object.defineProperty(dom.window.HTMLElement.prototype, 'innerText', {
        get() {
          return this.textContent;
        },
        set(value) {
          this.textContent = value;
        }
      });
    });

    test("exports all expected public functions", () => {
      const domModule = require("../scripts/dom.js");
      
      const expectedExports = [
        "clearDisplay",
        "clearSolution",
        "clickButton",
        "deactivateButton",
        "getButtonFromKeyEventCode",
        "checkSyntaxOnInput",
        "printSolution",
        "printToDisplay",
        "removeLastCharacter",
        "solveExpression",
        "switchSign"
      ];
      
      expectedExports.forEach(funcName => {
        expect(domModule[funcName]).toBeDefined();
        expect(typeof domModule[funcName]).toBe("function");
      });
    });

    test("does not expose internal functions", () => {
      const domModule = require("../scripts/dom.js");
      
      // These should be internal
      const internalFunctions = [
        "initTokenButtons",
        "initOperatorButtons", 
        "initKeyboardEventListeners",
        "createRipple",
        "doGetButton",
        "preventDefaultBehavior"
      ];
      
      internalFunctions.forEach(funcName => {
        expect(domModule[funcName]).toBeUndefined();
      });
    });

    test("critical initButtonClickListeners is exported", () => {
      const domModule = require("../scripts/dom.js");
      
      // This function initializes all button listeners
      expect(domModule.initButtonClickListeners).toBeDefined();
      expect(typeof domModule.initButtonClickListeners).toBe("function");
    });
  });

  describe("Module dependencies", () => {
    test("dom.js correctly imports from utils.js", () => {
      // Load dom.js and verify it can use utils functions
      const domModule = require("../scripts/dom.js");
      
      // Test that solveExpression works (uses utils internally)
      const result = domModule.solveExpression("2 + 3");
      expect(result).toBe(5);
    });

    test("utils.js has no dependency on dom.js", () => {
      // Ensure utils can load without DOM
      delete global.document;
      delete global.window;
      
      expect(() => {
        const utils = require("../scripts/utils.js");
        const result = utils.doMath(2, 3, "+");
        expect(result).toBe(5);
      }).not.toThrow();
    });

    test("no circular dependencies exist", () => {
      // Load both modules in different orders
      jest.resetModules();
      expect(() => {
        require("../scripts/utils.js");
        require("../scripts/dom.js");
      }).not.toThrow();
      
      jest.resetModules();
      expect(() => {
        require("../scripts/dom.js");
        require("../scripts/utils.js");
      }).not.toThrow();
    });
  });

  describe("Module interface stability", () => {
    test("utils functions maintain consistent return types", () => {
      const utils = require("../scripts/utils.js");
      
      // Boolean returns
      expect(typeof utils.isCalcNumber("5")).toBe("boolean");
      expect(typeof utils.isOperator("+")).toBe("boolean");
      expect(typeof utils.checkSyntaxOnSolve("1+2")).toBe("boolean");
      
      // Array returns
      expect(Array.isArray(utils.tokenize("1 + 2"))).toBe(true);
      expect(Array.isArray(utils.convertFromInfixToPostfix(["1", "+", "2"]))).toBe(true);
      
      // Number returns
      expect(typeof utils.doMath(1, 2, "+")).toBe("number");
      expect(typeof utils.evaluatePostfixExpression(["1", "2", "+"])).toBe("number");
    });

    test("dom functions throw when document is null", () => {
      const domModule = require("../scripts/dom.js");
      const mockDocument = null;
      
      // These functions require a valid document and will throw if null
      expect(() => domModule.clearDisplay(null, mockDocument)).toThrow();
      expect(() => domModule.checkSyntaxOnInput("5", mockDocument)).toThrow();
    });
  });

  describe("CommonJS to ES Module migration readiness", () => {
    test("identifies current module.exports pattern", () => {
      const utilsSource = require("fs").readFileSync(
        require("path").join(__dirname, "../scripts/utils.ts"), 
        "utf8"
      );
      
      // Check for ES module patterns
      expect(utilsSource).toContain("export");
      // Note: utils.ts uses ES module exports
      
      // Document that ES modules are now used
      const hasESExports = utilsSource.includes("export const");
      expect(hasESExports).toBe(true);
    });

    test("identifies require statements that need conversion", () => {
      const domSource = require("fs").readFileSync(
        require("path").join(__dirname, "../scripts/dom.ts"),
        "utf8"
      );
      
      // Find all import statements (including multiline)
      const importMatches = domSource.match(/from\s+["'](.+?)["'];?/g);
      expect(importMatches).toBeTruthy();
      expect(importMatches.length).toBeGreaterThan(0);
      
      // Document dependencies
      const dependencies = importMatches.map(match => 
        match.match(/from\s+["'](.+?)["'];?/)[1]
      );
      
      expect(dependencies).toContain("./utils");
    });
  });

  describe("API contract validation", () => {
    test("tokenize maintains whitespace handling contract", () => {
      const utils = require("../scripts/utils.js");
      
      // Should split on spaces
      expect(utils.tokenize("1 + 2")).toEqual(["1", "+", "2"]);
      expect(utils.tokenize("1+2")).toEqual(["1+2"]); // No spaces = single token
      // Current behavior - includes empty strings from multiple spaces
      const result = utils.tokenize("  1   +   2  ");
      const filtered = result.filter(token => token !== "");
      expect(filtered).toEqual(["1", "+", "2"]);
    });

    test("normalizeSymbols mutates input array", () => {
      const utils = require("../scripts/utils.js");
      
      // Document current behavior - mutates array
      const input = ["5", "x", "3", "÷", "2"];
      const result = utils.normalizeSymbols(input);
      
      expect(result).toBe(input); // Returns same reference
      expect(input).toEqual(["5", "*", "3", "/", "2"]); // Mutated
    });

    test("solveExpression handles string input", () => {
      const domModule = require("../scripts/dom.js");
      
      // Takes string, returns number
      expect(typeof domModule.solveExpression("2 + 3")).toBe("number");
      expect(domModule.solveExpression("10 - 5")).toBe(5);
      expect(domModule.solveExpression("3 x 4")).toBe(12);
      expect(domModule.solveExpression("8 ÷ 2")).toBe(4);
    });
  });
});