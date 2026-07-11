# El Club Â· Prueba real con Supabase

Esta guia deja la plataforma lista para una prueba real con base de datos, Auth,
roles, aprobacion de psicólogas, agenda, checkout demo, Meet y admin.

## 1. Crear proyecto en Supabase

1. Crea un proyecto nuevo en Supabase.
2. En `Project Settings > API`, copia:
   - `Project URL`
   - `anon public key`
3. Crea un archivo `.env.local` en la raiz del proyecto:

```env
VITE_SUPABASE_URL=https://djlcmpgdhzzndzeoammi.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_qfjwr46eLmVZmL4kZzO8HA_j07ZrnBV
```

No uses la `service_role key` en el frontend.

## 2. Aplicar migraciones SQL

En Supabase, abre `SQL Editor` y ejecuta en este orden:

1. `supabase/migrations/001_core_schema.sql`
2. `supabase/migrations/002_functions_and_rls.sql`
3. `supabase/migrations/003_seed_resources.sql`
4. `supabase/migrations/004_users_profile_visibility.sql`
5. `supabase/migrations/005_patient_emotional_onboarding.sql`
6. `supabase/migrations/006_real_testing_auth_and_payments.sql`
7. `supabase/migrations/007_harden_auth_role_bootstrap.sql`
8. `supabase/migrations/008_private_psychologist_notes.sql`
9. `supabase/migrations/009_crisis_chat_and_psychologist_application.sql`
10. `supabase/migrations/010_update_session_pricing.sql`
11. `supabase/migrations/011_psychologist_review_workflow.sql`
12. `supabase/migrations/012_withdrawal_workflow.sql`
13. `supabase/migrations/013_storage_and_support_replies.sql`
14. `supabase/migrations/014_security_hardening.sql`

La migracion `006` agrega:

- trigger para crear perfil automaticamente al registrarse desde Auth
- funcion `confirm_demo_payment()` para el checkout demo real

La migracion `008` mueve las notas privadas de psicologa a una tabla protegida
por RLS para que pacientes no puedan leerlas por API.

La migracion `009` agrega el chat de intervencion en crisis y campos de
postulacion profesional para psicólogas.

La migracion `010` actualiza el checkout demo a la estructura definida para la
prueba real: la paciente paga 110.000 COP, la psicologa recibe 90.000 COP y la
plataforma conserva 20.000 COP.

La migracion `011` agrega el flujo formal de revision de psicólogas: aprobar,
rechazar o pausar con motivo, fecha de revision, admin responsable y
notificacion automatica para la psicologa.

La migracion `012` agrega validacion backend para retiros: calcula saldo
disponible desde pagos aprobados de sesiones completadas, bloquea retiros por
encima del saldo y permite al admin mover solicitudes entre revision, proceso,
aprobado o rechazado con notificacion automatica.

La migracion `013` crea el bucket privado `psychologist-documents` para soportes
profesionales, agrega politicas de Storage y permite al admin responder tickets
de soporte con notificacion automatica al usuario.

La migracion `014` endurece seguridad: evita cambios de rol desde cuentas no
admin, bloquea autoaprobacion de psicólogas y obliga a solicitar retiros por la
funcion backend validada, no por insercion directa.

## 3. Auth para pruebas

Para una primera prueba rapida:

1. Ve a `Authentication > Providers > Email`.
2. Puedes desactivar temporalmente `Confirm email` para probar mas rapido.
3. En `URL Configuration`, agrega:
   - `http://127.0.0.1:5180`
   - el dominio final cuando se publique

Si dejas confirmacion de email activa, el usuario debe confirmar su correo antes
de entrar al dashboard.

## 4. Crear admin real

El admin no tiene registro publico. Hazlo asi:

1. En Supabase, ve a `Authentication > Users`.
2. Crea un usuario admin con email y password.
3. Copia el `User UID`.
4. Ejecuta este SQL cambiando los datos:

```sql
insert into public.users (id, role, full_name)
values ('USER_UID_AQUI', 'admin', 'Admin El Club')
on conflict (id) do update
set role = 'admin',
    full_name = excluded.full_name,
    updated_at = now();
```

Luego entra desde:

```txt
/auth/admin/login
```

## 5. Probar rol psicologa

1. Entra a `/auth/psychologist`.
2. Registra una psicologa.
3. Completa su perfil en `/psychologist/settings`.
4. Entra como admin.
5. Ve a `Aprobaciones`.
6. Aprueba la psicologa.
7. Entra de nuevo como psicologa y publica disponibilidad en `Disponibilidad`.

## 6. Probar rol paciente

1. Entra a `/auth/patient`.
2. Registra un paciente.
3. Completa onboarding emocional.
4. Ve a `psicólogas`.
5. Abre el perfil de una psicologa aprobada.
6. Elige un horario.
7. Continua al checkout demo.
8. Confirma pago demo.
9. Revisa `Sesiones`.

## 7. Probar Meet y notas

1. Entra como psicologa.
2. Abre la agenda.
3. Selecciona la cita.
4. Pega un enlace real de Google Meet.
5. Guarda y habilita Meet.
6. Escribe notas privadas.
7. Entra como paciente y revisa la sala de sesión.

## 8. Probar admin operativo

Desde admin revisa:

- `Pagos`: debe verse el pago demo aprobado.
- `Retiros`: debe estimar wallets segun sesiones completadas.
- `Soporte`: debe listar tickets creados desde `/soporte`.
- `Actividad`: debe mostrar sesiones recientes.
- `Contenido`: permite administrar recursos.

## 9. Checklist de prueba real

- Paciente puede registrarse.
- Psicologa puede registrarse.
- Admin puede iniciar sesión.
- Admin puede aprobar psicologa.
- Psicologa aprobada aparece para pacientes.
- Psicologa puede crear disponibilidad.
- Paciente puede reservar.
- Checkout demo crea pago y confirma cita.
- Psicologa puede guardar Meet.
- Paciente puede abrir sala de sesión.
- Psicologa puede guardar notas.
- Soporte crea tickets reales.
- Admin ve pagos, soporte, actividad y contenido.
