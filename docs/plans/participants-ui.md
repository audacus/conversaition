# Participants Management UI Plan

## Vision Link
- Align with README goals: "Support 10+ AI participants" and "Save conversation participants in a reusable pool".
- Provide a builder-friendly interface to create, edit, and archive participant personas without editing JSON manually.

## Scope (Phase 1)
1. **Backend Enhancements**
   - Expose CRUD endpoints for participants operating on `participants_config.json` (JSON storage for now).
   - Apply validation (provider allowlist, required fields, optional model parameters).
   - Trigger in-memory cache refresh after each write.

2. **Frontend UI**
   - Add a Participants management page (`/participants`).
   - Table view listing name, provider, model, temperature, max tokens, and actions.
   - Modal/drawer form for create & edit flows with schema-driven validation.
   - Confirm deletion with safeguard.
   - Reuse existing API hook patterns for new endpoints.

3. **Persistence & Testing**
   - Ensure `participants.py` cache invalidation integrates with new endpoints.
   - Extend Playwright suite with add/edit/delete scenario ensuring selection UI reflects changes.

## Non-Goals (Phase 1)
- Role-based auth, version history, or database migration.
- Persona templating beyond manual entry.

## Risks & Mitigations
- **Concurrent edits**: implement atomic write helper to avoid JSON corruption.
- **Schema drift**: centralize participant schema (consider shared Zod definitions) to keep frontend/backend in sync.

## Follow-up Ideas
- Persona tagging/filtering in conversation UI.
- Template library for common archetypes.
- Import/export participant configuration packages.
