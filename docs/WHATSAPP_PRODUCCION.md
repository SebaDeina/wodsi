# WhatsApp en producción (un número por coach)

## Cómo funciona hoy

```
Coach (app web)  →  Firestore (whatsapp_settings, whatsapp_outbox)
                           ↑↓
              Worker Node (whatsapp-web.js + Chrome)
                           ↓
              WhatsApp del coach (su celular, dispositivo vinculado)
```

- **Cada coach** tiene su propia sesión: `LocalAuth({ clientId: coachId })` en `services/whatsapp-worker/`.
- La app **no** lee chats: solo encola mensajes en `whatsapp_outbox`.
- El worker es **uno solo** que atiende a **todos los coaches** del proyecto Firebase (multi-tenant).

Un solo proceso puede manejar varios coaches a la vez (cada uno con su Chrome/sesión), pero ese proceso tiene que estar **encendido 24/7** y con **Chrome** disponible.

## Qué NO es

| Lugar | ¿Sirve para WhatsApp? |
|--------|----------------------|
| Firebase App Hosting | No — solo la web estática/React |
| Firebase Functions | Muy difícil — Puppeteer/Chrome y sesiones largas |
| El celular del coach sin worker | No — alguien tiene que ejecutar whatsapp-web.js |

## Opciones de servidor (recomendado para indie / MVP)

### 1. VPS (la más simple de entender)

Un servidor Linux (DigitalOcean, Hetzner, AWS Lightsail, etc.):

1. Node 20+, Google Chrome instalado.
2. Clonás el repo, `npm run whatsapp:install`.
3. Clave Firebase Admin en el servidor (archivo o variable), **nunca en GitHub**.
4. Proceso siempre activo: `pm2 start npm --name wodsi-wsp -- run whatsapp:start`.

**Pros:** Mismo modelo que en tu Mac. **Contras:** Lo mantenés vos; si se cae el VPS, se cortan todos los WhatsApp.

### 2. Un Mac / mini PC en el gym (solo 1 box)

Si solo vos usás Wodsi al principio, el worker en tu Mac con `pm2` o “siempre encendido” alcanza para validar.

### 3. Cloud Run / contenedor (más adelante)

Posible pero incómodo: imagen con Chrome, memoria alta, sesiones en volumen persistente, un contenedor por coach o un contenedor multi-sesión. Conviene cuando tengas muchos coaches y presupuesto DevOps.

## Checklist al poner el worker en producción

1. **Mismas variables** que en local: `FIREBASE_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS`, `PUPPETEER_EXECUTABLE_PATH` (ruta a Chrome en Linux).
2. **Reglas Firestore** publicadas (`npm run deploy:rules`).
3. Carpeta persistente `.wwebjs_auth` en el servidor (sesiones por coach; no borrarla al reiniciar).
4. El coach en la app: **Conexión → Conectar WhatsApp** y escanear QR **una vez** (o tras borrar sesión).
5. **Reinicio del worker:** al arrancar, el código restaura sesiones con `connected: true` en Firestore.

## Escalado cuando haya muchos coaches

| Coaches | Enfoque |
|---------|---------|
| 1–5 | Un VPS, un worker |
| 5–20 | VPS más grande (RAM/CPU); vigilar RAM de Chrome por sesión |
| 20+ | Varios workers con cola por shard, o contenedor por coach |

Cada sesión activa ≈ una instancia de Chrome → planificá **RAM** (orden de magnitud: 200–500 MB por coach con sesión abierta).

## Seguridad

- La cuenta de servicio Firebase Admin solo en el servidor.
- En GitHub **no** subir: `*-firebase-adminsdk-*.json`, `.env.local`, `services/whatsapp-worker/.env`.
- Rotá la clave si alguna vez se filtró.

## Resumen para el coach final

1. Entrá a Wodsi (web publicada en App Hosting).
2. WhatsApp → **Conectar** y escaneá el QR con **tu** WhatsApp.
3. Activá mensajes automáticos en **Automáticos**.
4. Los envíos salen de **tu número**, no de un número de Wodsi.

Wodsi no es API oficial de WhatsApp Business: es **tu WhatsApp vinculado**, como WhatsApp Web en una PC que está siempre prendida (el servidor).
