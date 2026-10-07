# C5i Hidalgo WalkieT - App Móvil (Expo / React Native)

Aplicación nativa móvil para **Expo Go** (iOS y Android) actualizada a **Expo SDK 57**, **React 19.2** y **React Native 0.86**.

---

## 📱 Cómo ejecutar en tu teléfono (iOS / Android con Expo Go)

### 1. Entra a la carpeta de la app móvil:
```bash
cd expo-app
```

### 2. Instala las dependencias:
```bash
npm install
```

### 3. Inicia el servidor Expo con túnel:
```bash
npx expo start --tunnel -c
```
*(El parámetro `--tunnel` permite que tu iPhone y Android se conecten sin importar la red Wi-Fi; `-c` limpia la caché de Metro)*.

### 4. Escanear en tu móvil:
- **iPhone:** Abre la aplicación nativa de **Cámara**, enfoca el código QR en pantalla y toca la notificación para abrir en **Expo Go**.
- **Android:** Abre la aplicación **Expo Go**, toca **"Scan QR code"** y enfoca el código QR.

---

## 🛠️ Estructura de `expo-app/`
```
expo-app/
├── package.json         # Dependencias para Expo SDK 57, React 19.2, React Native 0.86
├── App.tsx              # Componente raíz con navegación (@react-navigation) y proveedores
├── app.json             # Configuración y permisos nativos de Expo (Micrófono, Audio background, sdkVersion 57.0.0)
├── babel.config.js      # Configuración de Babel
├── tsconfig.json        # Configuración TypeScript
└── src/
    ├── screens/         # Pantallas (PTT, Grupos, Chat, Contactos, Perfil)
    ├── context/         # Estados globales (Auth, Radio, Chat)
    ├── services/        # AudioService (expo-av, expo-haptics), ApiService
    └── types.ts         # Tipos e interfaces
```
