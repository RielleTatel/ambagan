import { formatCurrency, formatDate } from "../format";

describe("formatCurrency", () => {
  it("formats a number as PHP currency", () => {
    const result = formatCurrency(1000);
    expect(result).toContain("1,000");
    expect(result).toContain("₱");
  });

  it("accepts a custom currency code", () => {
    const result = formatCurrency(50, "USD");
    expect(result).toContain("$");
  });
});

describe("formatDate", () => {
  it("formats a Date object to a readable string", () => {
    const result = formatDate(new Date("2024-01-15"));
    expect(result).toMatch(/Jan/i);
    expect(result).toContain("2024");
  });

  it("accepts an ISO date string", () => {
    const result = formatDate("2024-06-01");
    expect(result).toMatch(/Jun/i);
  });
});
