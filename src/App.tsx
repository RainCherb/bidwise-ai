import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  ClipboardCheck,
  Copy,
  FileText,
  Gauge,
  HelpCircle,
  ListChecks,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { sampleRfp } from "./data/sampleRfp";
import { analyzeBid, type CompanyProfile, type Decision, type Signal } from "./lib/bidAnalyzer";

const initialProfile: CompanyProfile = {
  name: "Northstar Automation Studio",
  strengths: "AI prototypes, retail analytics, dashboards, workflow automation, training",
  constraints: "Small delivery team, limited senior capacity, needs paid discovery before fixed-scope data work",
  minimumMargin: 35,
  weeklyCapacityHours: 22,
};

const decisionTone: Record<Decision, string> = {
  Bid: "bid",
  Qualify: "qualify",
  "No bid": "no-bid",
};

function App() {
  const [rfpText, setRfpText] = useState(sampleRfp);
  const [profile, setProfile] = useState<CompanyProfile>(initialProfile);
  const [copied, setCopied] = useState(false);
  const analysis = useMemo(() => analyzeBid(rfpText, profile), [rfpText, profile]);

  async function copyPrompt() {
    await navigator.clipboard.writeText(analysis.aiPrompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="app-shell">
      <section className="workspace-header">
        <div>
          <div className="eyebrow">
            <Sparkles size={16} aria-hidden="true" />
            Privacy-first AI bid desk
          </div>
          <h1>BidWise AI</h1>
          <p>
            Screen tenders and RFPs before your team spends days writing a proposal.
            Paste the request, tune your company profile, and get a bid/no-bid memo,
            risks, questions, and an AI-ready strategy prompt.
          </p>
        </div>
        <div className={`decision-card ${decisionTone[analysis.decision]}`}>
          <span>Recommendation</span>
          <strong>{analysis.decision}</strong>
          <small>{analysis.confidence}% confidence</small>
        </div>
      </section>

      <section className="metrics-strip" aria-label="Bid screen metrics">
        <Metric icon={<Gauge />} label="Fit score" value={`${analysis.score}/100`} />
        <Metric icon={<AlertTriangle />} label="Risk" value={analysis.riskLevel} />
        <Metric icon={<ClipboardCheck />} label="Effort" value={`${analysis.estimatedEffortHours}h`} />
        <Metric icon={<ShieldCheck />} label="Budget" value={analysis.extractedBudget ?? "unknown"} />
      </section>

      <section className="workbench">
        <div className="panel input-panel">
          <div className="panel-title">
            <FileText size={19} aria-hidden="true" />
            <h2>RFP text</h2>
          </div>
          <textarea
            value={rfpText}
            onChange={(event) => setRfpText(event.target.value)}
            aria-label="RFP text"
            spellCheck={true}
          />
        </div>

        <div className="panel profile-panel">
          <div className="panel-title">
            <BadgeCheck size={19} aria-hidden="true" />
            <h2>Company profile</h2>
          </div>
          <label>
            Company
            <input
              value={profile.name}
              onChange={(event) => setProfile({ ...profile, name: event.target.value })}
            />
          </label>
          <label>
            Strengths
            <textarea
              value={profile.strengths}
              onChange={(event) => setProfile({ ...profile, strengths: event.target.value })}
            />
          </label>
          <label>
            Constraints
            <textarea
              value={profile.constraints}
              onChange={(event) => setProfile({ ...profile, constraints: event.target.value })}
            />
          </label>
          <div className="number-grid">
            <label>
              Min margin
              <input
                type="number"
                min={0}
                max={90}
                value={profile.minimumMargin}
                onChange={(event) =>
                  setProfile({ ...profile, minimumMargin: Number(event.target.value) })
                }
              />
            </label>
            <label>
              Weekly hours
              <input
                type="number"
                min={1}
                max={120}
                value={profile.weeklyCapacityHours}
                onChange={(event) =>
                  setProfile({ ...profile, weeklyCapacityHours: Number(event.target.value) })
                }
              />
            </label>
          </div>
        </div>
      </section>

      <section className="analysis-grid">
        <article className="panel brief-panel">
          <div className="panel-title">
            <ListChecks size={19} aria-hidden="true" />
            <h2>Owner brief</h2>
          </div>
          <p className="brief">{analysis.executiveBrief}</p>
          <div className="facts">
            <span>Deadline: {analysis.extractedDeadline ?? "not detected"}</span>
            <span>Missing info: {analysis.missingInfo.length}</span>
          </div>
        </article>

        <article className="panel">
          <div className="panel-title">
            <AlertTriangle size={19} aria-hidden="true" />
            <h2>Signals</h2>
          </div>
          <div className="signal-list">
            {analysis.signals.map((signal) => (
              <SignalRow key={signal.label} signal={signal} />
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-title">
            <HelpCircle size={19} aria-hidden="true" />
            <h2>Qualification questions</h2>
          </div>
          <ol className="clean-list">
            {analysis.questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ol>
        </article>

        <article className="panel">
          <div className="panel-title">
            <ClipboardCheck size={19} aria-hidden="true" />
            <h2>Next actions</h2>
          </div>
          <ol className="clean-list">
            {analysis.actionPlan.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ol>
        </article>
      </section>

      <section className="panel prompt-panel">
        <div className="prompt-heading">
          <div className="panel-title">
            <Sparkles size={19} aria-hidden="true" />
            <h2>AI strategy prompt</h2>
          </div>
          <button onClick={copyPrompt} type="button">
            <Copy size={17} aria-hidden="true" />
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre>{analysis.aiPrompt}</pre>
      </section>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="metric">
      <span className="metric-icon">{icon}</span>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SignalRow({ signal }: { signal: Signal }) {
  return (
    <div className={`signal ${signal.kind}`}>
      <div>
        <strong>{signal.label}</strong>
        <p>{signal.detail}</p>
      </div>
      <span>{signal.impact > 0 ? `+${signal.impact}` : signal.impact}</span>
    </div>
  );
}

export default App;
