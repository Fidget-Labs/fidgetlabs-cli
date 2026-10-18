export declare const DEFAULT_BASE_URL: string;
export declare const VERSION: string;

export declare class FidgetLabsError extends Error {
  readonly status: number;
  /** Stable machine code, e.g. "rate_limited", "invalid_answers", "not_found". */
  readonly code: string;
  readonly hint: string | null;
  readonly fieldErrors: Record<string, string> | null;
}

export interface Offer {
  slug: string;
  name: string;
  tag?: string;
  situation?: string;
  duration: string;
  price: {
    currency: "EUR";
    amount: number | null;
    display: string;
    suffix: string;
    unit: "DAY" | "MONTH" | null;
    note?: string | null;
  };
  description: string;
  includes: string[];
  outcome?: string;
  terms?: string;
  bestFor?: string;
  url: string;
}

export interface Pagination {
  limit: number;
  totalCount?: number;
  hasMore: boolean;
  nextCursor: string | null;
}

export interface OfferPage {
  data: Offer[];
  pagination: Pagination;
  pricing?: { currency: "EUR"; credit: string; rules: string[] };
}

export interface Question {
  field: string;
  kind: "single" | "multi";
  text: string;
  helper: string | null;
  options: { value: string; label: string; clearsOthers: boolean }[];
  otherField: { field: string; label: string; maxLength: number } | null;
}

export interface Questionnaire {
  questionCount: number;
  note?: string;
  questions: Question[];
  disclaimer: string;
}

export interface EuAiActAnswers {
  size: string;
  industry: string;
  industryOther?: string;
  role: string;
  transparencyInteraction: "yes" | "no" | "unsure";
  transparencyContent: "yes" | "no" | "unsure";
  roleSignal: string;
  aiFrequency: string;
  annexDomains: string[];
  biometricUse: "yes" | "no" | "unsure";
  prohibited: string[];
}

export type RiskLevel = string;

export interface Classification {
  riskLevel: RiskLevel;
  riskLevelName: string;
  summary: string;
  levels: {
    level: RiskLevel;
    name: string;
    hit: boolean;
    uncertain: boolean;
    deadline: string;
    deadlineIso: string | null;
    meaning: string;
    maximumPenalty: string;
  }[];
  role: { lean: "provider" | "deployer" | "unclear"; explanation: string };
  urgency: "elevated" | "steady";
  smeTier: boolean;
  fullReport?: string;
  disclaimer: string;
  [key: string]: unknown;
}

export interface ClientOptions {
  baseUrl?: string;
  fetch?: typeof fetch;
  /** Retries after a 429, honoring Retry-After. Default 1. */
  retries?: number;
}

export interface FidgetLabsClient {
  listOffers(options?: { limit?: number; cursor?: string }): Promise<OfferPage>;
  listAllOffers(): Promise<Offer[]>;
  getEuAiActQuestions(options?: { field?: string }): Promise<Questionnaire>;
  classifyEuAiActRisk(
    answers: EuAiActAnswers,
    options?: { idempotencyKey?: string },
  ): Promise<Classification>;
}

export declare function createClient(options?: ClientOptions): FidgetLabsClient;
