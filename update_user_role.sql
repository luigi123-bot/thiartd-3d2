-- Asigna el rol 'admin' a Luchito en Supabase Auth (tabla auth.users)
update auth.users
set raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'), '{role}', '"admin"')
where email = 'educadorsolarsemana@ciadet.co';
