
-- Drop existing blog_posts policies
DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins and editors can view all posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins and editors can create posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins and editors can update posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can delete posts" ON public.blog_posts;

-- SELECT: anon can see published only
CREATE POLICY "Public can view published posts"
ON public.blog_posts FOR SELECT
USING (published = true);

-- SELECT: editors/admins see all
CREATE POLICY "Editors and admins can view all posts"
ON public.blog_posts FOR SELECT
USING (is_editor());

-- INSERT: admins can insert any, editors must set author_id = self
CREATE POLICY "Admins can insert any post"
ON public.blog_posts FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Editors can insert own posts"
ON public.blog_posts FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'editor'::app_role)
  AND author_id = auth.uid()
);

-- UPDATE: admins can update any, editors only own
CREATE POLICY "Admins can update any post"
ON public.blog_posts FOR UPDATE
USING (is_admin());

CREATE POLICY "Editors can update own posts"
ON public.blog_posts FOR UPDATE
USING (
  has_role(auth.uid(), 'editor'::app_role)
  AND author_id = auth.uid()
);

-- DELETE: admins can delete any, editors only own
CREATE POLICY "Admins can delete any post"
ON public.blog_posts FOR DELETE
USING (is_admin());

CREATE POLICY "Editors can delete own posts"
ON public.blog_posts FOR DELETE
USING (
  has_role(auth.uid(), 'editor'::app_role)
  AND author_id = auth.uid()
);

-- Trigger: auto-set published_at when published changes to true
CREATE OR REPLACE FUNCTION public.set_published_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.published = true AND (OLD IS NULL OR OLD.published = false) THEN
    NEW.published_at = now();
  ELSIF NEW.published = false THEN
    NEW.published_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_published_at
BEFORE INSERT OR UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.set_published_at();
