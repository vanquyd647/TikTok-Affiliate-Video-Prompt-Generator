# Copilot Instructions For AFF Video Prompt Generator

## Project Focus
- Main app logic lives in src/App.tsx and contains prompt orchestration, content type routing, and product category mapping.
- API history endpoint lives in api/work-history.js and must keep request and response shape stable.
- Frontend stack: React + TypeScript + Vite.

## General Working Rules
- Prefer minimal, targeted edits. Avoid broad refactors unless explicitly requested.
- Preserve existing naming conventions and data contracts used by UI state and history payloads.
- When changing any list-driven configuration, update all dependent maps and validators in the same change.
- Keep behavior stable for existing content types and product categories unless the task asks for behavior changes.

## Checklist: New Content Type
When adding a new content type, check all related structures in src/App.tsx so behavior stays consistent:
1. CONTENT_TYPES option list.
2. RESOLVED_CONTENT_TYPES list.
3. Type-specific rule maps such as FIT_MODEL_RULE_LOCK_BY_CONTENT_TYPE and AFFILIATE_VIDEO_OBJECTIVES.
4. SCENE_BEATS_MAP and style or DNA-related maps.
5. Parsing or normalization branches that map tokens to content type.
6. Any validation arrays that enumerate allowed resolved values.

## Checklist: New Product Category
When adding product category options:
1. Add entry in PRODUCT_CATEGORY_OPTIONS with stable value, label, and hints.
2. Ensure its group is valid in PRODUCT_CATEGORY_GROUP_OPTIONS.
3. Update category-aware phrase replacement or regex guards if needed.
4. Verify suggested content types are valid resolved content types.

## Validation Expectations
- For frontend logic changes, run npm run build and resolve compile errors.
- For API changes, preserve safe input normalization and response compatibility.
- In final report, list changed files and mention any remaining risk or assumptions.
