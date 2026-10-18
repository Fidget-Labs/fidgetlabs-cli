/**
 * Fidget Labs SDK.
 *
 * A thin, dependency-free client for the public API documented at
 * https://fidgetlabs.io/openapi.json. No API key: every operation is
 * anonymous and read-only, and nothing you send is stored.
 */

export const DEFAULT_BASE_URL = "https://fidgetlabs.io";
export const VERSION = "1.0.0";

/** An error response from the API, with its stable machine code. */
export class FidgetLabsError extends Error {
  constructor(status, body) {
    const error = (body && body.error) || {};
    super(error.message || `Fidget Labs API returned HTTP ${status}`);
    this.name = "FidgetLabsError";
    this.status = status;
    /** Stable code to branch on, for example "rate_limited" or "invalid_answers". */
    this.code = error.code || "http_error";
    this.hint = error.hint || null;
    this.fieldErrors = error.fieldErrors || null;
  }
}

/**
 * Create a client.
 *
 * @param {object} [options]
 * @param {string} [options.baseUrl] Defaults to https://fidgetlabs.io.
 * @param {typeof fetch} [options.fetch] Defaults to the global fetch.
 * @param {number} [options.retries] Retries after a 429, honoring Retry-After. Default 1.
 */
export function createClient(options = {}) {
  const baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const doFetch = options.fetch || globalThis.fetch;
  const retries = options.retries ?? 1;
  if (typeof doFetch !== "function") {
    throw new Error("No fetch available. Use Node 18 or later, or pass options.fetch.");
  }

  async function request(path, init = {}, attempt = 0) {
    const res = await doFetch(baseUrl + path, {
      ...init,
      headers: {
        accept: "application/json",
        "user-agent": `fidgetlabs-sdk/${VERSION}`,
        ...init.headers,
      },
    });

    if (res.status === 429 && attempt < retries) {
      const wait = Math.min(Number(res.headers.get("retry-after")) || 1, 60);
      await new Promise((resolve) => setTimeout(resolve, wait * 1000));
      return request(path, init, attempt + 1);
    }

    const text = await res.text();
    let body;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }
    if (!res.ok) throw new FidgetLabsError(res.status, body);
    return body;
  }

  return {
    /** One page of offers. Pass the returned pagination.nextCursor as cursor for the next. */
    listOffers({ limit, cursor } = {}) {
      const params = new URLSearchParams();
      if (limit !== undefined) params.set("limit", String(limit));
      if (cursor) params.set("cursor", cursor);
      const query = params.toString();
      return request(`/api/v1/offers${query ? `?${query}` : ""}`);
    },

    /** Every offer, following the cursor until the last page. */
    async listAllOffers() {
      const all = [];
      let cursor;
      do {
        const page = await this.listOffers({ limit: 50, cursor });
        all.push(...page.data);
        cursor = page.pagination.nextCursor || undefined;
      } while (cursor);
      return all;
    },

    /** The EU AI Act questionnaire, or one question when field is given. */
    getEuAiActQuestions({ field } = {}) {
      return request(
        `/api/v1/eu-ai-act/questions${field ? `?field=${encodeURIComponent(field)}` : ""}`,
      );
    },

    /**
     * Classify an AI use against the EU AI Act risk tiers. Informational, not
     * legal advice: relay the disclaimer field with any answer built from it.
     */
    classifyEuAiActRisk(answers, { idempotencyKey } = {}) {
      return request("/api/v1/eu-ai-act/classify", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}),
        },
        body: JSON.stringify(answers),
      });
    },
  };
}
