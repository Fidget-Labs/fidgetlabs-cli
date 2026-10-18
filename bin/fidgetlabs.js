#!/usr/bin/env node
import { readFileSync } from "node:fs";

import { createClient, FidgetLabsError, VERSION } from "../index.js";

const HELP = `fidgetlabs ${VERSION}: the Fidget Labs public API from the terminal. No API key.

Usage:
  fidgetlabs offers [--json]              Every offer with its published euro price
  fidgetlabs questions [field] [--json]   The EU AI Act risk check questionnaire
  fidgetlabs classify <file|-> [--json]   Classify answers (JSON file, or - for stdin)
  fidgetlabs help | --help                This text
  fidgetlabs --version

Options:
  --json          Print the raw API response
  --base-url URL  Use another deployment (default https://fidgetlabs.io)

Docs: https://fidgetlabs.io/developers
EU AI Act results are informational, not legal advice.`;

const args = process.argv.slice(2);
const json = args.includes("--json");
const baseIndex = args.indexOf("--base-url");
const baseUrl = baseIndex >= 0 ? args[baseIndex + 1] : undefined;
const positional = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--base-url");
const [command, arg] = positional;

const client = createClient({ baseUrl });
const print = (value) => process.stdout.write(`${typeof value === "string" ? value : JSON.stringify(value, null, 2)}\n`);

function readAnswers(source) {
  if (!source) throw new Error("classify needs a JSON file path, or - to read stdin.");
  return JSON.parse(readFileSync(source === "-" ? 0 : source, "utf8"));
}

async function main() {
  if (args.includes("--version") || args.includes("-v")) return print(VERSION);
  if (!command || command === "help" || args.includes("--help") || args.includes("-h")) return print(HELP);

  if (command === "offers") {
    const offers = await client.listAllOffers();
    if (json) return print(offers);
    for (const o of offers) {
      print(`${o.name}  ${o.price.display}${o.price.suffix ? ` ${o.price.suffix}` : ""}  (${o.duration})`);
      if (o.situation) print(`  ${o.situation}`);
      print(`  ${o.url}`);
    }
    return;
  }

  if (command === "questions") {
    const q = await client.getEuAiActQuestions({ field: arg });
    if (json) return print(q);
    for (const question of q.questions) {
      print(`${question.field} (${question.kind}): ${question.text}`);
      for (const option of question.options) print(`  - ${option.value}: ${option.label}`);
    }
    return;
  }

  if (command === "classify") {
    const result = await client.classifyEuAiActRisk(readAnswers(arg));
    if (json) return print(result);
    print(`Risk level: ${result.riskLevelName} (${result.riskLevel})`);
    print(`Role: ${result.role.lean}`);
    print(result.summary);
    print(`\n${result.disclaimer}`);
    return;
  }

  process.stderr.write(`Unknown command: ${command}\n\n${HELP}\n`);
  process.exitCode = 2;
}

main().catch((error) => {
  if (error instanceof FidgetLabsError) {
    process.stderr.write(`Error (${error.code}): ${error.message}\n`);
    if (error.hint) process.stderr.write(`${error.hint}\n`);
    if (error.fieldErrors) process.stderr.write(`${JSON.stringify(error.fieldErrors, null, 2)}\n`);
  } else {
    process.stderr.write(`Error: ${error.message}\n`);
  }
  process.exitCode = 1;
});
