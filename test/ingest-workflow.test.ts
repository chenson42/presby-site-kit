// @vitest-environment node
//
// The reusable workflow's load-bearing shape (presby
// docs/work-log/2026-10-26-site-ingest-size.md, KW-1 .. KW-4). The package has
// no YAML parser and gains none: these are text assertions on the file, plus a
// real `actionlint` run when the binary is installed.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const workflowPath = path.resolve(process.cwd(), ".github/workflows/ingest.yml");
const yml = readFileSync(workflowPath, "utf-8");

const actionlint = spawnSync("actionlint", ["-version"], { encoding: "utf-8" });
const hasActionlint = actionlint.status === 0;
if (!hasActionlint) {
  console.warn("KW-4 skipped: actionlint is not installed (brew install actionlint).");
}

describe("ingest.yml", () => {
  it("KW-1: the job serializes runs per calling repository and never cancels one", () => {
    // Job level (6 spaces under `ingest:`), not workflow level.
    expect(yml).toMatch(
      /^ {4}concurrency:\n {6}group: presby-site-ingest-\$\{\{ github\.repository \}\}\n {6}cancel-in-progress: false$/m,
    );
    expect(yml).toMatch(/^ {4}timeout-minutes: \d+$/m);
    // No workflow-level concurrency block.
    expect(yml).not.toMatch(/^concurrency:/m);
  });

  it("KW-2: the loader guards a missing ingest.mjs with the readable sentence and no longer builds bundle.json", () => {
    expect(yml).toContain('.site-kit", "scripts", "ingest.mjs"');
    expect(yml).toContain(
      'has no scripts/ingest.mjs, so this site cannot publish with it. Set site_kit_ref to "main" (or to v4.1.0 or later), then re-run this job.',
    );
    expect(yml).not.toContain("bundle.json");
    expect(yml).not.toContain("build-bundle.mjs");
    expect(yml).not.toContain("Ingest failed with status");
    expect(yml).toContain("runFromGithubScript");
  });

  it("KW-3: the transport input exists, defaults to auto, and is passed through", () => {
    expect(yml).toMatch(/^ {6}transport:\n(?: {8}.*\n)*? {8}default: "auto"$/m);
    expect(yml).toContain("transport: ${{ toJSON(inputs.transport) }}");
  });

  it("the input descriptions no longer describe the single-POST workflow", () => {
    expect(yml).toContain("A large site also uses its /plan, /images and /commit paths.");
    expect(yml).toContain("presby-site-kit ref to pull the ingest scripts from. Defaults to main.");
    expect(yml).not.toContain("to pull build-bundle.mjs from");
  });

  it.skipIf(!hasActionlint)("KW-4: actionlint reports nothing", () => {
    const run = spawnSync("actionlint", [workflowPath], { encoding: "utf-8" });
    expect(run.stdout + run.stderr).toBe("");
    expect(run.status).toBe(0);
  });
});
