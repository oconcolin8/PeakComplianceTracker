-- ============================================================
-- Migration 001 — Per-type document templates & per-person checklists
-- Run this ONCE in the Supabase SQL editor on an existing database.
-- (Fresh installs: schema.sql already includes these changes.)
-- ============================================================

-- 1. Document types: drop per-type warning period, add tracking type.
--    "Expiring soon" is now one app-wide threshold (server env EXPIRING_SOON_DAYS).
ALTER TABLE document_types DROP COLUMN IF EXISTS warning_days;
ALTER TABLE document_types DROP COLUMN IF EXISTS applicable_to;
ALTER TABLE document_types ADD COLUMN IF NOT EXISTS tracking_type TEXT NOT NULL DEFAULT 'expiration';
ALTER TABLE document_types DROP CONSTRAINT IF EXISTS document_types_tracking_type_check;
ALTER TABLE document_types ADD CONSTRAINT document_types_tracking_type_check
  CHECK (tracking_type IN ('expiration', 'present_absent'));

-- 2. Templates: which document types are defaults for each person type.
CREATE TABLE IF NOT EXISTS document_type_defaults (
  person_type      TEXT NOT NULL CHECK (person_type IN ('client', 'employee', 'contractor')),
  document_type_id UUID NOT NULL REFERENCES document_types(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (person_type, document_type_id)
);

-- 3. Per-person checklist: copied from the template when a person is created,
--    then editable per person.
CREATE TABLE IF NOT EXISTS person_checklist (
  person_id        UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  document_type_id UUID NOT NULL REFERENCES document_types(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (person_id, document_type_id)
);

-- 4. Backfill: existing people get a checklist entry for every document they
--    already have a record for. Add anything else per person in the app.
INSERT INTO person_checklist (person_id, document_type_id)
SELECT DISTINCT person_id, document_type_id FROM person_documents
ON CONFLICT DO NOTHING;

-- 5. RLS (server uses service_role; these mirror the other tables)
ALTER TABLE document_type_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_checklist       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth read document_type_defaults" ON document_type_defaults;
DROP POLICY IF EXISTS "auth read person_checklist"       ON person_checklist;
DROP POLICY IF EXISTS "admin mutate document_type_defaults" ON document_type_defaults;
DROP POLICY IF EXISTS "admin mutate person_checklist"       ON person_checklist;

CREATE POLICY "auth read document_type_defaults" ON document_type_defaults FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read person_checklist"       ON person_checklist       FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin mutate document_type_defaults" ON document_type_defaults FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin mutate person_checklist" ON person_checklist FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'admin'));
