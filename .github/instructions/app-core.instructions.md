---
applyTo: src/App.tsx
description: Use when editing the main React prompt engine in src/App.tsx, including content types, product categories, generation rules, and parser routing.
---

# App Core Editing Guardrails

## Scope
This file governs edits in src/App.tsx.

## Required Practices
- Keep patches small and localized. This file is large and tightly coupled.
- Preserve union safety by keeping list values and dependent type usage synchronized.
- If you add or rename a content type, update all relevant arrays and maps in the same pass.
- If you add or rename a product category, ensure downstream grouping and wording logic still resolves correctly.

## Content Type Change Checklist
1. Add or edit entry in CONTENT_TYPES.
2. Keep RESOLVED_CONTENT_TYPES consistent.
3. Update all Record<ResolvedContentType, ...> maps impacted by the new key.
4. Update parsing and normalization branches that infer content type from text.
5. Confirm strict-mode and allow-list arrays include or exclude the new type intentionally.

## Product Category Change Checklist
1. Add or edit entry in PRODUCT_CATEGORY_OPTIONS.
2. Keep group mapping valid against PRODUCT_CATEGORY_GROUP_OPTIONS.
3. Verify suggestedTypes only contains valid resolved content types.
4. Update category-sensitive regex replacements when wording coverage is required.

## Regression Checks
- Build must pass with npm run build.
- Existing commands and existing content type behavior should remain unchanged unless requested.
