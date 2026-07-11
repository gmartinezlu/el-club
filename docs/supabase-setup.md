# El Club Â· ConfiguraciÃ³n Supabase

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

1. RegÃ­strate en la app como **paciente** y **psicÃ³loga** (cuentas distintas).
2. En Supabase â†’ Table Editor â†’ `psychologists`, marca `is_approved = true` para la psicÃ³loga.
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

| Rol | Citas | Pacientes | PsicÃ³logas | Recursos |
|-----|-------|-----------|------------|----------|
| Paciente | Solo las suyas | Solo su perfil | Solo aprobadas | Publicados |
| PsicÃ³loga | Solo las suyas | Solo con cita previa | Su perfil | Publicados |
| Admin | Todo | Todo | Todo | Todo |

## 5. Estados de cita

Flujo vÃ¡lido (validado en DB):

`pending_payment` â†’ `paid` â†’ `confirmed` â†’ `meeting_enabled` â†’ `completed`

TambiÃ©n: `cancelled`, `refund_pending` segÃºn reglas en `validate_appointment_status_transition`.
