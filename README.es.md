# 🌌 Omega - Suite del Método Wim Hof y Hub de Vitalidad para Android

<div align="center">
  <img src="public/assets/icon.svg" alt="Logo de Omega" width="128" height="128">
  <h3>Suite Completa de Respiración Wim Hof, Exposición al Frío y Vitalidad para Android</h3>

  [![Build & Release Android APK](https://github.com/marodriguezd/Omega/actions/workflows/android.yml/badge.svg)](https://github.com/marodriguezd/Omega/actions/workflows/android.yml)
  [![Última Versión](https://img.shields.io/github/v/release/marodriguezd/Omega?color=4ca1af&label=Android%20APK)](https://github.com/marodriguezd/Omega/releases/latest)
  [![Capacitor](https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com/)
  [![Hecho con](https://img.shields.io/badge/Hecho%20con-React%2019%20%2B%20Vite%20%2B%20TS-61DAFB?logo=react&logoColor=white)](https://react.dev/)
  [![Licencia: MIT](https://img.shields.io/badge/Licencia-MIT-yellow.svg)](LICENSE)

  [Descripción](#-descripción) • [Descargar APK](#-descargar-e-instalar-en-android) • [Características](#-características) • [Arquitectura 5 Pestañas](#-arquitectura-de-5-pestañas) • [Desarrollo](#-desarrollo-local) • [Licencia](#-licencia)

  **[🇬🇧 Read in English](README.md)**
</div>

---

## 🌟 Descripción

**Omega v1.0** es una aplicación móvil nativa para Android y hub de salud 100% libre y open source desarrollado con **Capacitor 8**, **React 19** y **Vite**. Inspirado íntegramente en el **Método Wim Hof**, Omega ofrece una experiencia con privacidad absoluta, sin telemetría y sin publicidad, unificando respiración consciente guiada, exposición progresiva al frío, reto de flexiones en apnea y analíticas gamificadas:

1. 🌬️ **[Bubble Breathing](https://github.com/marodriguezd/Bubble-Breathing)**: Respiración rítmica profunda guiada, cronómetro de retención pulmonar en vacío y fase de recuperación con geometría sagrada hexagonal.
2. ❄️ **[HydroCycle](https://github.com/marodriguezd/Hydrocicle)**: Temporizador interactivo de terapia de contraste (frío/calor), ducha fría libre y asistente para baños de hielo.
3. 🧊 **Reto de 20 Días de Ducha Fría**: 4 semanas de adaptación progresiva (15s a 60s) con avisos acústicos de cuencos tibetanos en 432Hz.
4. 💪 **Test de Flexiones en Apnea**: Medición de resistencia y flexiones realizadas durante la retención sin aire.
5. 📊 **Pantalla de Progreso & Vitalidad**: Mapa de calor de 28 días, 10 insignias hexagonales desbloqueables y copia de seguridad JSON sin conexión.

---

## 📱 Descargar e Instalar en Android

Puedes descargar el archivo APK precompilado directamente desde GitHub Releases:

👉 **[Descargar Omega.apk (v1.0.0)](https://github.com/marodriguezd/Omega/releases/latest/download/Omega.apk)**

### Pasos de Instalación:
1. Abre el enlace anterior desde el navegador de tu móvil Android y descarga `Omega.apk`.
2. Toca la notificación de descarga o localiza el archivo en tu carpeta de **Descargas**.
3. Si Android te lo solicita, activa la opción **"Permitir desde esta fuente"** para tu navegador o gestor de archivos.
4. Pulsa **Instalar** y ¡disfruta de la experiencia Wim Hof en Omega!

---

## ✨ Características

- **Geometría Sagrada Wim Hof y Audio Zen 432Hz**:
  - 🔷 **Esfera Hexagonal Redondeada**: SVG con radio curvo (`R=86, cr=14`), anillo perimetral continuo (`pathLength="100"`), efecto glassmorphism y halos de luz.
  - 🎵 **Sintetizador Armónico 432Hz**: Motor Web Audio con cuencos tibetanos, campanas zen y respuesta de vibración háptica nativa.
- **Reto de 20 Días de Adaptación al Frío**:
  - 4 semanas progresivas (15s, 30s, 45s, 60s) con validación diaria.
  - Guía visual para la **Postura del Caballo** (*Kiba Dachi*) para calentar el cuerpo de forma natural.
- **Test de Flexiones en Apnea**:
  - Cronómetro de retención y contador táctil para registrar el récord de flexiones sin aire.
- **Progreso Gamificado e Insignias**:
  - Mapa de calor de 28 días y 10 insignias hexagonales coleccionables (Primer Aliento, Guerrero Polar, Maestro del Frío, etc.).
- **Privacidad y 100% Offline**:
  - Cero telemetría, sin registros en la nube, sin publicidad y exportación/importación de backups JSON.
- **Navegación Fluida Multi-Dispositivo**:
  - Barra inferior de 5 pestañas en móviles (`<768px`) y barra lateral (*Navigation Rail*) en tablets/escritorio (`>=768px`).
  - *Keep-Awake* que mantiene la pantalla activa durante la respiración y bajo el agua.
  - Manejo del botón atrás de Android con confirmación de salida accidental.
- **Multilingüe (7 idiomas)**:
  - Español, inglés, francés, alemán, italiano, portugués y chino simplificado.

---

## 🧩 Arquitectura de 5 Pestañas

| Pestaña | Funcionalidad | Aspectos Destacados |
| :--- | :--- | :--- |
| **Inicio (Hub)** | Panel y Rutinas | Racha combinada, accesos rápidos, checklist de rutina diaria y analítica global. |
| **Respiración** | Bubble Breathing | Hiperventilación rítmica, cronómetro de retención y respiración de recuperación de 15s. |
| **Frío** | HydroCycle y Adaptación | Intervalos calor/frío, ducha libre, baño de hielo y avisos acústicos a 432Hz. |
| **Desafíos** | Reto 20 Días y Flexiones | Calendario de adaptación al frío y test de flexiones en apnea. |
| **Progreso** | Vitalidad y Copia | Calendario térmico, galería de insignias hexagonales y gestión de datos JSON. |

---

## 🛠️ Arquitectura y Stack Tecnológico

- **Estructura Monorepo**: Gestionado con **PNPM Workspaces** y **Git Submodules**, manteniendo sincronizados `Bubble-Breathing` e `Hydrocicle`.
- **Capacitor 8 Android**: Wrapper nativo que genera el proyecto Android Gradle oficial en `android/` (`com.marodriguezd.omega`).
- **CI/CD Automatizado**: Flujo de GitHub Actions ([`.github/workflows/android.yml`](.github/workflows/android.yml)) con OpenJDK 21, Android SDK y Gradle para compilar, probar y publicar `Omega.apk` automáticamente.

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

### Ejecutar Pruebas
```bash
pnpm test
```

### Servidor de Desarrollo Web
```bash
pnpm dev
```

### Compilar y Sincronizar con Android
```bash
pnpm run build
pnpm exec cap sync android
```

---

## 📄 Licencia

Este proyecto es de código abierto bajo la [Licencia MIT](LICENSE).
