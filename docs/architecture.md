# El Club · Arquitectura (MVP escalable)

Este documento define la base técnica para construir **El Club** como un ecosistema premium de bienestar emocional (no solo agenda).

## Principios

- **Separación clara** entre UI, estado, servicios y lógica de negocio.
- **Rutas y permisos** se validan también en backend (RLS + funciones).
- **Componentes pequeños** y reutilizables, sin pantallas monolíticas.
- **Diseño coherente**: tokens (color, tipografía, radios, sombras) como fuente única.

## Stack

- Frontend: React + Vite + TailwindCSS + shadcn/ui + Framer Motion
- Estado: Zustand
- Backend: Supabase (PostgreSQL + Auth + Storage + RLS + Edge Functions si aplica)

## Estructura de carpetas (frontend)

```
src/
  app/                # Router y bootstrap
  components/         # UI reutilizable (presentational)
  layouts/            # Layouts (marketing, paciente, psicóloga, admin)
  pages/              # Entradas de ruta (compone layouts + módulos)
  hooks/              # Hooks reutilizables
  services/           # Clientes/servicios (Supabase, pagos, notificaciones)
  store/              # Zustand stores (auth, ui, patient, psychologist, admin)
  lib/                # utilidades núcleo (env, cn, date, constants)
  utils/              # helpers puros, sin dependencias de framework
  animations/         # presets de Framer Motion
  styles/             # tokens, tipografías, overrides
  patient/            # módulo paciente
  psychologist/       # módulo psicóloga
  admin/              # módulo admin
  appointments/       # módulo citas (flujo/estados)
  payments/           # módulo pagos + marketplace
  resources/          # artículos, meditaciones, contenidos
  journals/           # journaling
  notifications/      # notificaciones in-app/email/whatsapp (si aplica)
  shared/             # types, componentes, constantes compartidas
```

## Roles y autorización

Roles:
- `patient`
- `psychologist`
- `admin`

Estrategia recomendada:
- Auth via Supabase.
- `profiles` (o `users`) almacena `role`.
- **RLS** obliga permisos por rol y ownership.
- El frontend solo muestra/oculta, pero **no decide** lo crítico.

## Mapa de rutas (propuesto)

- Marketing:
  - `/` landing
  - `/auth` login/registro
- Paciente:
  - `/patient` dashboard
  - `/patient/appointments`
  - `/patient/resources`
  - `/patient/journals`
- Psicóloga:
  - `/psychologist` dashboard
  - `/psychologist/agenda`
  - `/psychologist/patients`
  - `/psychologist/payouts`
- Admin:
  - `/admin` overview
  - `/admin/psychologists` aprobaciones
  - `/admin/payments` y retiros

## Estados del flujo de terapia (appointments)

Estados (enum):
- `pending_payment`
- `paid`
- `confirmed`
- `meeting_enabled`
- `completed`
- `cancelled`
- `refund_pending`

Regla: las transiciones se validan en backend (trigger o función) para evitar saltos inválidos.

## Supabase (producción)

- Migraciones: `supabase/migrations/` (schema, RLS, seeds)
- Guía: `docs/supabase-setup.md`
- Módulo de citas: `src/appointments/` (servicios por rol + mappers + fallback de joins)
- Recursos: `src/resources/` (lectura publicada vía RLS)

### RLS (resumen)

| Tabla | Paciente | Psicóloga | Admin |
|-------|----------|-----------|-------|
| appointments | Solo `patient_id = auth.uid()` | Solo `psychologist_id = auth.uid()` | Todo |
| patients | Propio + vinculados por cita | Pacientes con cita previa | Todo |
| users (perfiles) | Propio + psicóloga de cita + aprobadas | Propio + pacientes de cita | Todo |
| resources | Publicados | Publicados | Todo |
| journals | Solo propios | — | Todo |

