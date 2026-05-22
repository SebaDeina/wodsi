# Publicar Wodsi en Firebase App Hosting

La app web (Vite + React) va en **App Hosting**. El worker de WhatsApp (`npm run whatsapp:dev`) **no** se despliega ahí: corre en tu Mac o en un servidor aparte.

## Requisitos

- Proyecto Firebase: **wodsi-47ffb**
- [Firebase CLI](https://firebase.google.com/docs/cli) 13.15+ (`firebase --version`)
- Repositorio en **GitHub** (App Hosting despliega desde Git)
- Reglas de Firestore publicadas

## 1. Instalar dependencias

```bash
npm install
```

## 2. Probar build local (opcional)

```bash
npm run build
PORT=8080 npm start
# Abrí http://localhost:8080
```

## 3. Publicar reglas de Firestore

```bash
firebase login
firebase use wodsi-47ffb
npm run deploy:rules
```

## 4. Crear el backend en App Hosting

### Opción A — Consola (recomendada)

1. [Firebase Console](https://console.firebase.google.com/project/wodsi-47ffb/apphosting) → **App Hosting** → **Crear backend**.
2. Conectá el repo de GitHub y elegí la rama (`main`).
3. **Directorio raíz:** `/` (donde está este `package.json`).
4. Dejá que detecte `apphosting.yaml` y los scripts `build` / `start`.

### Opción B — CLI

```bash
firebase apphosting:backends:create --project wodsi-47ffb
```

Seguí los prompts (región, repo, rama, nombre del backend).

## 5. Variables de entorno (importante)

Vite embebe las variables en el **build**. En el backend → **Settings → Environment**, pegá el contenido de tu `.env.local`:

```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=wodsi-47ffb.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=wodsi-47ffb
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=wodsi-47ffb.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=293842210700
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

Marcá disponibilidad **BUILD** y **RUNTIME** (por defecto en consola suele estar bien).

Creá un **nuevo rollout** después de guardar variables.

## 6. Autenticación (Google / email)

Tras el primer deploy, copiá la URL de App Hosting (ej. `https://….hosted.app`) y agregala en:

**Authentication → Settings → Authorized domains**

Sin esto, el login puede fallar en producción.

## 7. WhatsApp en producción

- La app en App Hosting solo encola mensajes en Firestore.
- El **worker** debe seguir corriendo con sesión de WhatsApp (no está en App Hosting).
- Para producción real del worker: VPS, Cloud Run aparte, o tu Mac con el proceso activo.

## 8. Despliegues siguientes

Cada push a la rama configurada dispara un rollout (si activaste rollouts automáticos).

Manual:

```bash
firebase apphosting:rollouts:create BACKEND_ID --project wodsi-47ffb
```

## Alternativa: Firebase Hosting (solo estáticos)

Si preferís hosting clásico sin Cloud Run:

```bash
npm run build
firebase init hosting   # public: dist, SPA rewrite
firebase deploy --only hosting
```

App Hosting ya incluye servidor (`superstatic`) para rutas de React Router y headers de Auth.
