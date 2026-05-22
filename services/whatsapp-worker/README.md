# Wodsi WhatsApp Worker

Proceso Node.js que corre [whatsapp-web.js](https://github.com/wwebjs/whatsapp-web.js) **24/7**, una sesión por coach.

## Qué hace

- Escucha `whatsapp_settings.sessionCommand` (`connect` / `disconnect`) y muestra el QR en Firestore.
- Procesa `whatsapp_outbox` con estado `pending` y envía solo a números de atletas del roster.
- Reglas programadas (`sendTime`) y bienvenida (`on_signup`).
- **No** sincroniza chats: solo envía mensajes encolados.

## Setup (obligatorio para ver el QR)

1. [Firebase Console](https://console.firebase.google.com/) → proyecto **wodsi-47ffb** → ⚙️ Configuración → **Cuentas de servicio**.
2. **Generar nueva clave privada** → se descarga un `.json`.
3. Renombralo y guardalo aquí (no lo subas a git):

```text
services/whatsapp-worker/serviceAccount.json
```

4. El archivo `.env` ya trae `FIREBASE_PROJECT_ID=wodsi-47ffb`. Si falta, copiá `.env.example`.

5. Instalá dependencias y arrancá:

```bash
npm run whatsapp:install
npm run whatsapp:dev
```

4. Publicá las reglas de Firestore del proyecto (`firestore.rules`).

5. En la app, coach → **WhatsApp** → **Conectar WhatsApp** y escaneá el QR.

## Error de Chrome / Puppeteer

Si ves `Failed to launch the browser process` o `Could not find Chrome`:

1. **macOS:** tené [Google Chrome](https://www.google.com/chrome/) instalado (el worker lo usa automáticamente).
2. O instalá el Chrome de Puppeteer:

```bash
cd services/whatsapp-worker
npx puppeteer browsers install chrome
```

3. O definí la ruta en `.env`:

```env
PUPPETEER_EXECUTABLE_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
```

Reiniciá `npm run whatsapp:dev` y volvé a **Conectar WhatsApp** en la app.

## Windows 24/7 (tu PC como servidor)

Guía completa: [`docs/DEPLOY_WINDOWS.md`](../../docs/DEPLOY_WINDOWS.md) — energía sin suspender, `pm2`, arranque al boot.

## Alias y precios

El coach los configura en **Configuración** (`coaches_public`). Las plantillas usan `{{alias}}` y `{{monto}}`.
