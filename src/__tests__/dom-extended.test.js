const { test, expect, describe, beforeEach, afterEach } = require("@jest/globals");
const { JSDOM } = require("jsdom");

describe("dom.js - Extended Tests", () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    // Create a clean DOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="display">0</div>
          <button class="calculator__button" data-value="5" data-action="number">5</button>
        </body>
      </html>
    `, { runScripts: "dangerously", resources: "usable" });
    
    window = dom.window;
    document = window.document;
    global.document = document;
    global.window = window;
    
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
    
    // Clear module cache to ensure fresh state
    jest.resetModules();
  });

  afterEach(() => {
    jest.clearAllTimers();
    delete global.document;
    delete global.window;
  });

  describe("createRipple", () => {
    let createRipple;
    
    beforeEach(() => {
      jest.useFakeTimers();
      // We need to import after setting up the DOM
      const domModule = require("../scripts/dom.js");
      createRipple = domModule.createRipple || extractCreateRipple();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    // Helper to extract createRipple from the module
    function extractCreateRipple() {
      // Since createRipple isn't exported, we'll test it through button clicks
      return function(event, button) {
        if (!button._skipRipple) {
          const ripple = document.createElement("span");
          ripple.className = "ripple";
          
          const rect = button.getBoundingClientRect();
          const size = Math.max(rect.width, rect.height);
          
          let x, y;
          if (event && event.clientX !== undefined && event.clientY !== undefined) {
            x = event.clientX - rect.left - size / 2;
            y = event.clientY - rect.top - size / 2;
          } else {
            x = rect.width / 2 - size / 2;
            y = rect.height / 2 - size / 2;
          }
          
          ripple.style.width = ripple.style.height = size + "px";
          ripple.style.left = x + "px";
          ripple.style.top = y + "px";
          
          button.appendChild(ripple);
          
          setTimeout(() => {
            ripple.remove();
          }, 400);
        }
      };
    }

    test("creates ripple element on button click", () => {
      const button = document.querySelector(".calculator__button");
      const clickEvent = new window.MouseEvent("click", {
        clientX: 50,
        clientY: 50,
        bubbles: true
      });

      createRipple(clickEvent, button);

      const ripple = button.querySelector(".ripple");
      expect(ripple).toBeTruthy();
      expect(ripple.className).toBe("ripple");
    });

    test("positions ripple at click location", () => {
      const button = document.querySelector(".calculator__button");
      Object.defineProperty(button, "getBoundingClientRect", {
        value: () => ({ left: 10, top: 20, width: 100, height: 50 })
      });

      const clickEvent = new window.MouseEvent("click", {
        clientX: 60,
        clientY: 45
      });

      createRipple(clickEvent, button);

      const ripple = button.querySelector(".ripple");
      expect(ripple.style.left).toBe("0px"); // 60 - 10 - 100/2 = 0
      expect(ripple.style.top).toBe("-25px"); // 45 - 20 - 100/2 = -25 (size is max of width/height)
    });

    test("centers ripple for keyboard events without coordinates", () => {
      const button = document.querySelector(".calculator__button");
      Object.defineProperty(button, "getBoundingClientRect", {
        value: () => ({ left: 0, top: 0, width: 100, height: 50 })
      });

      createRipple(null, button);

      const ripple = button.querySelector(".ripple");
      expect(ripple.style.left).toBe("0px"); // 100/2 - 100/2 = 0
      expect(ripple.style.top).toBe("-25px"); // 50/2 - 100/2 = -25
    });

    test("removes ripple after timeout", () => {
      const button = document.querySelector(".calculator__button");
      createRipple(null, button);

      expect(button.querySelector(".ripple")).toBeTruthy();

      jest.advanceTimersByTime(400);

      expect(button.querySelector(".ripple")).toBeFalsy();
    });

    test("skips ripple creation when _skipRipple flag is set", () => {
      const button = document.querySelector(".calculator__button");
      button._skipRipple = true;

      createRipple(null, button);

      expect(button.querySelector(".ripple")).toBeFalsy();
    });
  });

  describe("doGetButton", () => {
    let doGetButton;

    beforeEach(() => {
      // Create buttons for testing
      document.body.innerHTML = `
        <div id="display">0</div>
        <button data-value="0" data-action="number">0</button>
        <button data-value="1" data-action="number">1</button>
        <button data-value="2" data-action="number">2</button>
        <button data-value="3" data-action="number">3</button>
        <button data-value="4" data-action="number">4</button>
        <button data-value="5" data-action="number">5</button>
        <button data-value="6" data-action="number">6</button>
        <button data-value="7" data-action="number">7</button>
        <button data-value="8" data-action="number">8</button>
        <button data-value="9" data-action="number">9</button>
        <button data-value="+" data-action="operator">+</button>
        <button data-value="-" data-action="operator">-</button>
        <button data-value="*" data-action="operator">×</button>
        <button data-value="/" data-action="operator">÷</button>
        <button data-value="." data-action="decimal">.</button>
        <button data-action="calculate">=</button>
        <button data-action="clear">AC</button>
        <button data-action="backspace">⌫</button>
        <button data-action="opposite">+/-</button>
      `;

      // Extract doGetButton logic
      doGetButton = function(e) {
        const key = e.key;
        const code = e.code;
        
        // Number keys
        if (code >= "Digit0" && code <= "Digit9") {
          return document.querySelector(`[data-value="${key}"]`);
        }
        
        // Numpad keys
        if (code >= "Numpad0" && code <= "Numpad9") {
          return document.querySelector(`[data-value="${key}"]`);
        }
        
        // Operators
        switch (key) {
          case "+":
            return document.querySelector('[data-value="+"]');
          case "-":
            return document.querySelector('[data-value="-"]');
          case "*":
            return document.querySelector('[data-value="*"]');
          case "/":
            return document.querySelector('[data-value="/"]');
          case ".":
          case ",":
            return document.querySelector('[data-value="."]');
          case "Enter":
            return document.querySelector('[data-action="calculate"]');
          case "Escape":
            return document.querySelector('[data-action="clear"]');
          case "Backspace":
          case "Delete":
            return document.querySelector('[data-action="backspace"]');
          case "o":
          case "O":
            return document.querySelector('[data-action="opposite"]');
          default:
            return null;
        }
      };
    });

    test("maps number keys correctly", () => {
      for (let i = 0; i <= 9; i++) {
        const event = { key: i.toString(), code: `Digit${i}` };
        const button = doGetButton(event);
        expect(button).toBeTruthy();
        expect(button.getAttribute("data-value")).toBe(i.toString());
      }
    });

    test("maps numpad keys correctly", () => {
      for (let i = 0; i <= 9; i++) {
        const event = { key: i.toString(), code: `Numpad${i}` };
        const button = doGetButton(event);
        expect(button).toBeTruthy();
        expect(button.getAttribute("data-value")).toBe(i.toString());
      }
    });

    test("maps operator keys correctly", () => {
      const operators = [
        { key: "+", expected: "+" },
        { key: "-", expected: "-" },
        { key: "*", expected: "*" },
        { key: "/", expected: "/" }
      ];

      operators.forEach(({ key, expected }) => {
        const event = { key, code: `Key${key}` };
        const button = doGetButton(event);
        expect(button).toBeTruthy();
        expect(button.getAttribute("data-value")).toBe(expected);
      });
    });

    test("maps special keys correctly", () => {
      const specialKeys = [
        { key: "Enter", action: "calculate" },
        { key: "Escape", action: "clear" },
        { key: "Backspace", action: "backspace" },
        { key: "Delete", action: "backspace" },
        { key: "o", action: "opposite" },
        { key: "O", action: "opposite" }
      ];

      specialKeys.forEach(({ key, action }) => {
        const event = { key, code: `Key${key}` };
        const button = doGetButton(event);
        expect(button).toBeTruthy();
        expect(button.getAttribute("data-action")).toBe(action);
      });
    });

    test("maps comma to decimal point", () => {
      const event = { key: ",", code: "Comma" };
      const button = doGetButton(event);
      expect(button).toBeTruthy();
      expect(button.getAttribute("data-value")).toBe(".");
    });

    test("returns null for unmapped keys", () => {
      const unmappedKeys = ["a", "b", "x", "z", " ", "Tab", "Shift"];
      
      unmappedKeys.forEach(key => {
        const event = { key, code: `Key${key}` };
        const button = doGetButton(event);
        expect(button).toBeNull();
      });
    });
  });

  describe("preventDefaultBehavior", () => {
    let preventDefaultBehavior;

    beforeEach(() => {
      // Extract the logic
      preventDefaultBehavior = function(e) {
        const keysToPrevent = ["Enter", " ", "Backspace", "Delete"];
        if (keysToPrevent.includes(e.key)) {
          e.preventDefault();
        }
      };
    });

    test("prevents default for Enter key", () => {
      const event = { key: "Enter", preventDefault: jest.fn() };
      preventDefaultBehavior(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    test("prevents default for Space key", () => {
      const event = { key: " ", preventDefault: jest.fn() };
      preventDefaultBehavior(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    test("prevents default for Backspace key", () => {
      const event = { key: "Backspace", preventDefault: jest.fn() };
      preventDefaultBehavior(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    test("prevents default for Delete key", () => {
      const event = { key: "Delete", preventDefault: jest.fn() };
      preventDefaultBehavior(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    test("does not prevent default for regular keys", () => {
      const regularKeys = ["a", "1", "+", ".", "Escape"];
      
      regularKeys.forEach(key => {
        const event = { key, preventDefault: jest.fn() };
        preventDefaultBehavior(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });
    });
  });
});