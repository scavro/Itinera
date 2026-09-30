# Itinera · cuaderno privado de viajes

Web personal de viajes y cultura, responsive, con temas verde/crema y oscuro. Presupuesto total **por persona**, con total del grupo calculado aparte. El ejemplo de Puglia es ficticio: no acredita horarios, precios ni disponibilidad.

## Fase implementada

Acceso con un único usuario y contraseña, sin registro público. Worker antes de los archivos privados; Better Auth en un Durable Object SQLite, cookies de sesión y D1. Viajes, itinerarios, selecciones y proveedor preferido se guardan en el servidor. La sesión dura dos horas y el cierre la revoca. Un conflicto entre pestañas permite exportar los cambios y cargar la versión guardada.

**Publicado en [itinera.scavro.workers.dev](https://itinera.scavro.workers.dev)**. El propietario confirma que su usuario/contraseña funcionan y que la cuenta usa Workers Free. El Worker delega autenticación y operaciones privadas al coordinador para conservar scrypt dentro de los límites medidos. Sigue pendiente la prueba desde un segundo dispositivo.

Primer módulo de investigación publicado: Tavily para búsqueda/lectura, Gemini u OpenAI como único modelo por trabajo, fuentes y citas, resultados guardados, cancelación, reanudación y cuotas. Las pruebas locales usan proveedores simulados; las claves reales todavía no están configuradas. OpenAI permanece bloqueado para consumo de pago y OpenCode Go pendiente de compatibilidad. La primera lectura de páginas no acredita cobertura completa de agendas ni precios/entradas verificados. Guía: [docs/CONNECTIONS.md](docs/CONNECTIONS.md).

## Ejecutar en el ordenador

Requiere Node.js 24.20 o superior. No basta abrir el frontend de Vite: el acceso se comprueba en el Worker.

```bash
npm ci
umask 077
node -e "console.log('BETTER_AUTH_SECRET='+require('node:crypto').randomBytes(32).toString('hex'))" > .dev.vars
npm run db:local
npm run owner:local
npm run dev
```

Abrir [http://127.0.0.1:8787/](http://127.0.0.1:8787/). `owner:local` pide usuario y contraseña en la terminal, con entrada oculta; no hay credenciales predeterminadas. Ejecutarlo de nuevo cambia el acceso y revoca las sesiones anteriores, conservando los viajes. `.dev.vars` y `.wrangler` están excluidos de Git. No regenerar el secreto al arrancar habitualmente: se crea una sola vez.

`npm run build` compila. `npm run dev:worker` inicia el servidor con los archivos ya compilados. Solo el tema se guarda en localStorage; viajes y claves no. Un cambio pendiente puede perderse al cerrar la pestaña: esperar a «Guardado en el servidor» o exportarlo.

## Cloudflare y GitHub

D1 remota en jurisdicción EU, migración y secreto de sesión ya configurados. El acceso real ya está creado por el propietario. `owner:remote` se reserva para recuperar o cambiar credenciales; no ejecutarlo para arrancar habitualmente. Probar la web desde el móvil. Seguir [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) para la aceptación y la conexión opcional con Workers Builds. El repositorio puede ser público; la contraseña y el secreto nunca se incluyen. No publicar `dist` como un sitio estático independiente: debe servirse a través del Worker protegido.

## Comprobaciones

```bash
npm run typecheck
npm test
npm run build
npm run cf:check
npm run test:integration
npm run format:check
npm run tokens
```

La integración usa D1 aislada, credenciales aleatorias y llamadas externas interceptadas; no necesita cuenta Cloudflare ni claves reales. `node tests/research-browser-server.mjs` abre QA desechable en el puerto 8790 con fuentes/modelo ficticios, sin alterar los viajes locales o remotos. `tests/browser-fixture.mjs` es exclusivamente una utilidad de QA local: sustituye el acceso local por una cuenta desechable, nunca actúa sobre producción.

Alcance y fases: [PLAN.md](PLAN.md). Identidad visual: [DESIGN.md](DESIGN.md). Interacción: [UX-CONTRACT.md](UX-CONTRACT.md). Evidencia y límites: [docs/VERIFICATION.md](docs/VERIFICATION.md).

Las fotografías culinarias tienen [créditos y licencias](public/assets/food/CREDITS.md). No se recomiendan restaurantes. Las visitas mantienen ilustraciones de ejemplo hasta incorporar fotos verificadas de cada lugar. Los destinos nuevos muestran un paisaje genérico de inspiración.
