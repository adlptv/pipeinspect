import { describe, it, expect } from "vitest";
import {
  cn,
  formatDuration,
  formatCurrency,
  slugify,
  truncate,
  sanitizeYamlInput,
  isValidUrl,
  detectCIFormat,
  getComplexityColor,
  getComplexityLabel,
} from "@/lib/utils";

describe("Utils", () => {
  describe("cn", () => {
    it("merges class names", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("handles conditional classes", () => {
      expect(cn("base", false && "no", true && "yes")).toBe("base yes");
    });
  });

  describe("formatDuration", () => {
    it("formats seconds", () => {
      expect(formatDuration(0.5)).toBe("30s");
    });

    it("formats minutes", () => {
      expect(formatDuration(5)).toBe("5.0m");
    });

    it("formats hours and minutes", () => {
      expect(formatDuration(90)).toBe("1h 30m");
    });
  });

  describe("formatCurrency", () => {
    it("formats USD", () => {
      expect(formatCurrency(10.5)).toContain("$");
      expect(formatCurrency(10.5)).toContain("10.50");
    });
  });

  describe("slugify", () => {
    it("converts to lowercase with dashes", () => {
      expect(slugify("Hello World")).toBe("hello-world");
    });

    it("handles special characters", () => {
      expect(slugify("Hello, World!")).toBe("hello-world");
    });
  });

  describe("truncate", () => {
    it("truncates long text", () => {
      const result = truncate("This is a long text", 10);
      expect(result.length).toBeLessThanOrEqual(10);
      expect(result).toEndWith("...");
    });

    it("keeps short text as-is", () => {
      expect(truncate("Short", 10)).toBe("Short");
    });
  });

  describe("sanitizeYamlInput", () => {
    it("removes Python YAML tags", () => {
      const input = "key: !!python/object/apply:os.system ['ls']";
      const result = sanitizeYamlInput(input);
      expect(result).not.toContain("!!python");
    });

    it("preserves GitHub Actions expressions", () => {
      const input = 'run: echo "${{ secrets.TOKEN }}"';
      const result = sanitizeYamlInput(input);
      expect(result).toContain("${{");
    });
  });

  describe("isValidUrl", () => {
    it("validates http URLs", () => {
      expect(isValidUrl("http://example.com")).toBe(true);
    });

    it("validates https URLs", () => {
      expect(isValidUrl("https://example.com")).toBe(true);
    });

    it("rejects invalid URLs", () => {
      expect(isValidUrl("not-a-url")).toBe(false);
    });
  });

  describe("getComplexityColor", () => {
    it("returns green for low scores", () => {
      expect(getComplexityColor(10)).toBe("text-green-500");
    });

    it("returns red for high scores", () => {
      expect(getComplexityColor(90)).toBe("text-red-500");
    });
  });

  describe("getComplexityLabel", () => {
    it("returns Simple for low scores", () => {
      expect(getComplexityLabel(10)).toBe("Simple");
    });

    it("returns Very Complex for high scores", () => {
      expect(getComplexityLabel(90)).toBe("Very Complex");
    });
  });
});
