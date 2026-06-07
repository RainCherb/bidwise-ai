export type Decision = "Bid" | "Qualify" | "No bid";
export type RiskLevel = "low" | "medium" | "high";

export type CompanyProfile = {
  name: string;
  strengths: string;
  constraints: string;
  minimumMargin: number;
  weeklyCapacityHours: number;
};

export type Signal = {
  label: string;
  detail: string;
  impact: number;
  kind: "positive" | "risk" | "neutral";
};

export type BidAnalysis = {
  decision: Decision;
  confidence: number;
  score: number;
  riskLevel: RiskLevel;
  estimatedEffortHours: number;
  extractedBudget: string | null;
  extractedDeadline: string | null;
  signals: Signal[];
  missingInfo: string[];
  questions: string[];
  actionPlan: string[];
  executiveBrief: string;
  aiPrompt: string;
};

type PatternSignal = {
  label: string;
  detail: string;
  impact: number;
  kind: Signal["kind"];
  patterns: RegExp[];
};

const positiveSignals: PatternSignal[] = [
  {
    label: "Clear scope",
    detail: "The request describes concrete deliverables instead of a vague transformation project.",
    impact: 14,
    kind: "positive",
    patterns: [/scope/i, /deliver/i, /dashboard/i, /pilot/i, /training/i],
  },
  {
    label: "Evaluation criteria published",
    detail: "The buyer exposes how proposals will be scored, making it easier to target the response.",
    impact: 12,
    kind: "positive",
    patterns: [/evaluation/i, /\d+%/, /criteria/i, /scored/i],
  },
  {
    label: "Budget visible",
    detail: "A stated budget ceiling reduces pricing guesswork and helps qualify margin early.",
    impact: 10,
    kind: "positive",
    patterns: [/budget/i, /ceiling/i, /\$\s?\d+/, /fixed price/i],
  },
  {
    label: "Pilot-sized opportunity",
    detail: "Pilot language suggests a contained project with a practical proof point.",
    impact: 8,
    kind: "positive",
    patterns: [/pilot/i, /proof/i, /MVP/i, /phase 1/i],
  },
  {
    label: "AI or analytics fit",
    detail: "The problem matches a data, automation, or AI-assisted service offer.",
    impact: 12,
    kind: "positive",
    patterns: [/AI/i, /forecast/i, /analytics/i, /automation/i, /machine learning/i, /dashboard/i],
  },
];

const riskSignals: PatternSignal[] = [
  {
    label: "Compressed timeline",
    detail: "The deadline appears tight enough to pressure discovery, pricing, and delivery quality.",
    impact: -14,
    kind: "risk",
    patterns: [/due.*\d+\s*(day|calendar)/i, /within\s+\d+\s*(day|week)/i, /urgent/i, /immediate/i],
  },
  {
    label: "No paid discovery",
    detail: "The buyer may expect estimation and solution design before the unknowns are understood.",
    impact: -16,
    kind: "risk",
    patterns: [/no paid discovery/i, /unpaid discovery/i, /free discovery/i],
  },
  {
    label: "Data quality concern",
    detail: "Messy source data can expand effort and weaken the final outcome.",
    impact: -12,
    kind: "risk",
    patterns: [/data quality/i, /inconsistent/i, /messy/i, /manual spreadsheet/i, /spreadsheet/i],
  },
  {
    label: "Security burden",
    detail: "Privacy, access, or compliance requirements may add review time and delivery work.",
    impact: -8,
    kind: "risk",
    patterns: [/privacy/i, /security/i, /role-based/i, /SOC 2/i, /GDPR/i, /HIPAA/i],
  },
  {
    label: "Heavy reporting expectation",
    detail: "Frequent executive readouts can consume senior time that is easy to underprice.",
    impact: -7,
    kind: "risk",
    patterns: [/executive readout/i, /weekly readout/i, /steering committee/i, /status meeting/i],
  },
];

const defaultProfile: CompanyProfile = {
  name: "Your company",
  strengths: "AI prototypes, workflow automation, dashboard delivery, and practical training.",
  constraints: "Limited senior delivery capacity and preference for paid discovery before fixed scope.",
  minimumMargin: 35,
  weeklyCapacityHours: 24,
};

