CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL, category text NOT NULL, icon text NOT NULL DEFAULT '🎁',
  cost numeric NOT NULL DEFAULT 0, price numeric NOT NULL DEFAULT 0, stock integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.sales (
  id text PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  date timestamptz NOT NULL DEFAULT now(),
  items jsonb NOT NULL DEFAULT '[]',
  subtotal numeric NOT NULL DEFAULT 0, discount numeric NOT NULL DEFAULT 0, tax numeric NOT NULL DEFAULT 0,
  card_fee numeric NOT NULL DEFAULT 0, total numeric NOT NULL DEFAULT 0, method text NOT NULL DEFAULT 'Cash',
  cogs numeric NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own products" ON public.products FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sales" ON public.sales FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ON public.products(user_id);
CREATE INDEX ON public.sales(user_id, date);