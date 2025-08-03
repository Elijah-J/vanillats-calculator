const {
  clearDisplay,
  clearSolution,
  clickButton,
  deactivateButton,
  getButtonFromKeyEventCode,
  checkSyntaxOnInput,
  printSolution,
  printToDisplay,
  removeLastCharacter,
  solveExpression,
  switchSign,
} = require("../scripts/dom.js");

const { test, expect } = require("@jest/globals");
const { createEvent, getByText, fireEvent } = require("@testing-library/dom");
const { JSDOM } = require("jsdom");
const path = require("path");
require("iconv-lite").encodingExists("foo"); // workaround to allow utf-8 support

const pathToHtml = path.resolve(__dirname, "../../dist/index.html");
const options = {
  runScripts: "dangerously",
  resources: "usable",
};
let dom, container;

const sleep = (ms = 100) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const pollModules = async () => {
  while (dom.window.modulesLoaded !== true) {
    await sleep();
  }
  return;
};

describe("dom.js", () => {
  beforeEach(async () => {
    dom = await JSDOM.fromFile(pathToHtml, options);
    await pollModules();
    container = dom.window.document;
    // Set global document for createRipple function
    global.document = dom.window.document;
  });

  it("confirms calculator is rendered", () => {
    expect(container.body.querySelector(".calculator")).not.toBeNull();
  });

  it("confirms 19 calculator buttons are rendered", () => {
    expect(container.body.querySelectorAll("button").length).toBe(19);
  });

  // check event listeners
  it("confirms each calculator button has onclick event listener", () => {
    let calculatorButtons = container.body.querySelectorAll(".calculator__button");

    let areAllEventListenersPresent = true;
    for (const calculatorButton of calculatorButtons) {
      if (calculatorButton.onclick === null) {
        areAllEventListenersPresent = false;
        break;
      }
    }
    expect(areAllEventListenersPresent).toBe(true);
  });

  it("confirms clear-expression button has onclick event listener", () => {
    let clearExpression = container.body.querySelector("#clear-expression");
    expect(clearExpression.onclick).not.toBe(null);
  });

  it("confirms backspace button has onclick event listener", () => {
    let backspace = container.body.querySelector("#backspace");
    expect(backspace.onclick).not.toBe(null);
  });

  it("confirms calculator-opposite button has onclick event listener", () => {
    let calculatorOpposite = container.body.querySelector(
      "#calculator-opposite"
    );
    expect(calculatorOpposite.onclick).not.toBe(null);
  });

  it("confirms solveButton button has onclick event listener", () => {
    let solveButton = container.body.querySelector(".calculator__button--equals");
    expect(solveButton.onclick).not.toBe(null);
  });

  // getButtonFromKeyCode
  it("confirms key code is extracted correctly", async () => {
    const event = createEvent.keyDown(container, { key: "1", code: "Digit1" });
    const buttonOne = getByText(container, "1");

    expect(getButtonFromKeyEventCode(event, container)).toEqual(buttonOne);
  });

  // clearDisplay
  it("confirms display clears", () => {
    container.querySelector("#display").innerText = "full1";
    clearDisplay(null, container);
    expect(container.querySelector("#display").innerText).toBe("0");
  });

  // clearSolution
  it("confirms value of solutionDisplaying is falsified", () => {
    let output = clearSolution(container, true);
    expect(output).toBe(false);
  });

  it("confirms clearSolution clears display if one is showing", () => {
    container.querySelector("#display").innerText = "full2";
    clearSolution(container, true);
    expect(container.querySelector("#display").innerText).toBe("0");
  });

  // clickButton
  it("confirms clickButton activates clicked button active class", () => {
    const event = createEvent.keyDown(container, {
      key: "1",
      code: "Digit1",
    });
    let clickedButton = clickButton(event, container);
    expect(clickedButton.classList.contains("calculator__button--active")).toBe(
      true
    );
  });

  // deactivateButton
  it("confirms clickButton activates clicked button active class", () => {
    const event = createEvent.keyDown(container, {
      key: "1",
      code: "Digit1",
    });

    let clickedButton = deactivateButton(event, container);
    expect(clickedButton.classList.contains("calculator__button--active")).toBe(
      false
    );
  });

  // checkSyntaxOnInput
  it("confirms specific cases pass checkSyntaxOnInput", () => {
    container.getElementById("display").innerText = "5";
    let output = checkSyntaxOnInput(".", container);
    expect(output).toBe(true);

    output = checkSyntaxOnInput("1", container);
    expect(output).toBe(true);

    container.getElementById("display").innerText = ".";
    output = checkSyntaxOnInput("9", container);
    expect(output).toBe(true);
  });

  it("confirms specific cases fail checkSyntaxOnInput", () => {
    container.getElementById("display").innerText = ".";
    let output = checkSyntaxOnInput(".", container);
    expect(output).toBe(false);

    container.getElementById("display").innerText = "";
    output = checkSyntaxOnInput("+", container);
    expect(output).toBe(false);

    container.getElementById("display").innerText = " + ";
    output = checkSyntaxOnInput("-", container);
    expect(output).toBe(false);

    container.getElementById("display").innerText = "5.3";
    output = checkSyntaxOnInput(".", container);
    expect(output).toBe(false);
  });

  // removeLastCharacter
  it("confirms specific cases simply remove the final character", () => {
    container.getElementById("display").innerText = "53";
    removeLastCharacter(null, container);
    expect(container.querySelector("#display").innerText).toBe("5");

    container.getElementById("display").innerText = "9.";
    removeLastCharacter(null, container);
    expect(container.querySelector("#display").innerText).toBe("9");

    container.getElementById("display").innerText = "5";
    removeLastCharacter(null, container);
    expect(container.querySelector("#display").innerText).toBe("");
  });

  it("confirms specific cases remove trailing operators and spaces", () => {
    container.getElementById("display").innerText = "53 + ";
    removeLastCharacter(null, container);
    expect(container.querySelector("#display").innerText).toBe("53");

    container.getElementById("display").innerText = "98 - ";
    removeLastCharacter(null, container);
    expect(container.querySelector("#display").innerText).toBe("98");

    container.getElementById("display").innerText = "5 x ";
    removeLastCharacter(null, container);
    expect(container.querySelector("#display").innerText).toBe("5");

    container.getElementById("display").innerText = " ÷ ";
    removeLastCharacter(null, container);
    expect(container.querySelector("#display").innerText).toBe("");
  });

  // printToDisplay
  it("confirms printToDisplay correctly prints set of specific inputs", () => {
    let symbol = "1";
    container.querySelector("#display").innerText = "";
    printToDisplay(symbol, container);
    expect(container.querySelector("#display").innerText).toBe(symbol);

    symbol = "+";
    container.querySelector("#display").innerText = "1";
    printToDisplay(symbol, container);
    expect(container.querySelector("#display").innerText).toBe(
      `1\xa0${symbol}\xa0`
    );

    symbol = ".";
    container.querySelector("#display").innerText = "1";
    printToDisplay(symbol, container);
    expect(container.querySelector("#display").innerText).toBe(`1${symbol}`);

    symbol = "7";
    container.querySelector("#display").innerText = "1234567890123456";
    printToDisplay(symbol, container);
    expect(container.querySelector("#display").innerText).toBe(
      "12345678901234567"
    );
  });

  // printToDisplay
  it("confirms printToDisplay does not print a decimal that does not follow an integer", () => {
    let displayText = "5 + ";
    container.querySelector("#display").innerText = displayText;
    printToDisplay(".", container);
    expect(container.querySelector("#display").innerText).toBe(displayText);
  });

  it("confirms printToDisplay does not print when screen is at capacity", () => {
    let displayText = "12345678901234567";
    container.querySelector("#display").innerText = displayText;
    printToDisplay("8", container);
    expect(container.querySelector("#display").innerText).toBe(displayText);
  });

  // printSolution
  it("confirms printSolution correctly prints a specific set of inputs", () => {
    let solution = 123;
    container.querySelector("#display").innerText = "";
    printSolution(solution, container);
    expect(container.querySelector("#display").innerText).toBe(
      solution.toString()
    );

    solution = 4.56;
    container.querySelector("#display").innerText = "";
    printSolution(solution, container);
    expect(container.querySelector("#display").innerText).toBe(
      solution.toString()
    );

    solution = -7.89;
    container.querySelector("#display").innerText = "";
    printSolution(solution, container);
    expect(container.querySelector("#display").innerText).toBe(
      solution.toString()
    );

    solution = 0;
    container.querySelector("#display").innerText = "";
    printSolution(solution, container);
    expect(container.querySelector("#display").innerText).toBe(
      solution.toString()
    );
  });

  it("confirms printSolution correctly rounds decimals", () => {
    let solution = 1.234567890123456;
    container.querySelector("#display").innerText = "";
    printSolution(solution, container);
    expect(container.querySelector("#display").innerText).toBe(
      "1.23456789012346"
    );

    solution = 16.099999999999998;
    container.querySelector("#display").innerText = "";
    printSolution(solution, container);
    expect(container.querySelector("#display").innerText).toBe("16.1");
  });

  it("confirms printSolution correctly signifies an overflow", () => {
    let solution = 12345678901234567;
    container.querySelector("#display").innerText = "";
    printSolution(solution, container);
    expect(container.querySelector("#display").innerText).toBe("Overflow");
  });

  it("confirms printSolution correctly signifies a divide by zero error", () => {
    let solution = Infinity;
    container.querySelector("#display").innerText = "";
    printSolution(solution, container);
    expect(container.querySelector("#display").innerText).toBe(
      "Divide by Zero"
    );
  });

  // solveExpression
  it("confirms solveExpression correctly solves a specific set of expressions", () => {
    let solution = solveExpression("2 + 2");
    expect(solution).toBe(4);

    solution = solveExpression("2 + 2 - 3");
    expect(solution).toBe(1);

    solution = solveExpression("2 + 2 x 3");
    expect(solution).toBe(8);

    solution = solveExpression("9 ÷ 9");
    expect(solution).toBe(1);
  });

  // switchSign
  it("confirms switchSign correctly transforms a number into its opposite", () => {
    let displayText = "12";
    container.querySelector("#display").innerText = displayText;
    switchSign(null, container, false);
    expect(container.querySelector("#display").innerText).toBe(
      "-" + displayText
    );

    container.querySelector("#display").innerText = "-1.2";
    switchSign(null, container, false);
    expect(container.querySelector("#display").innerText).toBe("1.2");
  });
});