export function analyzeBid(
  rawText: string,
  profile: Partial<CompanyProfile> = {},
): BidAnalysis {
  const normalizedProfile = { ...defaultProfile, ...profile };
  const text = rawText.trim();
  const wordCount = countWords(text);
  const extractedBudget = extractBudget(text);
  const extractedDeadline = extractDeadline(text);
  const signals = collectSignals(text, normalizedProfile);
  const missingInfo = findMissingInfo(text);
  const estimatedEffortHours = estimateEffort(text, wordCount);
  const capacityPenalty =
    estimatedEffortHours > normalizedProfile.weeklyCapacityHours * 4 ? -18 : 0;
  const missingPenalty = Math.min(missingInfo.length * 5, 20);
  const signalScore = signals.reduce((sum, signal) => sum + signal.impact, 0);
  const score = clamp(58 + signalScore + capacityPenalty - missingPenalty, 0, 100);
  const riskLevel = score >= 72 ? "low" : score >= 48 ? "medium" : "high";
  const decision: Decision = score >= 72 ? "Bid" : score >= 48 ? "Qualify" : "No bid";
  const confidence = clamp(52 + signals.length * 6 - missingInfo.length * 4, 35, 92);
  const questions = buildQuestions(text, missingInfo);
  const actionPlan = buildActionPlan(decision, riskLevel, normalizedProfile);
  const executiveBrief = buildExecutiveBrief(decision, score, riskLevel, signals, missingInfo);
  const aiPrompt = buildAiPrompt(text, normalizedProfile, {
    decision,
    score,
    riskLevel,
    missingInfo,
    questions,
  });

  return {
    decision,
    confidence,
    score,
    riskLevel,
    estimatedEffortHours,
    extractedBudget,
    extractedDeadline,
    signals,
    missingInfo,
    questions,
    actionPlan,
    executiveBrief,
    aiPrompt,
  };
}

function collectSignals(text: string, profile: CompanyProfile): Signal[] {
  const patternSignals = [...positiveSignals, ...riskSignals]
    .filter((signal) => signal.patterns.some((pattern) => pattern.test(text)))
    .map(({ label, detail, impact, kind }) => ({ label, detail, impact, kind }));

  const strengthWords = tokenize(profile.strengths);
  const overlap = strengthWords.filter((word) => text.toLowerCase().includes(word));

  if (overlap.length >= 2) {
    patternSignals.push({
      label: "Strong capability match",
      detail: `The RFP overlaps with your stated strengths: ${overlap.slice(0, 4).join(", ")}.`,
      impact: 12,
      kind: "positive",
    });
  }

  if (/fixed budget|budget ceiling|not to exceed/i.test(text) && /limited|capacity|margin|discovery/i.test(profile.constraints)) {
    patternSignals.push({
      label: "Commercial fit needs review",
      detail: "Your constraints suggest the budget and discovery model should be qualified before bidding.",
      impact: -10,
      kind: "risk",
    });
  }

  return patternSignals;
}

function findMissingInfo(text: string): string[] {
  const checks: Array<[string, RegExp]> = [
    ["Target users or departments", /user|department|team|manager|stakeholder/i],
    ["Current tools and systems", /CRM|ERP|POS|Shopify|Salesforce|HubSpot|spreadsheet|system|database/i],
    ["Decision timeline after submission", /award|selection|decision|shortlist/i],
    ["Budget or pricing model", /budget|price|pricing|ceiling|not to exceed|\$/i],
    ["Success metrics", /success|KPI|metric|outcome|impact|ROI/i],
    ["Security or data handling expectations", /privacy|security|data handling|access|compliance/i],
  ];

  return checks
    .filter(([, pattern]) => !pattern.test(text))
    .map(([label]) => label);
}

function buildQuestions(text: string, missingInfo: string[]): string[] {
  const questions = missingInfo.map((item) => `Can you clarify the expected ${item.toLowerCase()}?`);

  if (/data quality|inconsistent|spreadsheet/i.test(text)) {
    questions.push("Can we review a representative sample of source data before final pricing?");
  }

  if (/fixed budget|budget ceiling|not to exceed/i.test(text)) {
    questions.push("Is the stated budget inclusive of implementation, training, support, and any third-party tools?");
  }

  if (/within\s+\d+\s*(day|week)|due.*\d+\s*(day|calendar)/i.test(text)) {
    questions.push("If the timeline is fixed, which scope items can be deferred if discovery reveals data blockers?");
  }

  return dedupe(questions).slice(0, 7);
}

