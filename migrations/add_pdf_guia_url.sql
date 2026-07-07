-- Add pdf_guia_url column to public.pedidos table
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS pdf_guia_url TEXT;
