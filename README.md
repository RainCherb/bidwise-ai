# BidWise AI

BidWise AI is a privacy-first bid/no-bid workspace for small businesses. Paste an RFP, tender, or procurement request and get a structured recommendation before your team spends days writing a proposal.

The app runs in the browser and does not send tender text to a backend. It combines deterministic screening with an AI-ready strategy prompt you can paste into your preferred LLM when company policy allows it.

## Why this exists

Small teams lose time on opportunities they should have qualified earlier: vague scope, tight deadlines, hidden data work, fixed budgets, and missing decision criteria. BidWise AI makes the first screen repeatable.

## What it does

- Scores an opportunity from 0 to 100.
- Recommends `Bid`, `Qualify`, or `No bid`.
- Detects positive signals, delivery risks, budget, deadline hints, and missing information.
- Estimates delivery effort from scope signals.
- Generates qualification questions for the buyer.
- Creates a short owner brief and next-action plan.
- Produces a detailed AI prompt for deeper bid strategy work.

## Good fit

- Agencies evaluating implementation projects.
- Automation and AI consultancies.
- B2B service businesses responding to RFPs.
- Founders who need a fast first-pass tender screen.

## Quick start

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Scripts

```bash
npm run dev       # start local development
npm test          # run unit tests
npm run build     # type-check and build production assets
npm run preview   # preview production build
```

## How the scoring works

The current engine is intentionally transparent:

- Positive signals add points for clear scope, evaluation criteria, visible budget, pilot-sized work, and AI or analytics fit.
- Risk signals subtract points for compressed timelines, unpaid discovery, messy data, security burden, and heavy reporting.
- Missing qualification information reduces confidence.
- Delivery effort is estimated from integrations, dashboards, training, security, and executive reporting language.

This makes the tool useful without an API key and easy to adapt for a specific business.

## Using it with an LLM

BidWise AI creates a prompt that includes:

- Your company strengths and constraints.
- The automated screen result.
- Missing information and qualification questions.
- The full RFP text.
- A structured request for a bid/no-bid memo, hidden risk review, proposal outline, and win themes.

Copy that prompt into the AI tool approved by your company. Tender data stays local until you choose otherwise.

## Roadmap

- CSV export for opportunity logs.
- Configurable scoring weights.
- Saved company profiles.
- PDF/text upload.
- Optional OpenAI-compatible API mode for teams that want in-app LLM analysis.

## License

MIT
