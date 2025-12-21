-- Insert the missing timeline record in site_content
INSERT INTO site_content (section_key, title, content)
VALUES ('timeline', 'Historia', '[]'::jsonb)
ON CONFLICT (section_key) DO NOTHING;