
-- Trigger de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_code text,
  barcode text NOT NULL UNIQUE,
  description text,
  package_type text,
  gramatura numeric NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_products_internal_code ON public.products(internal_code);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- COLLECTIONS
CREATE TABLE public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_code text NOT NULL,
  store_name text NOT NULL,
  number integer NOT NULL,
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  UNIQUE (store_code, number)
);
CREATE INDEX idx_collections_store ON public.collections(store_code);
CREATE INDEX idx_collections_created ON public.collections(created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO anon, authenticated;
GRANT ALL ON public.collections TO service_role;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all collections" ON public.collections FOR ALL USING (true) WITH CHECK (true);

-- COLLECTION ITEMS
CREATE TABLE public.collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  barcode text NOT NULL,
  quantity numeric NOT NULL,
  description text,
  gramatura numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_collection_items_collection ON public.collection_items(collection_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_items TO anon, authenticated;
GRANT ALL ON public.collection_items TO service_role;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all collection_items" ON public.collection_items FOR ALL USING (true) WITH CHECK (true);

-- next_collection_number RPC
CREATE OR REPLACE FUNCTION public.next_collection_number(p_store_code text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  SELECT COALESCE(MAX(number), 0) + 1 INTO n
  FROM public.collections
  WHERE store_code = p_store_code;
  RETURN n;
END;
$$;
GRANT EXECUTE ON FUNCTION public.next_collection_number(text) TO anon, authenticated;

-- PRODUCT INVENTORY
CREATE TABLE public.product_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_code text,
  description text,
  barcode text NOT NULL,
  stock_coverage_days numeric,
  days_without_sale numeric,
  section text,
  store text,
  status text NOT NULL DEFAULT 'nao_verificado',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (barcode, store)
);
CREATE INDEX idx_pi_section ON public.product_inventory(section);
CREATE INDEX idx_pi_store ON public.product_inventory(store);
CREATE INDEX idx_pi_status ON public.product_inventory(status);
CREATE INDEX idx_pi_barcode ON public.product_inventory(barcode);
CREATE INDEX idx_pi_description ON public.product_inventory(description);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_inventory TO anon, authenticated;
GRANT ALL ON public.product_inventory TO service_role;
ALTER TABLE public.product_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public all product_inventory" ON public.product_inventory FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_pi_updated_at BEFORE UPDATE ON public.product_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Distinct helpers for filters
CREATE OR REPLACE FUNCTION public.inventory_distinct_sections()
RETURNS TABLE(section text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT section FROM public.product_inventory
  WHERE section IS NOT NULL AND section <> '' ORDER BY section
$$;
CREATE OR REPLACE FUNCTION public.inventory_distinct_stores()
RETURNS TABLE(store text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT store FROM public.product_inventory
  WHERE store IS NOT NULL AND store <> '' ORDER BY store
$$;
GRANT EXECUTE ON FUNCTION public.inventory_distinct_sections() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.inventory_distinct_stores() TO anon, authenticated;
