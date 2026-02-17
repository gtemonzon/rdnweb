
-- Drop existing policies
DROP POLICY IF EXISTS "Public can view site content" ON public.site_content;
DROP POLICY IF EXISTS "Users with content module permission can manage site content" ON public.site_content;

-- SELECT: anyone can read (public content)
CREATE POLICY "Public can view site content"
ON public.site_content FOR SELECT
USING (true);

-- INSERT/UPDATE/DELETE: admin only
CREATE POLICY "Admins can insert site content"
ON public.site_content FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update site content"
ON public.site_content FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete site content"
ON public.site_content FOR DELETE
USING (is_admin());

-- JSONB validation trigger for known section shapes
CREATE OR REPLACE FUNCTION public.validate_site_content()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- mission/vision: expect {"text": "...", "image_url": "..."}
  IF NEW.section_key IN ('mission', 'vision') THEN
    IF NEW.content IS NOT NULL
       AND jsonb_typeof(NEW.content) = 'object'
       AND NEW.content ? 'text' THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Content for % must be {"text": "...", "image_url?": "..."}', NEW.section_key;
  END IF;

  -- home_stats: expect array of {"number": ..., "label": "..."}
  IF NEW.section_key = 'home_stats' THEN
    IF NEW.content IS NOT NULL
       AND jsonb_typeof(NEW.content) = 'array' THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Content for home_stats must be an array of {"number": ..., "label": "..."}';
  END IF;

  -- All other section_keys: just require valid JSONB (already enforced by column type)
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_site_content
BEFORE INSERT OR UPDATE ON public.site_content
FOR EACH ROW
EXECUTE FUNCTION public.validate_site_content();

-- Document expected shapes as a comment
COMMENT ON TABLE public.site_content IS 'Stores administrable site content sections. Expected JSON shapes per section_key:
- mission: {"text": "string", "image_url": "string|null"}
- vision: {"text": "string", "image_url": "string|null"}  
- home_stats: [{"number": number, "label": "string"}, ...]
- timeline: [{"year": "string", "title": "string", "description": "string"}, ...]
- values: [{"title": "string", "description": "string", "icon": "string"}, ...]
- programs: [{"title": "string", "description": "string", "image_url": "string|null"}, ...]
Other keys: any valid JSONB';
