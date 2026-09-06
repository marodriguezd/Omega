# 🌌 Omega - Hub de Bienestar para Android

<div align="center">
  <img src="public/assets/icon.svg" alt="Logo de Omega" width="128" height="128">
  <h3>Hub Unificado de Bienestar y Vitalidad para Android</h3>

  [![Build & Release Android APK](https://github.com/marodriguezd/Omega/actions/workflows/android.yml/badge.svg)](https://github.com/marodriguezd/Omega/actions/workflows/android.yml)
  [![Última Versión](https://img.shields.io/github/v/release/marodriguezd/Omega?color=4ca1af&label=Android%20APK)](https://github.com/marodriguezd/Omega/releases/latest)
  [![Capacitor](https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com/)
  [![Hecho con](https://img.shields.io/badge/Hecho%20con-React%2019%20%2B%20Vite%20%2B%20TS-61DAFB?logo=react&logoColor=white)](https://react.dev/)
  [![Licencia: MIT](https://img.shields.io/badge/Licencia-MIT-yellow.svg)](LICENSE)

  [Descripción](#-descripción) • [Descargar APK](#-descargar-e-instalar-en-android) • [Características](#-características) • [Ecosistema](#-aplicaciones-integradas) • [Desarrollo](#-desarrollo-local) • [Licencia](#-licencia)

  **[🇬🇧 Read in English](README.md)**
</div>

---

## 🌟 Descripción

**Omega** es una aplicación móvil nativa para Android y hub unificado desarrollado con **Capacitor 8**, **React 19** y **Vite**. Integra de forma fluida dos herramientas de salud y bienestar en una sola experiencia compartida con rutinas, rachas y métricas centralizadas:

1. 🌬️ **[Bubble Breathing](https://github.com/marodriguezd/Bubble-Breathing)**: Ejercicios guiados de respiración rítmica profunda y apnea consciente (método Wim Hof).
2. ❄️ **[HydroCycle](https://github.com/marodriguezd/Hydrocicle)**: Temporizador inmersivo de terapia de contraste (intervalos frío/calor) y exposición al agua fría.

---

## 📱 Descargar e Instalar en Android

Puedes descargar el archivo APK precompilado directamente desde GitHub Releases:

👉 **[Descargar Omega.apk (Última versión)](https://github.com/marodriguezd/Omega/releases/latest/download/Omega.apk)**

### Pasos de Instalación:
1. Abre el enlace anterior desde el navegador de tu móvil Android y descarga `Omega.apk`.
2. Toca la notificación de descarga o localiza el archivo en tu carpeta de **Descargas**.
3. Si Android te lo solicita, activa la opción **"Permitir desde esta fuente"** para tu navegador o gestor de archivos.
4. Pulsa **Instalar** y ¡disfruta de Omega!

---

## ✨ Características

- **Dashboard Unificado de Bienestar**:
  - 🔥 **Racha Activa Combinada**: Seguimiento de días consecutivos practicando respiración o exposición al frío.
  - 🎯 **Rutina Diaria**: Estado interactivo para completar tanto el hábito de respiración como el de hidroterapia.
  - ⚡ **Tarjetas de Acceso Rápido ("Quick Start")**: Inicia sesiones con un solo toque desde la pantalla principal.
  - 📊 **Analítica Agregada**: Sesiones totales, tiempo acumulado de retención de aire y tiempo total de exposición al frío.
  - 🕒 **Historial Reciente**: Cronología combinada con las sesiones más recientes de ambas herramientas.
- **Navegación Móvil Fluida**: Barra inferior fija (*BottomNav*) para alternar sin recargas entre el Hub, Bubble Breathing e HydroCycle.
- **Pantalla Activa (*Keep Awake*)**: Mantiene la pantalla encendida automáticamente durante las fases de apnea y bajo la ducha para evitar bloqueos del dispositivo.
- **Botón Atrás de Android**: Gestión nativa del botón y gesto de retroceso con modal de confirmación si hay un ejercicio en progreso.
- **Diseño Glassmorphism**: Estética moderna tipo cristal con degradados animados y soporte completo para **Modo Oscuro** y **Modo Claro**.
- **Multilingüe (7 idiomas)**: Sincronizado en todo el hub en español, inglés, francés, alemán, italiano, portugués y chino simplificado.

---

## 🧩 Aplicaciones Integradas

| App | Enfoque | Aspectos Destacados |
| :--- | :--- | :--- |
| **[Bubble Breathing](https://github.com/marodriguezd/Bubble-Breathing)** | Respiración y Apnea | Control de velocidad, cronómetro de retención, temporizador de recuperación, burbujas animadas, sonido ambiente. |
| **[HydroCycle](https://github.com/marodriguezd/Hydrocicle)** | Terapia de Contraste | Ciclos de calor/frío, transiciones visuales de temperatura, ajustes preestablecidos personalizables, modo choque frío. |

---

## 🛠️ Arquitectura y Stack Tecnológico

- **Estructura Monorepo**: Gestionado con **PNPM Workspaces** y **Git Submodules**, manteniendo `Bubble-Breathing` e `Hydrocicle` sincronizados con sus repositorios upstream independientes.
- **Capacitor 8 Android**: Wrapper nativo que genera el proyecto Android Gradle oficial en `android/` (`com.marodriguezd.omega`).
- **CI/CD Automatizado**: Flujo de GitHub Actions ([`.github/workflows/android.yml`](.github/workflows/android.yml)) con OpenJDK 21, Android SDK y Gradle para compilar y publicar `Omega.apk` automáticamente con cada actualización.

---

## 💻 Desarrollo Local

### Requisitos previos
- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/) (v10+)
- [Android Studio](https://developer.android.com/studio) (opcional, para depuración nativa)

### Clonar con Submódulos
```bash
git clone --recursive https://github.com/marodriguezd/Omega.git
cd Omega
```

### Instalar Dependencias
```bash
pnpm install --dangerously-allow-all-builds
```

### Servidor de Desarrollo Web
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

Este proyecto es de código abierto bajo la [Licencia MIT](LICENSE).
