-- Add 'vacancies' to the app_module enum (separate transaction)
ALTER TYPE app_module ADD VALUE IF NOT EXISTS 'vacancies';