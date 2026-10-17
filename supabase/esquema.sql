-- =====================================================================
-- El Banobrino · Esquema de base de datos para Supabase (V2, contrato 2.1.0)
--
-- Cómo usarlo: en Supabase → SQL Editor → New query → pega TODO este
-- archivo → Run. Se puede volver a ejecutar sin perder datos.
--
-- Qué garantiza (aunque alguien manipule el navegador):
--   · El público puede: registrarse en «Quiero colaborar», publicar
--     comentarios y leer los comentarios visibles.
--   · El público NO puede: leer, cambiar ni borrar registros de
--     colaboradores; ocultar, cambiar ni borrar comentarios.
--   · Solo las cuentas listadas en public.administradores pueden ver los
--     registros, ver todos los comentarios, ocultarlos o borrarlos.
--   · Las reglas de longitud y formato del contrato (spec/schemas) se
--     repiten aquí como restricciones CHECK.
-- =====================================================================

-- ---------- Tablas -------------------------------------------------------

create table if not exists public.colaboradores (
  id                   uuid primary key default gen_random_uuid(),
  nombre_completo      text not null,
  email                text not null,
  telefono             text,
  area_adscripcion     text,
  comentario_propuesta text,
  fecha_registro       timestamptz not null default now(),
  constraint colaboradores_nombre_completo check (
    char_length(nombre_completo) between 2 and 120
    and nombre_completo ~ '^\S([^\n\r  ]*\S)?$'),
  constraint colaboradores_email check (
    char_length(email) <= 254
    and email ~* '^[a-z0-9!#$%&''*+/=?^_`{|}~-]+(\.[a-z0-9!#$%&''*+/=?^_`{|}~-]+)*@([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z0-9]([a-z0-9-]*[a-z0-9])?$'),
  constraint colaboradores_telefono check (telefono ~ '^\d(-?\d){9}$'),
  constraint colaboradores_area_adscripcion check (char_length(area_adscripcion) between 1 and 120),
  constraint colaboradores_comentario_propuesta check (char_length(comentario_propuesta) between 1 and 2000)
);

create table if not exists public.comentarios (
  id             uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null,
  autor          text not null default 'Anónimo',
  contenido      text not null,
  fecha_creacion timestamptz not null default now(),
  oculto         boolean not null default false,
  constraint comentarios_autor check (char_length(autor) between 1 and 120 and btrim(autor) <> ''),
  constraint comentarios_contenido check (
    char_length(contenido) between 1 and 2000
    and contenido ~ '^\S(.*\S)?$')
);
create index if not exists comentarios_por_publicacion on public.comentarios (publicacion_id, fecha_creacion);

-- Cuentas de Supabase Auth con permiso de administración.
create table if not exists public.administradores (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nota    text
);

-- ---------- ¿La sesión actual es de administración? ----------------------

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.administradores a where a.user_id = auth.uid());
$$;

-- ---------- Registro de colaboradores (único camino de escritura) --------
-- El público no tiene permiso sobre la tabla; registra mediante esta función,
-- que solo inserta y devuelve el registro recién creado (id y fecha los pone
-- la base de datos).

create or replace function public.registrar_colaborador(
  nombre_completo      text,
  email                text,
  telefono             text default null,
  area_adscripcion     text default null,
  comentario_propuesta text default null
)
returns public.colaboradores
language sql
volatile
security definer
set search_path = ''
as $$
  insert into public.colaboradores (nombre_completo, email, telefono, area_adscripcion, comentario_propuesta)
  values (nombre_completo, email, telefono, area_adscripcion, comentario_propuesta)
  returning *;
$$;

-- ---------- Permisos ------------------------------------------------------
-- Supabase da permisos amplios por omisión; aquí se dejan solo los necesarios.

revoke all on public.colaboradores, public.comentarios, public.administradores from anon, authenticated;
revoke all on function public.registrar_colaborador(text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.es_admin() from public, anon, authenticated;

grant execute on function public.registrar_colaborador(text, text, text, text, text) to anon, authenticated;
grant execute on function public.es_admin() to anon, authenticated;

grant select on public.colaboradores to authenticated;                -- filtrado por RLS: solo admin
grant select on public.comentarios to anon, authenticated;             -- filtrado por RLS: el público solo ve los visibles
grant delete on public.comentarios to authenticated;                   -- filtrado por RLS: solo admin
grant insert (publicacion_id, autor, contenido) on public.comentarios to anon, authenticated;
grant update (oculto) on public.comentarios to authenticated;          -- filtrado por RLS: solo admin

-- ---------- Seguridad por filas (RLS) -------------------------------------

alter table public.colaboradores   enable row level security;
alter table public.comentarios     enable row level security;
alter table public.administradores enable row level security;  -- sin políticas: nadie la lee por la API

drop policy if exists colaboradores_leer_admin on public.colaboradores;
create policy colaboradores_leer_admin on public.colaboradores
  for select to authenticated using (public.es_admin());

drop policy if exists comentarios_leer on public.comentarios;
create policy comentarios_leer on public.comentarios
  for select to anon, authenticated using (not oculto or public.es_admin());

drop policy if exists comentarios_publicar on public.comentarios;
create policy comentarios_publicar on public.comentarios
  for insert to anon, authenticated with check (not oculto);

drop policy if exists comentarios_moderar on public.comentarios;
create policy comentarios_moderar on public.comentarios
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

drop policy if exists comentarios_borrar on public.comentarios;
create policy comentarios_borrar on public.comentarios
  for delete to authenticated using (public.es_admin());

-- ---------- Alta de quien administra --------------------------------------
-- Después de crear tu usuario en Authentication → Users, ejecuta (con tu correo):
--
--   insert into public.administradores (user_id, nota)
--   select id, 'Administración del sitio' from auth.users where email = 'tu-correo@ejemplo.com'
--   on conflict do nothing;
