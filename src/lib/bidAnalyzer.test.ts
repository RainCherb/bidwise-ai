import { describe, expect, it } from "vitest";
import { sampleRfp } from "../data/sampleRfp";
import { analyzeBid } from "./bidAnalyzer";

describe("analyzeBid", () => {
  it("finds commercial and delivery signals in the sample RFP", () => {
    const analysis = analyzeBid(sampleRfp, {
      strengths: "AI prototypes dashboard automation retail analytics training",
      constraints: "Limited capacity, needs paid discovery for fixed budget work",
      weeklyCapacityHours: 20,
    });

    expect(analysis.score).toBeGreaterThan(40);
    expect(analysis.signals.some((signal) => signal.label === "AI or analytics fit")).toBe(true);
    expect(analysis.signals.some((signal) => signal.label === "No paid discovery")).toBe(true);
    expect(analysis.extractedBudget).toBe("$42,000");
    expect(analysis.questions.length).toBeGreaterThan(2);
    expect(analysis.aiPrompt).toContain("senior bid strategist");
  });

  it("recommends no bid for vague high-risk work", () => {
    const analysis = analyzeBid(
      "Urgent transformation project. Proposal due within 2 days. No budget. No paid discovery. Vendor must guarantee ROI and unlimited support.",
      {
        strengths: "workflow automation",
        constraints: "No fixed-price projects without discovery",
        weeklyCapacityHours: 8,
      },
    );

    expect(analysis.decision).toBe("No bid");
    expect(analysis.riskLevel).toBe("high");
  });
});
