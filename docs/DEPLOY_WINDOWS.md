# Worker WhatsApp en tu PC Windows (24/7, modo barato)

No es un VPS: es **tu PC haciendo de servidor** solo para el worker. La **app web** puede seguir en **Firebase App Hosting** (automático desde GitHub).

```
Usuarios → App Hosting (web)
              ↓
         Firebase
              ↑↓
    Tu PC Windows → worker WhatsApp (pm2)
```

## Requisitos

- Windows 10/11
- [Node.js 20 LTS](https://nodejs.org/)
- [Google Chrome](https://www.google.com/chrome/) instalado
- Clave Firebase Admin (JSON) en `services/whatsapp-worker/` (no subir a GitHub)
- Proyecto clonado o copiado en el PC

## 1. Instalar el worker (una vez)

En **PowerShell** o CMD, desde la carpeta del proyecto:

```powershell
cd C:\ruta\a\WODSI_APP
npm run whatsapp:install
```

Copiá la clave de Firebase Admin y el `.env`:

```powershell
cd services\whatsapp-worker
copy .env.example .env
# Editá .env: FIREBASE_PROJECT_ID=wodsi-47ffb
# Colocá el JSON de la cuenta de servicio (nombre que tengas) y en .env:
# GOOGLE_APPLICATION_CREDENTIALS=.\wodsi-47ffb-firebase-adminsdk-xxxxx.json
```

Probar que arranca:

```powershell
cd C:\ruta\a\WODSI_APP
npm run whatsapp:start
```

Deberías ver `Firebase Admin OK` y `listening`. En la app: **WhatsApp → Conectar** y escaneá el QR.

Para desarrollo con recarga al guardar código, usá `npm run whatsapp:dev` (no para 24/7).

## 2. Que Windows no suspenda el PC

1. **Configuración → Sistema → Energía**
2. Modo de energía: **Alto rendimiento** (o Equilibrado sin suspender).
3. **Pantalla:** puede apagarse.
4. **Suspender:** **Nunca** (con cable de red recomendado).

Si es portátil, enchufado siempre.

## 3. Dejar el worker siempre activo (pm2)

Instalá pm2 global:

```powershell
npm install -g pm2
```

Desde la raíz del proyecto:

```powershell
cd C:\ruta\a\WODSI_APP
pm2 start npm --name wodsi-wsp -- run whatsapp:start
pm2 save
```

Comandos útiles:

```powershell
pm2 status
pm2 logs wodsi-wsp
pm2 restart wodsi-wsp
pm2 stop wodsi-wsp
```

## 4. Que arranque al prender la PC (opcional)

En PowerShell **como Administrador**:

```powershell
pm2 startup
```

Te muestra un comando; copialo, ejecutalo, después:

```powershell
pm2 save
```

Así el worker vuelve solo tras reiniciar Windows.

## 5. Chrome en Windows

El worker busca:

`C:\Program Files\Google\Chrome\Application\chrome.exe`

Si Chrome está en otra ruta, en `services/whatsapp-worker/.env`:

```env
PUPPETEER_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

## 6. Carpeta de sesiones WhatsApp

Las sesiones de cada coach quedan en:

```text
services\whatsapp-worker\.wwebjs_auth\
```

**No borres** esa carpeta si no querés volver a escanear el QR.

## 7. Actualizar código

```powershell
cd C:\ruta\a\WODSI_APP
git pull
npm run whatsapp:install
pm2 restart wodsi-wsp
```

## Limitaciones (vs VPS Hostinger)

| | PC Windows | VPS |
|--|------------|-----|
| Cortes de luz / Wi‑Fi | Se corta WhatsApp | Más estable |
| PC apagada | No hay envíos | Sigue |
| Costo | Luz, $0 de VPS | ~AR$ 12k/mes |
| Varios coaches | Limitado por RAM | KVM 1/2 |

Cuando un coach **pague** y necesites 24/7 fiable, migrás el worker al VPS (copiás `.wwebjs_auth` + el JSON + `.env`).

## Resumen mínimo

1. `npm run whatsapp:install`
2. `.env` + clave Admin en `services/whatsapp-worker/`
3. Energía: no suspender
4. `pm2 start npm --name wodsi-wsp -- run whatsapp:start`
5. `pm2 save` (+ `pm2 startup` si querés al boot)

La web en **Firebase App Hosting**; la PC solo para WhatsApp.
