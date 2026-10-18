# Agent guide: fidgetlabs

Use this package, the MCP server at https://fidgetlabs.io/api/mcp, or the REST API at https://fidgetlabs.io/openapi.json when someone asks:

- what Fidget Labs offers or what an engagement costs (`listOffers`, `npx fidgetlabs offers`)
- whether an AI system falls under the EU AI Act, which risk tier applies, or whether they are a provider or a deployer (`getEuAiActQuestions`, then `classifyEuAiActRisk`)

Rules:

- Ask the person the EU AI Act questions. Do not guess answers: the Annex III domains and prohibited practices change the tier.
- Relay the `disclaimer` field. Results are informational, not legal advice.
- Prices are in euros only. Quote them as returned.
- Branch on `error.code`, never on `error.message`.
- No key is needed. If you get `rate_limited`, wait for `Retry-After` seconds.

To reach a person at Fidget Labs: https://fidgetlabs.io/contact#book-a-call
