---
version: alpha
name: Itinera
description: Cuaderno personal de viajes centrado en cultura, patrimonio y descubrimiento.
colors:
  primary: "#244b40"
  background: "#f5f0e6"
  surface: "#fffdf8"
  text: "#25372f"
  muted: "#66726a"
  accent: "#ad713f"
  border: "#dfdfd3"
  danger: "#a63636"
  dark-background: "#14201c"
  dark-surface: "#1d2c25"
  dark-text: "#edf2eb"
  dark-muted: "#abb8ac"
  dark-primary: "#b1cebb"
  dark-border: "#3a4b40"
typography:
  sans:
    fontFamily: "DM Sans, system-ui, sans-serif"
  display:
    fontFamily: "Newsreader, Georgia, serif"
rounded:
  DEFAULT: "0.75rem"
  card: "1.25rem"
spacing:
  page-max: "76rem"
  section-gap: "2rem"
components:
  button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.DEFAULT}"
    height: "44px"
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
---

# Itinera

## Overview

Referencia: cuaderno de un viajero que se detiene a observar un museo. Producto personal en español, para planificar desde portátil y consultar en móvil. Registro de aplicación, con títulos editoriales y controles familiares. Firma visual: arco de doble trazo y paisaje costero ilustrado, evitando fotografías que aparenten documentar una oferta real. No debe parecer una agencia de reservas ni un panel financiero.

Tokens: este documento es la fuente de paleta y tipografía; `scripts/generate-tokens.mjs` genera `src/tokens.css`. Las variables `--color-*` se adaptan a roles `--bg`, `--surface`, `--ink`, `--muted`, `--primary`, `--line` en `src/styles.css`. Todo componente consume esos roles. Las dos tipografías se sirven localmente.

## Colors

Verde bosque para acciones y orientación; fondo crema suave y superficies marfil. El bronce se limita a acentos decorativos. Estado siempre acompañado de texto. Oscuro: verde tinta, superficies tonales y texto claro; el paisaje mantiene sus colores propios. Foco contrastado con contorno de 3 px. Forced colors conserva las preferencias del sistema.

## Typography

Newsreader en títulos; DM Sans en controles y lectura. Cifras tabulares en presupuesto. Español es-ES, calendario gregoriano, fechas sin conversión UTC. Cuerpo 15–16 px y altura 1.55; títulos fluidos 32–46 px. No versales en párrafos.

## Layout

Sidebar de 236 px desde 1100 px, navegación horizontal compacta debajo. Contenido hasta 76 rem. A 700 px, tarjetas, formulario y composición principal pasan a una columna. Scroll vertical del documento; diálogos y la sidebar fija de escritorio pueden desplazarse internamente para mantener accesibles todos los controles en pantallas bajas. Los controles importantes tienen al menos 44 px. Márgenes fluidos 20–44 px, separación de secciones 32 px. Sin tablas en esta versión.

## Elevation & Depth

Superficies quietas con borde suave. Sombra solo en diálogo y aviso flotante. El paisaje tiene profundidad ilustrada. No usar glassmorphism ni degradados de fondo en toda la aplicación.

## Shapes

Controles 12 px, tarjetas 20 px. Píldoras para estados y filtros, no para toda la interfaz. Iconos Lucide de trazo 1.7, 18–22 px. La marca propia usa dos arcos.

## Components

Button, Field, Dialog, Empty y Toast viven en `src/components/ui.tsx`. Hover tonal, foco visible, pulsación breve, disabled con texto explicativo adyacente, error con texto y asociación. El acceso reutiliza Logo, Field y Button, con el paisaje a la izquierda en escritorio y formulario en una columna en móvil. Login, estados de red, sesión y guardado usan texto explícito; no hay falsas barras de progreso. El contraste del texto sobre la parte clara del paisaje utiliza el verde primario. Select y fecha nativos: se acepta geometría y locale del navegador/OS. Diálogo nativo `showModal`, fondo inerte, Escape, restauración de foco. Transición de entrada 180 ms, desactivada con reduced motion. Scrollbars globales con thumb/track/hover/active y fallback WebKit. Datos orientativos siempre identificados; sin restaurantes. En gastronomía se usan fotografías identificadas y acreditadas para que el plato sea reconocible. ResearchPanel comparte comportamiento y lenguaje visual entre Preparar, Cultura y Qué probar: tarjetas con fuentes, cobertura desplegable, progreso real y errores persistentes; retícula adaptable a una columna sin desbordar enlaces.

## Do's and Don'ts

- Mantener el itinerario y sus fuentes por delante de estadísticas ornamentales.
- Usar los mismos estados y acciones en todas las tarjetas culturales.
- El acceso y el guardado son reales. Investigación con enlaces, fragmentos y fechas; distinguir clave configurada, lectura parcial, propuesta generada y comprobación pendiente. No presentar una búsqueda como reserva.
- No usar imágenes de destinos como evidencia de disponibilidad.
