-- Recursos emocionales iniciales (meditaciones + contenido)
-- Ejecutar despuÃ©s de 001 y 002

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
    'RespiraciÃ³n consciente para volver al cuerpo.',
    'meditation',
    'Cierra los ojos. Inhala en 4, sostÃ©n en 4, exhala en 6.',
    null,
    8,
    true,
    10
  ),
  (
    'Soltar',
    'Libera tensiÃ³n acumulada con suavidad.',
    'meditation',
    'Recorre hombros, mandÃ­bula y manos sin juzgar.',
    null,
    6,
    true,
    20
  ),
  (
    'Gratitud suave',
    'Cierra el dÃ­a con calma.',
    'meditation',
    'Nombra tres cosas pequeÃ±as que te sostuvieron hoy.',
    null,
    5,
    true,
    30
  ),
  (
    'Cuando la ansiedad sube',
    'Lectura breve y aplicable para hoy.',
    'article',
    'La ansiedad es una seÃ±al, no un fallo. Puedes nombrarla y acompaÃ±arla.',
    null,
    5,
    true,
    40
  ),
  (
    'RespiraciÃ³n 4-4-6',
    'Ejercicio guiado para regular el sistema nervioso.',
    'exercise',
    'Repite 4 ciclos. Si te mareas, vuelve a tu ritmo natural.',
    null,
    4,
    true,
    50
  )
on conflict do nothing;
