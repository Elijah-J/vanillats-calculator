const { isOperator } = require("../scripts/utils.js");
const { test, expect, describe } = require("@jest/globals");

describe("utils.js - Extended Tests", () => {
  describe("isOperator", () => {
    test("returns true for addition operator", () => {
      expect(isOperator("+")).toBe(true);
    });

    test("returns true for subtraction operator", () => {
      expect(isOperator("-")).toBe(true);
    });

    test("returns true for multiplication operator (x)", () => {
      expect(isOperator("x")).toBe(true);
    });

    test("returns true for division operator (÷)", () => {
      expect(isOperator("÷")).toBe(true);
    });

    test("returns false for normalized multiplication operator (*)", () => {
      expect(isOperator("*")).toBe(false);
    });

    test("returns false for normalized division operator (/)", () => {
      expect(isOperator("/")).toBe(false);
    });

    test("returns false for numbers", () => {
      expect(isOperator("1")).toBe(false);
      expect(isOperator("0")).toBe(false);
      expect(isOperator("9")).toBe(false);
    });

    test("returns false for decimal point", () => {
      expect(isOperator(".")).toBe(false);
    });

    test("returns true for empty string (current behavior)", () => {
      // Document current behavior - empty string returns true
      expect(isOperator("")).toBe(true);
    });

    test("returns false for null", () => {
      expect(isOperator(null)).toBe(false);
    });

    test("returns false for undefined", () => {
      expect(isOperator(undefined)).toBe(false);
    });

    test("returns false for other characters", () => {
      expect(isOperator("=")).toBe(false);
      expect(isOperator("(")).toBe(false);
      expect(isOperator(")")).toBe(false);
      expect(isOperator("%")).toBe(false);
    });
  });
});