# Suscripción del coach (Mercado Pago)

Planes mensuales según roster:

| Atletas | Precio ARS/mes |
|---------|----------------|
| 0–20    | $12.000        |
| 21–80   | $28.000        |

## Pantalla Planes

Los coaches entran a **Planes** (`/coach/planes`) desde el menú lateral:

- Elegir plan (según cantidad de atletas)
- Ir a **tu link de Mercado Pago** para suscribirse
- Ver **historial de pagos** confirmados en la app

## Links de Mercado Pago (recomendado)

En `.env.local` / App Hosting:

```env
VITE_MP_LINK_STARTER=https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=...
VITE_MP_LINK_GROWTH=https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=...
```

Creá dos planes de suscripción en [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/panel/app) y pegá el link de checkout de cada uno.

Al hacer clic en **Ir a Mercado Pago**, se abre tu link y la app registra qué plan eligió el coach (para asociar el webhook).

## Webhook + historial de pagos

1. Desplegá `services/billing-api` con URL pública.
2. Configurá webhook en MP → `https://TU-API/api/mercadopago/webhook`
3. Tópicos: `subscription_preapproval`, `payment`, `subscription_authorized_payment`
4. `MP_ACCESS_TOKEN` en billing-api (mismo usuario de MP que cobra)

Los pagos aprobados se guardan en `coach_subscription_payments` y aparecen en **Historial de pagos**.

## Desarrollo local

```bash
npm run dev          # app
npm run billing:dev  # API :8788
```

Agregá en `.env.local` tus links de MP de prueba.

## Alternativa: checkout por API

Si no configurás `VITE_MP_LINK_*`, la app crea la suscripción vía API (`MP_ACCESS_TOKEN` + billing-api).
