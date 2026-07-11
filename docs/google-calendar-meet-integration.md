# Google Calendar + Meet

Integracion objetivo para El Club:

- La psicologa conecta su Google Calendar con OAuth.
- El Club lee disponibilidad real con permisos limitados.
- Al confirmar una cita, El Club crea evento en Google Calendar.
- El evento incluye enlace de Google Meet.
- Paciente y psicologa ven el enlace dentro de El Club.

## Importante

Esto no debe implementarse solo en frontend. El flujo necesita backend seguro
para guardar tokens OAuth, refrescar tokens y crear eventos sin exponer secretos.

## Arquitectura recomendada

1. Crear proyecto en Google Cloud.
2. Activar Google Calendar API.
3. Configurar OAuth consent screen.
4. Crear OAuth Client.
5. Agregar redirect URI hacia una Edge Function o backend.
6. Guardar tokens cifrados por psicologa.
7. Crear servicio backend:
   - conectar calendario
   - listar calendarios
   - leer busy/free slots
   - crear evento con conferencia Meet
   - revocar conexion

## Tablas sugeridas

```sql
create table public.psychologist_calendar_connections (
  psychologist_id uuid primary key references public.psychologists (user_id),
  provider text not null default 'google',
  calendar_id text,
  access_token_encrypted text not null,
  refresh_token_encrypted text,
  expires_at timestamptz,
  connected_at timestamptz not null default now()
);
```

## Fase actual

La plataforma ya soporta enlaces Meet manuales por cita. La siguiente fase es
automatizar la creacion del evento/Meet desde backend.
