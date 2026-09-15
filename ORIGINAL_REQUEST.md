# Original User Request

## 2026-09-14T10:24:01Z

Rework integral y unificación visual profunda de la interfaz de usuario de Omega (hub de bienestar con Bubble Breathing y HydroCycle) bajo las directrices estéticas de Android 17 / Material Design (Google I/O 2026) con glassmorfismo sutil e inspiración en la app Wim Hof Method, ultra-optimizado para pantallas de alta tasa de refresco (90Hz/120Hz) y con arquitectura multi-plataforma compilable para Android (Capacitor) y PC (Electron). Debe ser una aplicación 100% funcional y lista para producción, sin placeholders ni simulaciones.

Working directory: /data/data/com.termux/files/home/Omega
Integrity mode: development

## Requirements

### R1. Sistema de Diseño Unificado e Integrado (Android 17 / Material Design + Wim Hof + Glassmorfismo)
- Definir y aplicar un sistema de diseño visual unificado para el Hub principal de Omega y las sub-apps integradas (Bubble Breathing y HydroCycle), eliminando incongruencias visuales entre vistas y garantizando paridad de funcionalidades al 100% en producción.
- Incorporar lenguaje de diseño inspirado en Android 17 / Material Design (Google I/O 2026): esquinas redondeadas continuas (squircle), sutil glassmorfismo translúcido (frosted glass / backdrop blur con bordes luminosos tenues), paleta cromática inspirada en la app de Wim Hof Method (tonos glaciar, agua, carbón profundo, contrastes orgánicos suaves para frío/calor).
- Unificar todos los controles de interfaz (botones de acción, selectores, modales, switches, sliders y tipografía) bajo los mismos tokens de diseño compartidos.

### R2. Fluidez y Rendimiento para Altas Tasas de Refresco (90Hz / 120Hz)
- Garantizar que las animaciones críticas (burbuja de respiración rítmica, retención de apnea, temporizadores de terapia de contraste, transiciones entre pestañas y apertura de modales) alcancen una tasa estable de 60/90/120 FPS sin caídas perceptibles ni micro-tirones (jank).
- Las transiciones y animaciones deben apoyarse exclusivamente en propiedades aceleradas por hardware en la GPU (`transform`, `opacity`, `will-change`), eliminando el layout thrashing y los repaints de layouts pesados.

### R3. Experiencia Adaptativa y Responsiva (Móvil vs PC Desktop)
- En dispositivos móviles (Android / viewport estrecho < 768px): navegación ergonómica inferior (Bottom Navigation Bar) con soporte para safe-areas, feedback táctil/háptico y gestos fluidos.
- En pantallas de escritorio (PC / viewport amplio >= 768px): disposición adaptativa mediante Navigation Rail / Sidebar lateral, permitiendo que las tarjetas y módulos de bienestar aprovechen el espacio horizontal de forma equilibrada sin estiramientos deformes.

### R4. Soporte Multiplataforma para Compilación (Android vía Capacitor y PC vía Electron)
- Mantener la compatibilidad y compilación completa del proyecto con Capacitor 8 para Android.
- Incorporar y configurar el entorno de ejecución y empaquetado para escritorio con Electron (scripts de desarrollo y empaquetado para PC, con ventana configurada y adaptada).
- Asegurar que las API nativas y eventos (como Keep-Awake, sincronización y almacenamiento local) funcionen armoniosamente tanto en el entorno móvil Capacitor como en el entorno desktop Electron y en navegador web de forma robusta y tolerante a fallos.

## Acceptance Criteria

### Build & Multiplataforma
- [ ] `npm run build` ejecuta TypeScript sin errores de compilación (`tsc -b`) y empaqueta el bundle con Vite de forma limpia.
- [ ] `npx cap sync android` sincroniza los recursos web con el proyecto Android sin errores de ruta ni assets faltantes.
- [ ] Se incluye la configuración y scripts en `package.json` para ejecutar y empaquetar la aplicación en entorno Electron en PC (`npm run electron:dev` / scripts correspondientes).

### Calidad de Producción y Coherencia de Diseño
- [ ] La aplicación es 100% funcional en producción: todas las características de Bubble Breathing, HydroCycle y el Hub se ejecutan sin regresiones ni marcadores de posición (placeholders).
- [ ] Todas las vistas (Hub, Bubble Breathing, HydroCycle y modales) comparten una identidad visual coherente con estética glassmórfica translúcida y paleta inspirada en Wim Hof / Android 17.
- [ ] No existen componentes desalineados, estilos rotos ni elementos superpuestos en temas oscuro y claro.

### Layout Adaptativo
- [ ] En anchos de pantalla inferiores a 768px, se muestra la barra de navegación inferior adaptada a safe-area móvil.
- [ ] En anchos de pantalla iguales o superiores a 768px, la interfaz conmuta a navegación lateral (rail/sidebar) adaptando el grid de contenido.

### Fluidez y Rendimiento
- [ ] Las animaciones de la esfera/burbuja de respiración y los temporizadores operan mediante aceleración por GPU sin causar layout reflows (`layout shifts`).
- [ ] Las transiciones entre pantallas y modales se ejecutan de manera fluida y continua sin parpadeos ni bloqueos del hilo principal.
