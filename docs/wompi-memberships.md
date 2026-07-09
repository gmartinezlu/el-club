# Wompi para membresias EL CLUB

EL CLUB procesa pagos internos solo para membresias. Los pagos de terapia se
coordinan directamente entre la persona y la profesional.

## Frontend

Variables Vite:

```env
VITE_WOMPI_PUBLIC_KEY=
VITE_WOMPI_INTEGRITY_KEY=
VITE_WOMPI_CHECKOUT_URL=https://checkout.wompi.co/p/
```

## Webhook Firebase

Funcion:

```txt
wompiMembershipWebhook
```

Variables seguras de Functions:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
WOMPI_EVENTS_SECRET=
```

`SUPABASE_SERVICE_ROLE_KEY` nunca debe ir en frontend.

## Evento esperado

Wompi envia `transaction.updated`. La funcion valida el checksum con:

1. `signature.properties`
2. `timestamp`
3. `WOMPI_EVENTS_SECRET`

Si la transaccion llega `APPROVED`, la funcion:

1. Busca `membership_orders.provider_reference`.
2. Verifica que el monto coincida.
3. Marca la orden como `approved`.
4. Activa `patient_memberships`.
5. Crea una notificacion para la persona.

Si llega `DECLINED`, `ERROR` o `VOIDED`, actualiza la orden sin activar
membresia.
