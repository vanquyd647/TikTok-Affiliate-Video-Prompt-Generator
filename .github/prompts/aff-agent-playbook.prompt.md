---
mode: agent
description: Run an end-to-end implementation workflow for this AFF project (feature, bugfix, Mongo optimization, or TypeScript dependency upgrade) with validation.
---

You are working in the AFF Video Prompt Generator repository.

Workflow:
1. Classify the request into one of: feature, bugfix, mongo-optimization, dependency-upgrade.
2. Explore only relevant files first, then propose a minimal change set.
3. Implement targeted edits without broad refactors.
4. Validate:
   - Run npm run build for frontend or shared TypeScript changes.
   - For API changes, verify handler behavior and payload compatibility.
5. Report:
   - What changed.
   - Why it changed.
   - Any residual risks or assumptions.

Project-specific rules:
- For content type changes in src/App.tsx, update all dependent maps and allow-lists.
- For product category changes, keep group mapping, suggested types, and wording logic aligned.
- For Mongo history API, preserve request normalization and response shape.
- For dependency upgrade requests in this TypeScript project, use the specialized TypeScript upgrade workflow tools.
