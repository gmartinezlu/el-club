-- Recursos emocionales iniciales (meditaciones + contenido)
-- Ejecutar después de 001 y 002

insert into public.resources (
  title,
  description,
  type,
  content,
  media_url,
  duration_minutes,
  is_published,
  sort_order
)
values
  (
    'Centro',
    'Respiración consciente para volver al cuerpo.',
    'meditation',
    'Cierra los ojos. Inhala en 4, sostén en 4, exhala en 6.',
    null,
    8,
    true,
    10
  ),
  (
    'Soltar',
    'Libera tensión acumulada con suavidad.',
    'meditation',
    'Recorre hombros, mandíbula y manos sin juzgar.',
    null,
    6,
    true,
    20
  ),
  (
    'Gratitud suave',
    'Cierra el día con calma.',
    'meditation',
    'Nombra tres cosas pequeñas que te sostuvieron hoy.',
    null,
    5,
    true,
    30
  ),
  (
    'Cuando la ansiedad sube',
    'Lectura breve y aplicable para hoy.',
    'article',
    'La ansiedad es una señal, no un fallo. Puedes nombrarla y acompañarla.',
    null,
    5,
    true,
    40
  ),
  (
    'Respiración 4-4-6',
    'Ejercicio guiado para regular el sistema nervioso.',
    'exercise',
    'Repite 4 ciclos. Si te mareas, vuelve a tu ritmo natural.',
    null,
    4,
    true,
    50
  )
on conflict do nothing;
