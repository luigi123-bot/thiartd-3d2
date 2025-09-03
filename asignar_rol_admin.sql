-- Asigna el rol 'admin' al usuario en Supabase Auth (tabla auth.users)
update auth.users
set raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'), '{role}', '"admin"')
where email = 'EMAIL_DEL_USUARIO_AQUI';
