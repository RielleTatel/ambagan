import { isEmail, isNonEmpty } from "../validation";

describe("isEmail", () => {
  it("returns true for a valid email", () => {
    expect(isEmail("user@example.com")).toBe(true);
  });

  it("returns false for a string without @", () => {
    expect(isEmail("not-an-email")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isEmail("")).toBe(false);
  });
});

describe("isNonEmpty", () => {
  it("returns true for a non-empty string", () => {
    expect(isNonEmpty("hello")).toBe(true);
  });

  it("returns false for blank string", () => {
    expect(isNonEmpty("   ")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isNonEmpty("")).toBe(false);
  });
});
