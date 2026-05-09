---
applyTo: api/**/*.js
description: Use when editing API handlers and MongoDB access code for work history endpoints and request normalization.
---

# API And MongoDB Guardrails

## Scope
This file applies to API JavaScript files under api.

## Required Practices
- Keep GET and POST behavior backward compatible unless task explicitly requests API contract changes.
- Sanitize and bound all user input using existing helper patterns.
- Escape regex input before using it in MongoDB filter expressions.
- Keep pagination bounds defensive to avoid heavy queries.
- Preserve response envelope keys used by frontend history UI.

## Data Integrity Rules
- Keep createdAt and createdAtMs semantics intact for sort stability.
- Keep action normalization stable for filter compatibility.
- Do not remove existing fields from stored payload unless migration is planned.

## Operational Safety
- Prefer additive schema evolution in metadata.
- Avoid introducing server-only assumptions that break Vercel or local execution.
