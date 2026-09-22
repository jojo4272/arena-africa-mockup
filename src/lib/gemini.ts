// Google Gemini integration (generativelanguage.googleapis.com).
//
// Every helper degrades gracefully: when GEMINI_API_KEY is absent the platform
// returns a deterministic heuristic result instead of failing, so the product
// stays fully functional without the key.

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

interface GenerateOptions {
  system?: string;
  temperature?: number;
  maxOutputTokens?: number;
  /** OpenAPI-style schema for guaranteed-shape JSON output. */
  schema?: Record<string, unknown>;
}

interface GeminiResult<T> {
  ok: boolean;
  data: T | null;
  raw?: string;
  source: "gemini" | "fallback";
  error?: string;
}

async function callGemini(prompt: string, opts: GenerateOptions = {}): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxOutputTokens ?? 1024,
      ...(opts.schema
        ? { response_mime_type: "application/json", response_schema: opts.schema }
        : {}),
    },
  };
  if (opts.system) {
    body.systemInstruction = { parts: [{ text: opts.system }] };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(`${API_BASE}/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === "string" ? text : null;
  } catch {
    return null;
  }
}

async function generateJson<T>(
  prompt: string,
  schema: Record<string, unknown>,
  fallback: T,
  opts: Omit<GenerateOptions, "schema"> = {}
): Promise<GeminiResult<T>> {
  const raw = await callGemini(prompt, { ...opts, schema });
  if (!raw) return { ok: true, data: fallback, source: "fallback" };
  try {
    return { ok: true, data: JSON.parse(raw) as T, raw, source: "gemini" };
  } catch {
    return { ok: true, data: fallback, raw, source: "fallback", error: "Unparseable model output" };
  }
}

const HOUSE_RULES = `You are the market-integrity assistant for Arena Africa, a prediction market
covering African and global events. Rules you must always follow:
- Questions must be objectively resolvable YES or NO from public evidence.
- Never invent statistics, prices or dates you cannot support.
- Reject anything targeting private individuals, or involving violence, or protected groups.
- Be concise, neutral and factual. Do not give financial advice.`;

/* ------------------------------------------------------------------ */
/* 1. Draft a market from a plain-language idea                        */
/* ------------------------------------------------------------------ */

export interface DraftedMarket {
  title: string;
  description: string;
  category: string;
  locale: string;
  suggestedOddsYes: number;
  suggestedOddsNo: number;
  resolutionCriteria: string;
  resolutionSource: string;
  rejected: boolean;
  rejectionReason: string;
}

const DRAFT_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    description: { type: "STRING" },
    category: { type: "STRING", enum: ["economy", "sports", "politics", "culture", "crypto", "tech", "climate"] },
    locale: { type: "STRING", enum: ["en", "sw", "fr", "pt", "global"] },
    suggestedOddsYes: { type: "NUMBER" },
    suggestedOddsNo: { type: "NUMBER" },
    resolutionCriteria: { type: "STRING" },
    resolutionSource: { type: "STRING" },
    rejected: { type: "BOOLEAN" },
    rejectionReason: { type: "STRING" },
  },
  required: ["title", "description", "category", "locale", "suggestedOddsYes", "suggestedOddsNo", "resolutionCriteria", "resolutionSource", "rejected", "rejectionReason"],
};

export async function draftMarket(idea: string, countryHint?: string) {
  const fallback: DraftedMarket = {
    title: idea.trim().endsWith("?") ? idea.trim() : `Will ${idea.trim()}?`,
    description: "Review and refine this draft before publishing. Add the source that will settle it.",
    category: "culture",
    locale: countryHint ? "en" : "global",
    suggestedOddsYes: 1.85,
    suggestedOddsNo: 1.85,
    resolutionCriteria: "Define the exact, observable condition that makes this resolve YES.",
    resolutionSource: "Name a public, verifiable source (e.g. central bank release, official results page).",
    rejected: false,
    rejectionReason: "",
  };

  return generateJson<DraftedMarket>(
    `Turn this idea into a well-formed binary prediction market${countryHint ? ` for an audience in ${countryHint}` : ""}.
Idea: "${idea}"

Produce a precise YES/NO question with an unambiguous resolution rule and a named public source.
Set suggestedOddsYes/No as decimal odds between 1.05 and 9.0 that reflect a sensible implied probability
(the two implied probabilities should total slightly above 1.0 to represent a margin).
If the idea breaks the house rules, set rejected=true and explain why in rejectionReason.`,
    DRAFT_SCHEMA,
    fallback,
    { system: HOUSE_RULES, temperature: 0.6 }
  );
}

/* ------------------------------------------------------------------ */
/* 2. Explain a market (neutral briefing for participants)             */
/* ------------------------------------------------------------------ */

export interface MarketInsight {
  summary: string;
  yesCase: string[];
  noCase: string[];
  keyUncertainty: string;
  impliedProbabilityYes: number;
}

const INSIGHT_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    yesCase: { type: "ARRAY", items: { type: "STRING" } },
    noCase: { type: "ARRAY", items: { type: "STRING" } },
    keyUncertainty: { type: "STRING" },
    impliedProbabilityYes: { type: "NUMBER" },
  },
  required: ["summary", "yesCase", "noCase", "keyUncertainty", "impliedProbabilityYes"],
};

export async function marketInsight(market: { title: string; description?: string | null; oddsYes: number; oddsNo: number; category: string }) {
  const implied = Number((1 / market.oddsYes / (1 / market.oddsYes + 1 / market.oddsNo)).toFixed(3));
  const fallback: MarketInsight = {
    summary: `Market pricing implies roughly a ${(implied * 100).toFixed(0)}% chance of YES. Enable the Gemini API key for a full briefing.`,
    yesCase: ["Current odds favour this outcome relative to NO."],
    noCase: ["Outcomes can shift as new information arrives before settlement."],
    keyUncertainty: "Timing and the exact resolution source are the usual decisive factors.",
    impliedProbabilityYes: implied,
  };

  return generateJson<MarketInsight>(
    `Give a neutral briefing on this prediction market.
Title: ${market.title}
Category: ${market.category}
Context: ${market.description || "n/a"}
Decimal odds — YES ${market.oddsYes}, NO ${market.oddsNo} (implied YES ≈ ${(implied * 100).toFixed(1)}%).

Give 2-3 concise bullets for the YES case, 2-3 for the NO case, the single biggest uncertainty,
and your own impliedProbabilityYes between 0 and 1. Do not give financial advice.`,
    INSIGHT_SCHEMA,
    fallback,
    { system: HOUSE_RULES, temperature: 0.4 }
  );
}

/* ------------------------------------------------------------------ */
/* 3. Moderate a user-submitted market                                 */
/* ------------------------------------------------------------------ */

export interface ModerationVerdict {
  decision: "APPROVE" | "REVIEW" | "REJECT";
  riskScore: number;
  issues: string[];
  rationale: string;
}

const MODERATION_SCHEMA = {
  type: "OBJECT",
  properties: {
    decision: { type: "STRING", enum: ["APPROVE", "REVIEW", "REJECT"] },
    riskScore: { type: "NUMBER" },
    issues: { type: "ARRAY", items: { type: "STRING" } },
    rationale: { type: "STRING" },
  },
  required: ["decision", "riskScore", "issues", "rationale"],
};

const BANNED = [/\bassassinat/i, /\bkill\b/i, /\bterror/i, /\bbomb\b/i, /\bdeath of\b/i];

export async function moderateMarket(title: string, description?: string) {
  const text = `${title} ${description || ""}`;
  const hardFail = BANNED.some((re) => re.test(text));
  const fallback: ModerationVerdict = hardFail
    ? { decision: "REJECT", riskScore: 0.95, issues: ["Prohibited subject matter detected."], rationale: "Matched a blocked-content pattern." }
    : { decision: "REVIEW", riskScore: 0.3, issues: [], rationale: "Heuristic pass. Configure the Gemini API key for full AI moderation." };

  if (hardFail) return { ok: true, data: fallback, source: "fallback" as const };

  return generateJson<ModerationVerdict>(
    `Moderate this proposed prediction market against the house rules.
Title: ${title}
Description: ${description || "n/a"}

Return APPROVE only if it is objectively resolvable and harmless, REVIEW if ambiguous,
REJECT if it breaks the rules. riskScore is 0 (safe) to 1 (severe).`,
    MODERATION_SCHEMA,
    fallback,
    { system: HOUSE_RULES, temperature: 0.1 }
  );
}

/* ------------------------------------------------------------------ */
/* 4. Resolution assistance for the RESOLVER role                      */
/* ------------------------------------------------------------------ */

export interface ResolutionAdvice {
  recommendation: "YES" | "NO" | "INSUFFICIENT_EVIDENCE";
  confidence: number;
  evidenceNeeded: string[];
  rationale: string;
}

const RESOLUTION_SCHEMA = {
  type: "OBJECT",
  properties: {
    recommendation: { type: "STRING", enum: ["YES", "NO", "INSUFFICIENT_EVIDENCE"] },
    confidence: { type: "NUMBER" },
    evidenceNeeded: { type: "ARRAY", items: { type: "STRING" } },
    rationale: { type: "STRING" },
  },
  required: ["recommendation", "confidence", "evidenceNeeded", "rationale"],
};

export async function resolutionAdvice(title: string, evidence: string) {
  const fallback: ResolutionAdvice = {
    recommendation: "INSUFFICIENT_EVIDENCE",
    confidence: 0,
    evidenceNeeded: ["A primary public source confirming the outcome.", "The date the outcome was confirmed."],
    rationale: "AI assistance is unavailable. A human resolver must settle this market.",
  };

  return generateJson<ResolutionAdvice>(
    `A resolver is settling this market. Recommend an outcome strictly from the evidence given.
Market: ${title}
Evidence supplied: ${evidence || "none"}

If the evidence is not conclusive, return INSUFFICIENT_EVIDENCE and list exactly what is missing.
Never guess. confidence is 0 to 1.`,
    RESOLUTION_SCHEMA,
    fallback,
    { system: HOUSE_RULES, temperature: 0.1 }
  );
}

/* ------------------------------------------------------------------ */
/* 5. Localise a market into the platform languages                    */
/* ------------------------------------------------------------------ */

export interface Translations {
  en: string;
  sw: string;
  fr: string;
  pt: string;
}

const TRANSLATION_SCHEMA = {
  type: "OBJECT",
  properties: { en: { type: "STRING" }, sw: { type: "STRING" }, fr: { type: "STRING" }, pt: { type: "STRING" } },
  required: ["en", "sw", "fr", "pt"],
};

export async function translateMarket(title: string) {
  const fallback: Translations = { en: title, sw: title, fr: title, pt: title };
  return generateJson<Translations>(
    `Translate this prediction-market question into English, Kiswahili, French and Portuguese.
Keep proper nouns, numbers and dates unchanged. Keep it a question.
Question: "${title}"`,
    TRANSLATION_SCHEMA,
    fallback,
    { system: HOUSE_RULES, temperature: 0.2 }
  );
}
