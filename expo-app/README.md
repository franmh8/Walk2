# C5i Hidalgo WalkieT Radio (React Native / Expo)

Aplicación táctica completa de radiocomunicación Push-to-Talk (PTT) para iOS y Android desarrollada con **Expo** y **React Native**.

---

## 🚀 Cómo ejecutar en Expo Go (iPhone y Android)

### Paso 1: Instalar dependencias
Abre tu terminal en la carpeta `expo-app`:
```bash
npm install
```

### Paso 2: Iniciar servidor de desarrollo de Expo
```bash
npx expo start
```
> **Nota para conexión remota/túnel:** Si tu teléfono no está en la misma red Wi-Fi que tu computadora, inicia con túnel:
> ```bash
> npx expo start --tunnel
> ```

### Paso 3: Abrir en tu teléfono
1. **iPhone:** Abre la aplicación de la Cámara nativa y escanea el código QR mostrado en la terminal. Toca la notificación para abrirlo en **Expo Go**.
2. **Android:** Abre la app **Expo Go** y selecciona **"Scan QR code"**.

---

## 📱 Características Nativas Incluidas
- **Botón Push-to-Talk (PTT)** con grabación en tiempo real usando `expo-av`.
- **Respuesta háptica táctica** en iPhone y Android mediante `expo-haptics`.
- **Selector de 5 Canales Operativos C5i** (General, Emergencias 911, Operativo Pachuca, etc.).
- **Despacho y Chat Táctico** con mensajes cifrados.
- **Directorio de Unidades y Contactos** con botón PTT directo punto a punto.
- **Botón de Emergencia SOS (Código Rojo)** con confirmación táctica.
- **Historial de Voz** para volver a escuchar las ráfagas recibidas.
