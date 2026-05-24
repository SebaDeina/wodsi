# Servidor 24/7 con Docker (PC siempre prendida)

Arquitectura recomendada:

```
Usuarios → Firebase App Hosting (app web React)
              ↕
         Firebase (Auth + Firestore)
              ↕
    Tu PC + Docker
      ├── billing-api   :8788  ← webhooks Mercado Pago
      └── whatsapp-worker      ← WhatsApp automático
```

La **app web** no hace falta meterla en Docker si ya está en App Hosting. En el PC solo corrés los **2 backends**.

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows o Mac)
- JSON de Firebase Admin en `services/whatsapp-worker/` (no commitear)
- Token de Mercado Pago en `.env.docker`

## Arranque

```bash
cp .env.docker.example .env.docker
# Editá MP_ACCESS_TOKEN, FIREBASE_CREDENTIALS_PATH, APP_PUBLIC_URL

docker compose up -d --build
docker compose ps
docker compose logs -f billing-api
docker compose logs -f whatsapp-worker
```

## Mercado Pago — webhook sin ngrok

Para que Planes se actualice solo, MP tiene que llegar a tu PC:

1. **Opción A — IP pública + router**  
   - Redirigí el puerto `8788` → tu PC  
   - Webhook en MP: `http://TU-IP-PUBLICA:8788/api/mercadopago/webhook`  
   - (HTTPS es mejor; podés poner Caddy delante)

2. **Opción B — Cloudflare Tunnel** (recomendado en casa)  
   - Túnel gratis a `localhost:8788`  
   - Webhook: `https://billing.tudominio.com/api/mercadopago/webhook`

3. **Opción C — ngrok** (solo pruebas)  
   - `ngrok http 8788`

Eventos en MP: `subscription_preapproval`, `payment`, `subscription_authorized_payment`.

## App Hosting

En Firebase Console → App Hosting → Environment, agregá:

```env
VITE_BILLING_API_URL=http://TU-IP-PUBLICA:8788
```

(o la URL del túnel Cloudflare). Sin esto, Planes abre MP pero la app en producción no llama a tu API.

En **local** (`npm run dev`) el proxy `/api` → `:8788` sigue funcionando sin esa variable.

## WhatsApp en Docker

- La sesión (QR) se guarda en el volumen `wwebjs_auth`.
- Primera vez: mirá logs `docker compose logs -f whatsapp-worker` y conectá desde la app.
- Si cambiás de máquina, el volumen migra la sesión.

## Comandos útiles

```bash
docker compose restart billing-api
docker compose restart whatsapp-worker
docker compose down
docker compose up -d --build   # después de cambios de código
```

## Producción MP

Cuando pases a cobrar de verdad:

1. Credenciales **producción** (`APP_USR-...`) en `.env.docker`
2. `npm run billing:create-plans` con ese token
3. Actualizá `VITE_MP_PLAN_ID_*` en App Hosting