function buildActionPlan(
  decision: Decision,
  riskLevel: RiskLevel,
  profile: CompanyProfile,
): string[] {
  if (decision === "No bid") {
    return [
      "Send a polite decline or request a discovery call before investing proposal time.",
      "Document the top disqualifiers so future opportunities can be screened faster.",
      "Offer a smaller paid assessment if the buyer wants a lower-risk starting point.",
    ];
  }

  const base = [
    "Schedule a 30-minute qualification call before writing the full response.",
    "Turn the evaluation criteria into proposal section headings.",
    "Attach proof: one relevant case study, a delivery timeline, and a risk register.",
    "Price discovery, data cleanup, and executive reporting explicitly instead of burying them.",
  ];

  if (riskLevel !== "low") {
    base.unshift(`Check capacity against ${profile.weeklyCapacityHours} weekly delivery hours before committing.`);
  }

  return base;
}

function buildExecutiveBrief(
  decision: Decision,
  score: number,
  riskLevel: RiskLevel,
  signals: Signal[],
  missingInfo: string[],
): string {
  const topPositive = signals.find((signal) => signal.kind === "positive")?.label ?? "No standout positive signal";
  const topRisk = signals.find((signal) => signal.kind === "risk")?.label ?? "No standout risk signal";
  return `${decision} recommendation with a ${score}/100 fit score and ${riskLevel} risk. Best reason to pursue: ${topPositive}. Main concern: ${topRisk}. Clarify ${missingInfo.length} missing item${missingInfo.length === 1 ? "" : "s"} before committing senior proposal time.`;
}

function buildAiPrompt(
  text: string,
  profile: CompanyProfile,
  summary: Pick<BidAnalysis, "decision" | "score" | "riskLevel" | "missingInfo" | "questions">,
): string {
  return `You are a senior bid strategist for a small business.

Company profile:
- Name: ${profile.name}
- Strengths: ${profile.strengths}
- Constraints: ${profile.constraints}
- Minimum target margin: ${profile.minimumMargin}%
- Weekly delivery capacity: ${profile.weeklyCapacityHours} hours

Initial automated screen:
- Recommendation: ${summary.decision}
- Fit score: ${summary.score}/100
- Risk level: ${summary.riskLevel}
- Missing information: ${summary.missingInfo.join(", ") || "none detected"}
- Qualification questions: ${summary.questions.join(" | ") || "none"}

Task:
1. Challenge the recommendation.
2. Identify hidden delivery, legal, data, and commercial risks.
3. Draft a bid/no-bid memo for the owner.
4. If bidding, outline a 5-section proposal and the strongest win themes.

RFP text:
${text}`;
}

function estimateEffort(text: string, wordCount: number): number {
  let hours = Math.max(12, Math.round(wordCount / 18));
  if (/integration|connect|API|database|warehouse|ERP|CRM|POS/i.test(text)) hours += 18;
  if (/training|workshop|enablement/i.test(text)) hours += 8;
  if (/dashboard|report|analytics|forecast/i.test(text)) hours += 18;
  if (/security|privacy|compliance|role-based/i.test(text)) hours += 10;
  if (/executive|steering|weekly/i.test(text)) hours += 8;
  return clamp(hours, 8, 240);
}

function extractBudget(text: string): string | null {
  const match = text.match(/(?:\$|USD\s*)\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?/i);
  return match?.[0].replace(/\s+/g, "") ?? null;
}

function extractDeadline(text: string): string | null {
  const patterns = [
    /proposal due:?\s*([^\n.]+)/i,
    /due:?\s*([^\n.]+)/i,
    /deadline:?\s*([^\n.]+)/i,
    /within\s+\d+\s+(?:calendar\s+)?(?:days|weeks)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return (match[1] ?? match[0]).trim();
  }

  return null;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function tokenize(text: string): string[] {
  const stopWords = new Set(["and", "the", "for", "with", "your", "from", "into", "that", "this"]);
  return dedupe(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3 && !stopWords.has(word)),
  );
}

function dedupe<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
