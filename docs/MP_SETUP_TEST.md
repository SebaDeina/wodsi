# Mercado Pago — setup rápido (TEST)

## 1. Credenciales en `.env.local`

```env
MP_ACCESS_TOKEN=TEST-...        # Access token de prueba
VITE_MP_PUBLIC_KEY=TEST-...     # Public key (opcional en front)
VITE_MP_PLAN_ID_STARTER=...
VITE_MP_PLAN_ID_GROWTH=...
```

## 2. Crear planes (una sola vez)

```bash
npm run billing:create-plans
```

Copiá los `VITE_MP_PLAN_ID_*` que imprime el script a `.env.local`.

## 3. Probar suscripción en local

**Terminal 1 — app**
```bash
npm run dev
```

**Terminal 2 — API de cobros**
```bash
npm run billing:dev
```

Entrá como coach → **Planes** → elegí plan → **Ir a Mercado Pago**.

Pagá con [tarjetas de prueba MP](https://www.mercadopago.com.ar/developers/es/docs/checkout-api/integration-test/test-cards).

## 4. Automatizar estado + historial (webhook)

Mercado Pago avisa a tu servidor cuando alguien paga. Sin eso, el link funciona pero la app no actualiza sola.

### En local (ngrok)

```bash
ngrok http 8788
```

En [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/panel/app) → Webhooks:

- URL: `https://TU-SUBDOMINIO.ngrok.io/api/mercadopago/webhook`
- Eventos: `subscription_preapproval`, `payment`, `subscription_authorized_payment`

### En producción

1. Desplegá `services/billing-api` (Railway, VPS, etc.)
2. Webhook → `https://billing.tudominio.com/api/mercadopago/webhook`
3. En App Hosting: `VITE_BILLING_API_URL=https://billing.tudominio.com`

Con webhook activo:
- Se marca suscripción **activa** en Firestore
- Cada cobro mensual aparece en **Historial de pagos**

## 5. Producción real

Repetí `npm run billing:create-plans` con **credenciales de producción** (`APP_USR-...`) y actualizá las variables en App Hosting.
