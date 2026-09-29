# Itinera · esqueleto interactivo

Web personal de viajes y cultura. Incluye un viaje **ficticio** a Puglia para probar navegación, formularios, itinerario, preferencias culturales, platos típicos con fotografías reales acreditadas, modo claro/oscuro y vista móvil. El fondo del tema claro es crema. El presupuesto introducido es el **total por persona**; la aplicación calcula aparte el importe conjunto de los viajeros.

## Ejecutar en el ordenador

```bash
npm ci
npm run dev
```

Abrir `http://127.0.0.1:5173/`. Requiere Node.js 20.19 o superior. Para compilar: `npm run build`. El esqueleto no envía datos ni realiza consultas de IA. Los viajes se mantienen únicamente mientras la pestaña siga abierta; «Exportar» descarga un JSON de demostración (`itinera-demo-v2`, importe por persona en céntimos). Una portada nueva muestra un paisaje genérico hasta disponer de una imagen documentada de ese destino.

## Estado real de las conexiones

Pendientes: acceso privado con un único usuario y contraseña propios, D1, Worker, APIs de IA, buscador y fuentes de precios/agenda. La selección OpenAI/Gemini/OpenCode Go en Ajustes es una preferencia temporal, sin claves ni llamadas. OpenCode Go requiere confirmar que el servicio permite usarlo para viajes. El despliegue público de este front sin autenticación expondría los datos de ejemplo y no cumpliría el requisito de privacidad; no hay configuración de despliegue activa. La siguiente fase preparará Worker, login y persistencia antes de conectar GitHub con Workers Builds.

El alcance acordado y las fases siguientes están en [PLAN.md](PLAN.md). La identidad visual está en [DESIGN.md](DESIGN.md), las decisiones de interacción en [UX-CONTRACT.md](UX-CONTRACT.md) y las verificaciones en [docs/VERIFICATION.md](docs/VERIFICATION.md).

Las fotografías culinarias del ejemplo tienen [créditos y licencias](public/assets/food/CREDITS.md). Para visitas y monumentos, las ilustraciones de esta demo se sustituirán por fotografías identificadas del lugar en la fase de investigación de fuentes.
