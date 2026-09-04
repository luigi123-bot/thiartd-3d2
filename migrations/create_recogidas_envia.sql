-- ==============================================================================
-- MIGRACIÓN: Creación de tabla para gestión de Recogidas con Transportadoras (Envía)
-- Ejecutar este script en el Editor SQL de tu panel de Supabase
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.recogidas_envia (
    id SERIAL PRIMARY KEY,
    carrier VARCHAR(50) NOT NULL,
    confirmation_number VARCHAR(100) NOT NULL,
    pickup_date VARCHAR(20) NOT NULL,
    pickup_time_from VARCHAR(10) NOT NULL,
    pickup_time_to VARCHAR(10) NOT NULL,
    origin_address TEXT NOT NULL,
    origin_city VARCHAR(100) NOT NULL,
    total_packages INTEGER DEFAULT 1,
    total_weight NUMERIC(8, 2) DEFAULT 1.0,
    pedidos_ids TEXT DEFAULT '[]',
    instructions TEXT,
    status VARCHAR(30) DEFAULT 'programada',
    raw_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.recogidas_envia ENABLE ROW LEVEL SECURITY;

-- Permitir lectura y escritura a usuarios autenticados / service role
CREATE POLICY "Permitir lectura completa de recogidas"
    ON public.recogidas_envia
    FOR SELECT
    TO authenticated, anon, service_role
    USING (true);

CREATE POLICY "Permitir insercion de recogidas"
    ON public.recogidas_envia
    FOR INSERT
    TO authenticated, anon, service_role
    WITH CHECK (true);

CREATE POLICY "Permitir actualizacion de recogidas"
    ON public.recogidas_envia
    FOR UPDATE
    TO authenticated, anon, service_role
    USING (true);
