# 🌌 Omega - Hub de Respiración Consciente y Adaptación al Frío

<div align="center">
  <img src="public/assets/icon.svg" alt="Logo de Omega" width="128" height="128">
  <h3>Suite de Código Abierto de Respiración Consciente, Frío y Vitalidad para Android</h3>

  [![Build & Release Android APK](https://github.com/marodriguezd/Omega/actions/workflows/android.yml/badge.svg)](https://github.com/marodriguezd/Omega/actions/workflows/android.yml)
  [![Última Versión](https://img.shields.io/github/v/release/marodriguezd/Omega?color=4ca1af&label=Android%20APK)](https://github.com/marodriguezd/Omega/releases/latest)
  [![Capacitor](https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com/)
  [![Hecho con](https://img.shields.io/badge/Hecho%20con-React%2019%20%2B%20Vite%20%2B%20TS-61DAFB?logo=react&logoColor=white)](https://react.dev/)
  [![Licencia: MIT](https://img.shields.io/badge/Licencia-MIT-yellow.svg)](LICENSE)

  [Descripción](#-descripción) • [Descargar APK](#-descargar-e-instalar-en-android) • [Características](#-características) • [Arquitectura 5 Pestañas](#-arquitectura-de-5-pestañas) • [Aviso Legal](#%EF%B8%8F-aviso-legal-y-descargo-de-marcas) • [Licencia](#-licencia)

  **[🇬🇧 Read in English](README.md)**
</div>

---

## 🌟 Descripción

**Omega v1.0** es una aplicación móvil nativa para Android y hub de salud 100% libre e independiente desarrollado con **Capacitor 8**, **React 19** y **Vite**. Omega proporciona un entorno con privacidad total (sin telemetría ni publicidad), combinando respiración consciente profunda, retención en apnea, pautas progresivas de adaptación al agua fría, reto de flexiones en apnea y analítica gamificada:

1. 🌬️ **[Bubble Breathing](https://github.com/marodriguezd/Bubble-Breathing)**: Respiración rítmica guiada, cronómetro de retención pulmonar en vacío y recuperación de 15 segundos con geometría hexagonal redondeada.
2. ❄️ **[HydroCycle](https://github.com/marodriguezd/Hydrocicle)**: Temporizador interactivo de terapia de contraste (frío/calor), ducha fría libre y asistente para baños de hielo.
3. 🧊 **Reto de 20 Días de Ducha Fría**: 4 semanas de progresión gradual (15s a 60s) con avisos acústicos de cuencos tibetanos en 432Hz.
4. 💪 **Test de Flexiones en Apnea**: Medición de resistencia y conteo de flexiones durante la retención sin aire.
5. 📊 **Pantalla de Progreso & Vitalidad**: Calendario de vitalidad de 28 días, 10 insignias hexagonales coleccionables y copia de seguridad JSON sin conexión.

---

## 📱 Descargar e Instalar en Android

Descarga el archivo APK precompilado directamente desde GitHub Releases:

👉 **[Descargar Omega-1.0.0.apk (v1.0.0)](https://github.com/marodriguezd/Omega/releases/download/v1.0.0/Omega-1.0.0.apk)**

**v1.0.0 es la primera versión pública** (las etiquetas anteriores `v1.1.0`–`v1.4.0` fueron compilaciones internas de prueba y no tienen soporte). Las versiones de escritorio de la misma release — `Omega-1.0.0.dmg` (macOS), `Omega-1.0.0.msi` (Windows), `Omega-1.0.0.AppImage` (Linux) — están adjuntas en la [página de la release v1.0.0](https://github.com/marodriguezd/Omega/releases/tag/v1.0.0). Verifica cualquier descarga con el `SHA256SUMS.txt` publicado: `sha256sum -c SHA256SUMS.txt`.

### Pasos de Instalación:
1. Abre el enlace anterior desde el navegador de tu móvil Android y descarga `Omega-1.0.0.apk`.
2. Toca la notificación de descarga o localiza el archivo en tu carpeta de **Descargas**.
3. Si Android te lo solicita, activa la opción **"Permitir desde esta fuente"** para tu navegador o gestor de archivos.
4. Pulsa **Instalar** y ¡abre Omega en tu dispositivo!

---

## ✨ Características

- **Geometría Armónica y Audio Zen 432Hz**:
  - 🔷 **Esfera Hexagonal Redondeada**: SVG con radio curvo (`R=86, cr=14`), anillo perimetral continuo (`pathLength="100"`), diseño glassmorphism y halos de luz.
  - 🎵 **Sintetizador Armónico 432Hz**: Motor Web Audio algorítmico con cuencos tibetanos, campanas zen y vibración háptica táctil en tiempo real sin pistas de audio de terceros.
- **Reto de 20 Días de Adaptación al Frío**:
  - 4 semanas progresivas (15s, 30s, 45s, 60s) con registro diario en el calendario.
  - Guía visual para la postura del caballo (*Kiba Dachi*) para mantener el calor corporal de manera natural.
- **Test de Flexiones en Apnea**:
  - Cronómetro de precisión monotonic sin desfase por suspensión en segundo plano.
- **Progreso Gamificado e Insignias**:
  - Mapa de calor de 28 días y 10 insignias hexagonales coleccionables (Primer Aliento, Guerrero Polar, Maestro del Frío, etc.).
- **Privacidad y 100% Offline**:
  - Cero telemetría, sin registros en la nube, sin publicidad y exportación/importación de backups JSON.
- **Navegación Fluida Multi-Dispositivo**:
  - Barra inferior de 5 pestañas en móviles (`<768px`) y barra lateral (*Navigation Rail*) en tablets/escritorio (`>=768px`).
  - *Keep-Awake* que mantiene la pantalla encendida durante la práctica y bajo la ducha.
  - Gestión del botón atrás de Android con confirmación de salida.
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

## ⚖️ Aviso Legal y Descargo de Marcas

- **Proyecto Independiente**: Omega es un proyecto de software libre independiente y **no está afiliado, patrocinado, respaldado ni oficialmente vinculado** a Wim Hof, Innerfire B.V., ni a ninguna de sus filiales o entidades comerciales.
- **Uso Justo Nominativo**: Cualquier alusión a "Wim Hof", "Método Wim Hof" o términos similares se realiza con carácter estrictamente descriptivo, informativo e histórico (*Nominative Fair Use*), para hacer referencia a las técnicas de respiración consciente e hidroterapia tradicionales.
- **Aviso de Salud y Seguridad**: Las técnicas de hiperventilación, apnea y exposición al agua fría generan efectos fisiológicos intensos. Nunca practiques retención de aire dentro del agua (piscinas, bañeras), conduciendo, de pie o manejando maquinaria. Nunca practiques inmersión en frío en solitario en aguas abiertas; sal del frío y respira con normalidad si sientes mareo, entumecimiento o malestar. Consulta a un médico antes de comenzar si padeces afecciones cardiovasculares, epilepsia o estás en período de embarazo. Estas técnicas no constituyen tratamiento médico.

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

### Clonar y Ejecutar
```bash
git clone --recursive https://github.com/marodriguezd/Omega.git
cd Omega
pnpm install --dangerously-allow-all-builds
pnpm test
pnpm dev
```

---

## 📄 Licencia

Este proyecto es de código abierto bajo la [Licencia MIT](LICENSE).
