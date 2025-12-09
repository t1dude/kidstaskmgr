/*
  # Add Calendar Settings

  1. New Tables
    - `calendar_settings`
      - `id` (uuid, primary key)
      - `calendar_id` (text) - Google Calendar ID for the shared calendar
      - `api_key` (text) - Google API key for accessing the calendar
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `calendar_settings` table
    - Add policy for anyone to read calendar settings (needed for displaying events)
    - Note: In production, you'd want to restrict write access to admins only
  
  3. Important Notes
    - Only one row should exist in this table (single configuration)
    - The calendar_id is the Google Calendar ID (found in calendar settings)
    - The api_key is a Google API key with Calendar API enabled
*/

CREATE TABLE IF NOT EXISTS calendar_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id text DEFAULT '',
  api_key text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE calendar_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read calendar settings (needed for fetching events)
CREATE POLICY "Anyone can read calendar settings"
  ON calendar_settings
  FOR SELECT
  TO public
  USING (true);

-- Allow anyone to insert/update calendar settings
-- In production, you'd want to restrict this to authenticated admins only
CREATE POLICY "Anyone can insert calendar settings"
  ON calendar_settings
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update calendar settings"
  ON calendar_settings
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Insert a default row if none exists
INSERT INTO calendar_settings (calendar_id, api_key)
SELECT '', ''
WHERE NOT EXISTS (SELECT 1 FROM calendar_settings);
