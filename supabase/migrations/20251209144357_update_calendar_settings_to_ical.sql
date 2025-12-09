/*
  # Update Calendar Settings to use iCal URL

  1. Changes
    - Drop the old `calendar_id` and `api_key` columns
    - Add new `ical_url` column for storing the secret iCal calendar URL
  
  2. Important Notes
    - The iCal URL is a secret URL that doesn't require authentication
    - Most calendar services (Google Calendar, Outlook, etc.) provide this
    - This approach is simpler and doesn't require API keys
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_settings' AND column_name = 'calendar_id'
  ) THEN
    ALTER TABLE calendar_settings DROP COLUMN calendar_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_settings' AND column_name = 'api_key'
  ) THEN
    ALTER TABLE calendar_settings DROP COLUMN api_key;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_settings' AND column_name = 'ical_url'
  ) THEN
    ALTER TABLE calendar_settings ADD COLUMN ical_url text DEFAULT '';
  END IF;
END $$;
