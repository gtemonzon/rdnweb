
-- Create stat_posts table
CREATE TABLE public.stat_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  summary text,
  content text,
  category text NOT NULL DEFAULT 'Estadísticas',
  cover_image_url text,
  source_name text,
  source_url text,
  period_start date,
  period_end date,
  cutoff_date date,
  methodology_notes text,
  tags text[],
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  author_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create stat_assets table
CREATE TABLE public.stat_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_post_id uuid NOT NULL REFERENCES public.stat_posts(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stat_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stat_assets ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER update_stat_posts_updated_at
  BEFORE UPDATE ON public.stat_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for published_at (reuse existing function)
CREATE TRIGGER trg_set_stat_posts_published_at
  BEFORE INSERT OR UPDATE ON public.stat_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_published_at();

-- RLS: Public can view published stat_posts
CREATE POLICY "Public can view published stat_posts"
  ON public.stat_posts FOR SELECT TO anon, authenticated
  USING (published = true);

-- RLS: Editors and admins can view all stat_posts
CREATE POLICY "Editors and admins can view all stat_posts"
  ON public.stat_posts FOR SELECT TO authenticated
  USING (is_editor());

-- RLS: Admins can insert stat_posts
CREATE POLICY "Admins can insert stat_posts"
  ON public.stat_posts FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- RLS: Admins can update stat_posts
CREATE POLICY "Admins can update stat_posts"
  ON public.stat_posts FOR UPDATE TO authenticated
  USING (is_admin());

-- RLS: Admins can delete stat_posts
CREATE POLICY "Admins can delete stat_posts"
  ON public.stat_posts FOR DELETE TO authenticated
  USING (is_admin());

-- RLS: Editors can insert own stat_posts
CREATE POLICY "Editors can insert own stat_posts"
  ON public.stat_posts FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'editor'::app_role) AND author_id = auth.uid());

-- RLS: Editors can update own stat_posts
CREATE POLICY "Editors can update own stat_posts"
  ON public.stat_posts FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'editor'::app_role) AND author_id = auth.uid());

-- RLS: Editors can delete own stat_posts
CREATE POLICY "Editors can delete own stat_posts"
  ON public.stat_posts FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'editor'::app_role) AND author_id = auth.uid());

-- stat_assets: public read when parent is published
CREATE POLICY "Public can view assets of published stat_posts"
  ON public.stat_assets FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.stat_posts WHERE id = stat_post_id AND published = true));

-- stat_assets: editors/admins can view all
CREATE POLICY "Editors can view all stat_assets"
  ON public.stat_assets FOR SELECT TO authenticated
  USING (is_editor());

-- stat_assets: admins can manage
CREATE POLICY "Admins can manage stat_assets"
  ON public.stat_assets FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- stat_assets: editors can manage own
CREATE POLICY "Editors can manage own stat_assets"
  ON public.stat_assets FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'editor'::app_role) AND
    EXISTS (SELECT 1 FROM public.stat_posts WHERE id = stat_post_id AND author_id = auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'editor'::app_role) AND
    EXISTS (SELECT 1 FROM public.stat_posts WHERE id = stat_post_id AND author_id = auth.uid())
  );
