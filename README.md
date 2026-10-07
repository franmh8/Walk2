# C5i Hidalgo WalkieT Radio

Sistema de radiocomunicación táctica PTT (Push-to-Talk) estilo Zello para el C5i de Hidalgo.

El repositorio está configurado para ejecutarse tanto como aplicación Web como app móvil para **Expo Go** (iOS y Android):

---

## 🌐 1. Proyecto Web & Servidor API (Raíz `/`)

Aplicación Web full-stack con React 19, Tailwind CSS y servidor Express en Node.js que expone las APIs REST en el puerto 3000.

- **Directorio:** Raíz (`./`)
- **Comando:** `npm run dev`
- **Puerto:** `http://localhost:3000`
- **Scripts disponibles:**
  - `npm run dev`: Inicia el servidor backend Express con Vite middleware.
  - `npm run build`: Compila la versión web para producción.
  - `npm run lint`: Valida tipos TypeScript en la versión web.

---

## 📱 2. Proyecto Móvil Expo Go (`/expo-app` y `/App.js`)

Aplicación nativa móvil con **Expo SDK 57**, **React 19.2** y **React Native 0.86** para pruebas en **Expo Go** en iPhone (iOS) y Android.

- **Comandos rápidos desde la raíz:**
  ```bash
  npm run mobile:tunnel
  ```
  *(O si prefieres entrar directamente a la carpeta)*:
  ```bash
  cd expo-app
  npm install
  npx expo start --tunnel -c
  ```
- **Contenido y funcionalidades:**
  - Botón táctico PTT con transmisión y grabación en tiempo real (`expo-av`).
  - Vibración háptica táctica (`expo-haptics`).
  - Canales operativos C5i con cifrado AES-256.
  - Despacho y chat operativo.
  - Directorio de unidades con enlace PTT directo.
  - Alerta de emergencia Código Rojo SOS.
