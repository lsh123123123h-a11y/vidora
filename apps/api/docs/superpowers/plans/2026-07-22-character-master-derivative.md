# Character Master and Derivative Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure root roles are identity masters and only completed role derivatives can be used in production references.

**Architecture:** Extract pure role-validation and prompt-composition helpers. Use them from the role derivative image route and storyboard image route, while the asset prompt-generation route adds the neutral master-role constraints.

**Tech Stack:** TypeScript, Express, Knex, node:test, tsx.

---

### Task 1: Character generation policy helpers

**Files:**
- Create: `src/lib/characterGenerationPolicy.ts`
- Test: `tests/characterGenerationPolicy.test.ts`

- [ ] Write tests proving root-role prompts receive neutral master constraints, derivatives require a completed parent image, and root roles are rejected as storyboard references.
- [ ] Run `npx tsx --test tests/characterGenerationPolicy.test.ts` and verify the test fails because the module is absent.
- [ ] Implement the minimal pure helpers for neutral master prompt composition, parent-image validation, and production-reference validation.
- [ ] Run `npx tsx --test tests/characterGenerationPolicy.test.ts` and verify all tests pass.

### Task 2: Enforce master-to-derivative generation

**Files:**
- Modify: `src/routes/assetsGenerate/batchPolishAssetsPrompt.ts`
- Modify: `src/routes/assetsGenerate/batchGenerateImageAssets.ts`
- Modify: `src/routes/production/assets/batchGenerateAssetsImage.ts`
- Test: `tests/characterGenerationPolicy.test.ts`

- [ ] Apply the master prompt constraints during root-role prompt polishing.
- [ ] Fetch parent prompt and image for role derivatives in both asset-library and production-Agent generation routes; reject an absent or unfinished parent instead of calling AI; include the complete parent prompt in the derivative prompt request.
- [ ] Run the policy tests and `npx tsc --noEmit`.

### Task 3: Block root roles from storyboard generation

**Files:**
- Modify: `src/routes/production/storyboard/batchGenerateImage.ts`
- Test: `tests/characterGenerationPolicy.test.ts`

- [ ] Validate storyboard-bound assets before submitting image generation and return an actionable error listing root role names.
- [ ] Run the policy tests and `npx tsc --noEmit`.
