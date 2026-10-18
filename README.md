# fidgetlabs

The official CLI and SDK for the [Fidget Labs](https://fidgetlabs.io) public API.

- **Offers:** every Fidget Labs engagement with its published euro price, duration and terms.
- **EU AI Act risk check:** classify how an organization builds or uses AI against the risk tiers of Regulation (EU) 2024/1689.

No API key, no account. Every call is anonymous and read-only, and nothing you send is stored. Results from the EU AI Act check are informational, not legal advice.

## CLI

```sh
npx fidgetlabs offers
npx fidgetlabs questions
npx fidgetlabs questions size
npx fidgetlabs classify answers.json
cat answers.json | npx fidgetlabs classify -
```

Add `--json` to any command for the raw API response.

## SDK

```js
import { createClient } from "fidgetlabs";

const fl = createClient();

const offers = await fl.listAllOffers();
const { questions } = await fl.getEuAiActQuestions();

const result = await fl.classifyEuAiActRisk(
  {
    size: "100_1000",
    industry: "hr_staffing",
    role: "director",
    transparencyInteraction: "yes",
    transparencyContent: "no",
    roleSignal: "builder",
    aiFrequency: "daily",
    annexDomains: ["employment"],
    biometricUse: "no",
    prohibited: [],
  },
  { idempotencyKey: crypto.randomUUID() },
);
console.log(result.riskLevel, result.disclaimer);
```

Errors throw `FidgetLabsError` with a stable `code` (`invalid_answers`, `rate_limited`, `not_found` and so on), a `hint`, and `fieldErrors` on validation failures. A 429 is retried once after `Retry-After`.

Types ship with the package. Node 18 or later.

## Other ways in

- OpenAPI 3.1: https://fidgetlabs.io/openapi.json
- MCP server (streamable HTTP, no auth): https://fidgetlabs.io/api/mcp
- Developer docs: https://fidgetlabs.io/developers

## License

MIT, Fidget Labs B.V.
