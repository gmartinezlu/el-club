# El Club · Configuración Supabase

## 1. Variables de entorno

Copia `.env.example` a `.env` y completa:

```
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

## 2. Migraciones SQL

En el **SQL Editor** de Supabase, ejecuta en orden:

1. `supabase/migrations/001_core_schema.sql`
2. `supabase/migrations/002_functions_and_rls.sql`
3. `supabase/migrations/004_users_profile_visibility.sql`
4. `supabase/migrations/003_seed_resources.sql` (opcional)

## 3. Crear usuarios de prueba

1. Regístrate en la app como **paciente** y **psicóloga** (cuentas distintas).
2. En Supabase → Table Editor → `psychologists`, marca `is_approved = true` para la psicóloga.
3. Inserta una cita de prueba (ajusta UUIDs):

```sql
insert into public.appointments (
  patient_id,
  psychologist_id,
  starts_at,
  ends_at,
  status,
  google_meet_url
)
values (
  'UUID_PACIENTE',
  'UUID_PSICOLOGA',
  now() + interval '30 minutes',
  now() + interval '80 minutes',
  'meeting_enabled',
  'https://meet.google.com/tu-link-real'
);
```

## 4. Reglas de acceso (resumen)

| Rol | Citas | Pacientes | Psicólogas | Recursos |
|-----|-------|-----------|------------|----------|
| Paciente | Solo las suyas | Solo su perfil | Solo aprobadas | Publicados |
| Psicóloga | Solo las suyas | Solo con cita previa | Su perfil | Publicados |
| Admin | Todo | Todo | Todo | Todo |

## 5. Estados de cita

Flujo válido (validado en DB):

`pending_payment` → `paid` → `confirmed` → `meeting_enabled` → `completed`

También: `cancelled`, `refund_pending` según reglas en `validate_appointment_status_transition`.
