# 🌌 Omega - Hub de Bienestar para Android

[![Build & Release Android APK](https://github.com/marodriguezd/Omega/actions/workflows/android.yml/badge.svg)](https://github.com/marodriguezd/Omega/actions/workflows/android.yml)
[![Release](https://img.shields.io/github/v/release/marodriguezd/Omega?color=4ca1af&label=Android%20APK)](https://github.com/marodriguezd/Omega/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Omega** es una aplicación móvil nativa para Android (desarrollada con **Capacitor**, **React 19** y **Vite**) que funciona como **Hub y Wrapper unificado** para dos aplicaciones de salud y vitalidad:

1. 🌬️ **[Bubble Breathing](https://github.com/marodriguezd/Bubble-Breathing)**: Ejercicios guiados de respiración profunda, ritmo personalizable y apnea consciente (método Wim Hof).
2. ❄️ **[HydroCycle](https://github.com/marodriguezd/Hydrocicle)**: Temporizador guiado para duchas de contraste térmico (calor/frío) y acondicionamiento al agua fría.

---

## 📱 Descargar e Instalar en Android

Puedes descargar el archivo APK compilado directamente desde GitHub Releases:

👉 **[Descargar Omega.apk (Última versión)](https://github.com/marodriguezd/Omega/releases/latest/download/Omega.apk)**

### Pasos de instalación:
1. Abre el enlace anterior desde el navegador de tu dispositivo Android y descarga `Omega.apk`.
2. Toca la notificación de descarga o busca el archivo en tu carpeta de Descargas.
3. Si Android solicita autorización, activa la opción **"Permitir desde esta fuente"**.
4. Pulsa **Instalar** y ¡listo!

---

## 🚀 Características Principales

- **Dashboard Unificado**:
  - **Racha Activa Combinada (🔥)**: Seguimiento de días consecutivos practicando respiración o duchas frías.
  - **Rutina Diaria**: Lista de comprobación para registrar si completaste tu sesión matutina o nocturna.
  - **Acceso Rápido ("Quick Start")**: Inicia sesiones con un solo toque desde la pantalla principal.
  - **Historial Agregado**: Consulta tus sesiones recientes y tiempos totales de apnea y frío acumulados.
- **Navegación Móvil Fluida**: Barra inferior fija (*Bottom Navigation Bar*) para alternar sin recargas entre el Hub, Bubble Breathing e HydroCycle.
- **Pantalla Activa (*Keep Awake*)**: Evita automáticamente que la pantalla del teléfono se bloquee durante los ejercicios de respiración o mientras estás bajo la ducha.
- **Botón Atrás de Android**: Gestión nativa del botón o gesto de retroceso con aviso de confirmación si hay un ejercicio en progreso.
- **Diseño Glassmorphism**: Interfaz inmersiva con fondos animados y soporte para modo oscuro (*Dark Mode*) y modo claro (*Light Mode*).
- **Multilenguaje (7 idiomas)**: Español, English, Français, Italiano, Deutsch, Português y 简体中文.

---

## 🛠️ Arquitectura Técnica

- **Estructura Monorepo**: Orquestado mediante **PNPM Workspaces** y **Git Submodules**, permitiendo mantener `Bubble-Breathing` e `Hydrocicle` sincronizados con sus repositorios upstream independientes.
- **Capacitor 8**: Wrapper nativo que genera el proyecto Android Gradle oficial en `android/`.
- **Compilación Automatizada (CI/CD)**: Flujo de trabajo en `.github/workflows/android.yml` con OpenJDK 21, Android SDK y Gradle que compila y publica `Omega.apk` en GitHub Releases en cada actualización.

---

## 💻 Desarrollo Local

### Requisitos
- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/) (v10+)
- [Android Studio](https://developer.android.com/studio) (opcional, para desarrollo nativo Android)

### Clonar con submódulos
```bash
git clone --recursive https://github.com/marodriguezd/Omega.git
cd Omega
```

### Instalar dependencias
```bash
pnpm install --dangerously-allow-all-builds
```

### Modo de desarrollo Web
```bash
pnpm dev
```

### Compilar y Sincronizar con Android
```bash
pnpm run build
npx cap sync android
```

### Abrir en Android Studio
```bash
npx cap open android
```

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.
