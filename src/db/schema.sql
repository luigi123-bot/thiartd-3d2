-- Elimina el campo clerk_id de la tabla usuarios si existe
ALTER TABLE usuario DROP COLUMN IF EXISTS clerk_id;

-- Elimina cualquier tabla relacionada con Clerk si existe
DROP TABLE IF EXISTS clerk_users CASCADE;
DROP TABLE IF EXISTS clerk_sessions CASCADE;

-- Si tienes triggers, funciones o vistas relacionadas con Clerk, elimínalas también
-- Ejemplo:
DROP FUNCTION IF EXISTS sync_clerk_users CASCADE;
DROP VIEW IF EXISTS clerk_user_view CASCADE;
