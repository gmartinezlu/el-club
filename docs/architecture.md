# El Club Â· Arquitectura (MVP escalable)

Este documento define la base tÃ©cnica de **El Club**, un ecosistema de bienestar emocional centrado en:
- **Terapia directa**: sesiones con psicÃ³logas verificadas, pagos directo a Nequi.
- **Google Calendar**: integraciÃ³n para agendar disponibilidad y citas (no interno).
- **Contenido de bienestar**: artÃ­culos, meditaciones, resources para pacientes.
- **Comunidad**: un espacio moderado complementario a la terapia.

No incluye: membresÃ­as internas, marketplace de pagos centralizados ni Wompi.

## Principios

- **SeparaciÃ³n clara** entre UI, estado, servicios y lÃ³gica de negocio.
- **Rutas y permisos** se validan tambiÃ©n en backend (RLS + funciones).
- **Componentes pequeÃ±os** y reutilizables, sin pantallas monolÃ­ticas.
- **DiseÃ±o coherente**: tokens (color, tipografÃ­a, radios, sombras) como fuente Ãºnica.

## Stack

- Frontend: React + Vite + TailwindCSS + shadcn/ui + Framer Motion
- Estado: Zustand
- Backend: Supabase (PostgreSQL + Auth + Storage + RLS)
- IntegraciÃ³n externa: Google Calendar API (para agendar y reuniones)
- Pagos: Nequi (directo al psicÃ³logo, no plataforma centralizada)

## Estructura de carpetas (frontend)

```
src/
  app/                # Router y bootstrap
  components/         # UI reutilizable (presentational)
  layouts/            # Layouts (marketing, paciente, psicÃ³loga, admin)
  pages/              # Entradas de ruta (compone layouts + mÃ³dulos)
  hooks/              # Hooks reutilizables
  services/           # Clientes/servicios (Supabase, pagos, notificaciones)
  store/              # Zustand stores (auth, ui, patient, psychologist, admin)
  lib/                # utilidades nÃºcleo (env, cn, date, constants)
  utils/              # helpers puros, sin dependencias de framework
  animations/         # presets de Framer Motion
  styles/             # tokens, tipografÃ­as, overrides
  patient/            # mÃ³dulo paciente
  psychologist/       # mÃ³dulo psicÃ³loga
  admin/              # mÃ³dulo admin
  appointments/       # mÃ³dulo citas (flujo/estados, integraciÃ³n Google Calendar)
  resources/          # artÃ­culos, meditaciones, contenidos
  journals/           # journaling
  notifications/      # notificaciones in-app
  shared/             # types, componentes, constantes compartidas
```

## Roles y autorizaciÃ³n

Roles:
- `patient`
- `psychologist`
- `admin`

Estrategia recomendada:
- Auth via Supabase.
- `profiles` (o `users`) almacena `role`.
- **RLS** obliga permisos por rol y ownership.
- El frontend solo muestra/oculta, pero **no decide** lo crÃ­tico.

## Mapa de rutas (propuesto)


- Marketing:
  - `/` landing
  - `/experiencias` experiencias y eventos
  - `/terapia` informaciÃ³n de terapia
  - `/para-psicologos` informaciÃ³n para psicÃ³logas
  - `/blog` contenido
  - `/comunidad` informaciÃ³n de comunidad
  - `/auth` login/registro
- Paciente:
  - `/patient` dashboard
  - `/patient/psychologists` buscar psicÃ³logas
  - `/patient/sessions` historial de sesiones
  - `/patient/resources` contenido de bienestar
  - `/patient/journals` journaling
  - `/patient/meditations` meditaciones
  - `/patient/crisis-chat` chat de apoyo inmediato
  - `/patient/settings` configuraciÃ³n
- PFlujo de pago (Nequi directo)

1. Paciente selecciona psicÃ³loga y fecha disponible en Google Calendar.
2. Sistema crea cita con estado `pending_payment`.
3. Sistema genera enlace de pago Nequi directo a psicÃ³loga.
4. Paciente paga; webhook de Nequi actualiza estado cita a `paid`.
5. PsicÃ³loga recibe confirmaciÃ³n; ambos ven cita confirmada.
6. Sistema genera Google Meet para reuniÃ³n en hora confirmada
## Estados del flujo de terapia (appointments)

Estados (enum):
- `pending_payment`
- `paid`
- `confirmed`
- `meeting_enabled`
- `completed`
- `cancelled`
- `refund_pending`

Regla: las transiciones se validan en backend (trigger o funciÃ³n) para evitar saltos invÃ¡lidos.

## Supabase (producciÃ³n)

- Migraciones: `supabase/migrations/` (schema, RLS, seeds)
- GuÃ­a: `docs/supabase-setup.md`
- MÃ³dulo de citas: `src/appointments/` (servicios por rol + mappers + fallback de joins)
- Recursos: `src/resources/` (lectura publicada vÃ­a RLS)

### RLS (resumen)

| Tabla | Paciente | PsicÃ³loga | Admin |
|-------|----------|-----------|-------|
| appointments | Solo `patient_id = auth.uid()` o donde es psicÃ³loga | Solo `psychologist_id = auth.uid()` | Todo |
| patients | Propio + vinculados por cita | Pacientes con cita previa | Todo |
| users (perfiles) | Propio + psicÃ³loga de cita + aprobadas | Propio + pacientes de cita | Todo |
| resources | Publicados | Publicados | Todo |
| journals | Solo propios | â€” | Todo |
| payments | Solo propios (linked by appointment) | Si psicÃ³loga de appointment | Todo |

