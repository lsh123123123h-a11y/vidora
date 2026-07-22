# OpenAI Compatible Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a native OpenAI-compatible relay provider flow that retrieves and imports `/models` entries.

**Architecture:** A backend route normalizes and fetches the provider's OpenAI-compatible model list. The existing provider screen adds a relay creation dialog and saves imported models through current vendor APIs, keeping downstream model selection unchanged.

**Tech Stack:** Express, TypeScript, Zod, Vue 3, TDesign, Axios, Node test runner via tsx.

---

### Task 1: Normalize and parse compatible model-list responses

**Files:**
- Create: `src/routes/setting/vendorConfig/openaiCompatibleModels.ts`
- Test: `src/routes/setting/vendorConfig/openaiCompatibleModels.test.ts`

- [ ] **Step 1: Write failing tests for `/models` URL normalization and `data[].id` parsing.**
- [ ] **Step 2: Run `npx tsx --test src/routes/setting/vendorConfig/openaiCompatibleModels.test.ts` and verify failure.**
- [ ] **Step 3: Implement URL validation, `/models` URL creation, and de-duplicated parsing.**
- [ ] **Step 4: Run the test command and verify it passes.**

### Task 2: Add a protected backend model-list fetch endpoint

**Files:**
- Create: `src/routes/setting/vendorConfig/fetchModels.ts`
- Modify: `src/routes/setting/vendorConfig/openaiCompatibleModels.ts`
- Test: `src/routes/setting/vendorConfig/openaiCompatibleModels.test.ts`

- [ ] **Step 1: Write a failing test for forwarding a Bearer key and returning normalized model IDs.**
- [ ] **Step 2: Run the focused test and verify failure.**
- [ ] **Step 3: Implement the authenticated POST endpoint with a bounded timeout and provider error mapping.**
- [ ] **Step 4: Run the focused test and verify it passes.**

### Task 3: Add relay configuration and model import UI

**Files:**
- Modify: `../Toonflow-web/src/components/setting/components/vendorConfig.vue`
- Modify: `../Toonflow-web/src/lib/vendorTemplate.ts`
- Modify: `../Toonflow-web/src/locales/language/zh_CN.json` if present, otherwise use existing inline Chinese strings for the new local-only controls.

- [ ] **Step 1: Add an OpenAI-compatible relay option to the provider dialog with name, base URL, API key, fetch, selection, and per-model type controls.**
- [ ] **Step 2: Generate a vendor script using `createOpenAI` and persist the returned input values through the existing APIs.**
- [ ] **Step 3: Import selected models using the existing add-model API and refresh the provider list.**
- [ ] **Step 4: Run `npm run type-check` in `../Toonflow-web` and `npm run lint` in this repository.**

### Task 4: Validate the end-to-end change

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document the compatible relay configuration in the quick-start section.**
- [ ] **Step 2: Run backend unit tests, backend type checking, and frontend type checking.**
- [ ] **Step 3: Launch the desktop app and manually verify that the dialog saves a provider, retrieves models, and imports a text model.**
