-- ============================================================
-- Peak Compliance Tracker — Supabase Schema
-- Run this in the Supabase SQL editor (Database > SQL Editor)
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'viewer');

-- ============================================================
-- PEOPLE
-- ============================================================
CREATE TABLE people (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name    TEXT NOT NULL,
  email        TEXT UNIQUE,
  phone        TEXT,
  person_type  TEXT NOT NULL CHECK (person_type IN ('client', 'employee', 'contractor')),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DOCUMENT TYPES
-- ============================================================
CREATE TABLE document_types (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL UNIQUE,
  description  TEXT,
  warning_days INTEGER NOT NULL DEFAULT 30,
  is_required  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PERSON DOCUMENTS (the junction/tracking table)
-- ============================================================
CREATE TABLE person_documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id        UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  document_type_id UUID NOT NULL REFERENCES document_types(id) ON DELETE RESTRICT,
  issue_date       DATE,
  expiry_date      DATE,
  notes            TEXT,
  uploaded_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_by_name TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (person_id, document_type_id)
);

-- ============================================================
-- APP USER PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE app_users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  role        user_role NOT NULL DEFAULT 'viewer',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER people_updated_at
  BEFORE UPDATE ON people
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER person_documents_updated_at
  BEFORE UPDATE ON person_documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- The Express server uses service_role key (bypasses RLS).
-- These policies apply to any direct Supabase client-side calls.
-- ============================================================
ALTER TABLE people           ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_types   ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users        ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read everything
CREATE POLICY "auth read people"           ON people           FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read document_types"   ON document_types   FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read person_documents" ON person_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read app_users"        ON app_users        FOR SELECT TO authenticated USING (true);

-- Only admins can mutate (this is a belt-and-suspenders check; main enforcement is in Express middleware)
CREATE POLICY "admin mutate people" ON people FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin mutate document_types" ON document_types FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin mutate person_documents" ON person_documents FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin mutate app_users" ON app_users FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- SEED: Default document types
-- ============================================================
INSERT INTO document_types (name, description, warning_days, is_required) VALUES
  ('Driver License',          'State-issued driver license',              30, TRUE),
  ('Background Check',        'Criminal background screening',            90, TRUE),
  ('OSHA Safety Training',    'OSHA 10 or OSHA 30 certification',         30, TRUE),
  ('Health Certificate',      'Annual medical clearance from physician',  60, TRUE),
  ('Insurance Certificate',   'Proof of liability insurance',             45, TRUE),
  ('I-9 Employment Eligibility', 'Form I-9 verification',                 0, TRUE),
  ('W-9 / W-4',               'Tax withholding form on file',              0, FALSE);

-- ============================================================
-- FIRST ADMIN USER SETUP (run after creating user in Auth UI)
-- Replace the UUID below with the user's actual auth.users id
-- ============================================================
-- INSERT INTO app_users (id, full_name, role, is_active)
-- VALUES ('00000000-0000-0000-0000-000000000000', 'Admin Name', 'admin', true);
