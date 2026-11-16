-- =====================================================================
-- El Banobrino · Esquema de base de datos para Supabase (contrato 3.0.0)
--
-- Cómo usarlo: en Supabase → SQL Editor → New query → pega TODO este
-- archivo → Run. Se puede volver a ejecutar sin perder datos, y actualiza
-- una base creada con una versión anterior de este archivo (ver «Migración»).
--
-- Qué garantiza (aunque alguien manipule el navegador):
--   · El público puede: registrarse en «Quiero colaborar», enviar
--     comentarios (quedan PENDIENTES de revisión) y leer los APROBADOS.
--   · El público NO puede: leer, cambiar ni borrar registros de
--     colaboradores; ver comentarios pendientes o rechazados; aprobar,
--     cambiar ni borrar comentarios.
--   · Solo las cuentas listadas en public.administradores pueden ver los
--     registros, ver todos los comentarios, aprobarlos, rechazarlos o borrarlos.
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
  -- Revisión previa: todo comentario nuevo queda «pendiente» hasta que la administración lo revisa.
  estado         text not null default 'pendiente',
  constraint comentarios_autor check (char_length(autor) between 1 and 120 and btrim(autor) <> ''),
  constraint comentarios_contenido check (
    char_length(contenido) between 1 and 2000
    and contenido ~ '^\S(.*\S)?$'),
  constraint comentarios_estado check (estado in ('pendiente', 'aprobado', 'rechazado'))
);

-- ---------- Migración: bases creadas antes de la revisión previa ----------
-- Antes existía la columna «oculto» (visible / oculto). Se convierte a «estado»:
-- visibles → aprobado; ocultos → rechazado. «oculto» se conserva calculada a partir
-- de «estado» (true si no está aprobado) para que la versión anterior del sitio siga
-- mostrando solo comentarios aprobados mientras se publica la nueva.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'comentarios' and column_name = 'oculto'
               and is_generated = 'NEVER') then
    alter table public.comentarios add column if not exists estado text;
    update public.comentarios set estado = case when oculto then 'rechazado' else 'aprobado' end where estado is null;
    alter table public.comentarios alter column estado set default 'pendiente', alter column estado set not null;
    if not exists (select 1 from pg_constraint where conname = 'comentarios_estado') then
      alter table public.comentarios add constraint comentarios_estado check (estado in ('pendiente', 'aprobado', 'rechazado'));
    end if;
    drop policy if exists comentarios_leer on public.comentarios;
    drop policy if exists comentarios_publicar on public.comentarios;
    alter table public.comentarios drop column oculto;
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'comentarios' and column_name = 'oculto') then
    alter table public.comentarios add column oculto boolean generated always as (estado <> 'aprobado') stored;
  end if;
end $$;

create index if not exists comentarios_por_publicacion on public.comentarios (publicacion_id, fecha_creacion);
create index if not exists comentarios_por_estado on public.comentarios (estado, fecha_creacion);

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

-- ---------- Envío de comentarios (único camino de escritura del público) --
-- Inserta el comentario como «pendiente» y devuelve lo que la página necesita.
-- El público no puede elegir el estado, la fecha ni el id.

create or replace function public.publicar_comentario(
  publicacion_id uuid,
  contenido      text,
  autor          text default null
)
returns json
language sql
volatile
security definer
set search_path = ''
as $$
  insert into public.comentarios (publicacion_id, contenido, autor)
  values (publicacion_id, contenido, coalesce(autor, 'Anónimo'))
  returning json_build_object(
    'id', id, 'publicacion_id', publicacion_id, 'autor', autor, 'contenido', contenido,
    'fecha_creacion', fecha_creacion, 'estado', estado);
$$;

-- ---------- Permisos ------------------------------------------------------
-- Supabase da permisos amplios por omisión; aquí se dejan solo los necesarios.

revoke all on public.colaboradores, public.comentarios, public.administradores from anon, authenticated;
revoke all on function public.registrar_colaborador(text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.es_admin() from public, anon, authenticated;
revoke all on function public.publicar_comentario(uuid, text, text) from public, anon, authenticated;

grant execute on function public.registrar_colaborador(text, text, text, text, text) to anon, authenticated;
grant execute on function public.es_admin() to anon, authenticated;
grant execute on function public.publicar_comentario(uuid, text, text) to anon, authenticated;

grant select on public.colaboradores to authenticated;                -- filtrado por RLS: solo admin
grant select on public.comentarios to anon, authenticated;             -- filtrado por RLS: el público solo ve los aprobados
grant delete on public.comentarios to authenticated;                   -- filtrado por RLS: solo admin
grant update (estado) on public.comentarios to authenticated;          -- filtrado por RLS: solo admin

-- ---------- Seguridad por filas (RLS) -------------------------------------

alter table public.colaboradores   enable row level security;
alter table public.comentarios     enable row level security;
alter table public.administradores enable row level security;  -- sin políticas: nadie la lee por la API

drop policy if exists colaboradores_leer_admin on public.colaboradores;
create policy colaboradores_leer_admin on public.colaboradores
  for select to authenticated using (public.es_admin());

drop policy if exists comentarios_leer on public.comentarios;
create policy comentarios_leer on public.comentarios
  for select to anon, authenticated using (estado = 'aprobado' or public.es_admin());

drop policy if exists comentarios_publicar on public.comentarios;  -- el público ya no inserta directo (ver publicar_comentario)

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
