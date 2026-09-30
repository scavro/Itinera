# Despliegue privado en Cloudflare

## Estado

Publicado el 30/09/2026 en [https://itinera.scavro.workers.dev](https://itinera.scavro.workers.dev). D1 `itinera` en jurisdicción EU, esquema y secreto configurados. Autorización Wrangler renovada. La prueba remota usa una cuenta temporal desechable; no hay contraseña predeterminada ni cuenta real creada por el agente.

**Para empezar ahora:** ejecutar `npm run owner:remote` desde la raíz del proyecto. Introducir y confirmar tu contraseña en la terminal, sin enviarla al chat. Entrar en la URL anterior y probar guardado/recarga desde el ordenador y el móvil.

La arquitectura usa Workers Static Assets, Worker, `AuthGate` (Durable Object SQLite) y D1. El Worker filtra origen y sirve recursos públicos del acceso; las páginas, fotos y datos privados pasan por `AuthGate` y la sesión. D1 conserva sesiones y cuaderno. Se emplea HTTP nativo para conservar cookies/cuerpos del handler de Better Auth. Un coordinador por el único propietario; no es un patrón para concentrar tráfico de muchos usuarios. No tiene alarmas ni investigación en segundo plano.

El objetivo es Cloudflare Free; no se ha activado ni cambiado ningún plan. El login inicial consumía 131–132 ms en Worker (Free: 10 ms). Con `AuthGate`, las 17 comprobaciones remotas dieron 0–1 ms en la puerta Worker y 117/129 ms para verificar contraseña en el objeto (límite: 30 s). La contraseña conserva scrypt N=16384/r=16/p=1. Evidencia sanitizada en `qa/cloudflare-remote.json` y `VERIFICATION.md`.

Durable Objects SQLite está disponible en Free con cuotas diarias propias. Esta muestra acredita CPU, no el consumo futuro ni la suscripción de la cuenta: la consulta de facturación OAuth devolvió 403. Confirmar **Workers Free** en el panel, junto con cuotas compartidas con otros proyectos. IA y fuentes externas aún no están conectadas.

## Preparación desde cero (referencia)

Los pasos 1 y 2 ya están aplicados a esta cuenta; no crear otra base ni regenerar el secreto para el uso habitual.

## 1. Cuenta y configuración pública

Desde una terminal en la raíz del proyecto:

```bash
npx wrangler login
npx wrangler whoami
npx wrangler d1 create itinera --jurisdiction eu
```

Seleccionar la cuenta correcta. En `wrangler.jsonc`, dentro de `env.production`, sustituir (en este proyecto ya están configurados):

- `d1_databases[0].database_id`: UUID devuelto al crear D1.
- `vars.APP_ORIGIN`: URL HTTPS exacta de producción, sin barra final, por ejemplo `https://itinera.SUBDOMINIO.workers.dev`. Consultar el subdominio de la cuenta en el panel de Workers. No copiar literalmente el ejemplo.

Estos dos valores no son secretos. El script de despliegue rechaza la configuración de ejemplo. La configuración raíz sigue siendo local y utiliza el UUID cero deliberadamente.

## 2. Base de datos, Worker y secreto

```bash
npm run db:remote
npm run deploy
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))" | npx wrangler secret put BETTER_AUTH_SECRET --env production
npm run owner:remote
```

El primer despliegue queda cerrado con respuesta 503 hasta configurar el secreto. `secret put` despliega una nueva versión inmediatamente. La contraseña de `owner:remote` se introduce y confirma en la terminal, nunca en el chat, GitHub ni un argumento de comando. Mínimo 12 caracteres; se puede usar una frase larga. El alta guarda únicamente su hash en D1. El script no muestra SQL ni respuestas que contengan hashes, y elimina sus archivos temporales.

Para recuperar acceso o cambiar usuario/contraseña: ejecutar `npm run owner:remote` de nuevo. Conserva los viajes y revoca todas las sesiones anteriores. Es administración del propietario; no hay registro público ni correo de recuperación.

## 3. Aceptación del propietario

- Entrar con el usuario propio y probar contraseña incorrecta; no hay datos privados antes de entrar.
- Crear un borrador ficticio, recargar y abrirlo en el móvil u otro ordenador.
- Comprobar que `/api/notebook` y fotos privadas rechazan peticiones sin sesión; rutas alternativas deben quedar rechazadas por el origen.
- Cerrar sesión; recargar, volver atrás y consultar la API debe exigir acceso nuevamente.
- Confirmar cookies HttpOnly/Secure/SameSite, respuestas sin caché y ausencia de contraseñas, claves o tokens de sesión en las respuestas JSON y logs.
- Medir CPU de login correcto/incorrecto, carga y guardado en las métricas de Workers. Revisar cuota D1 y el plan Free de esta cuenta.

Las 17 comprobaciones de API y la prueba en navegador ya están realizadas con datos ficticios. La entrada del propietario y la comprobación con móvil real siguen pendientes. Las pruebas de dos pestañas locales no acreditan acceso entre dispositivos. No hay llamadas a modelos en esta fase.

## 4. GitHub → Workers Builds

El despliegue manual está realizado. **Workers Builds aún no está conectado**: en el Worker `itinera`, Settings → Build, conectar el repositorio `scavro/Itinera` a Workers Builds. Configuración:

| Campo              | Valor                                                       |
| ------------------ | ----------------------------------------------------------- |
| Rama de producción | `main`                                                      |
| Directorio raíz    | `/`                                                         |
| Versión de Node    | 24.20 o superior, configurable con `NODE_VERSION` en Builds |
| Build command      | `npm run build`                                             |
| Deploy command     | `node scripts/deploy.mjs`                                   |
| Worker             | `itinera`                                                   |

El secreto de sesión pertenece al Worker, no al repositorio ni a variables expuestas al frontend. No hay que configurar ninguna API de IA todavía. No habilitar despliegues de ramas de previsualización con datos de producción; el Worker además rechaza hostnames distintos de `APP_ORIGIN`.

Una nueva migración se revisa y aplica expresamente: el deploy automático no modifica el esquema. Los valores públicos reales de producción se guardan en GitHub; el secreto permanece en Cloudflare. Al autorizar la integración GitHub, seleccionar solo `scavro/Itinera` cuando el panel permita limitar repositorios. No crear un proyecto Pages que publique `dist` directamente.

## Copia y recuperación

Las exportaciones de viaje en la interfaz contienen datos personales y de planificación. Son una copia útil del borrador, pero esta fase no tiene un importador web.

Antes de una migración nueva, exportar D1 a una ubicación privada fuera del repositorio:

```bash
umask 077
npx wrangler d1 export itinera --remote --env production --output /RUTA/PRIVADA/itinera-backup.sql
```

Esa copia incluye hashes y sesiones: tratarla como privada, no subirla a GitHub. Para restaurar, crear una D1 nueva, importar la copia mediante `wrangler d1 execute` con `--remote --file`, comprobarla antes de cambiar el binding de producción y revocar las sesiones con `owner:remote`. No importar a ciegas sobre una base con datos; el SQL exportado requiere tablas sin conflicto.

El rollback del código se hace desde Deployments del Worker y conserva D1. No es rollback de datos ni del esquema: verificar compatibilidad de la versión antes de activarla. No volver a un frontend público sin protección.

## Referencias oficiales

- [Workers Static Assets y ejecución del Worker antes de archivos](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/).
- [Secrets en Workers](https://developers.cloudflare.com/workers/configuration/secrets/).
- [Configuración de Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).
- [Límites de Durable Objects](https://developers.cloudflare.com/durable-objects/platform/limits/).
- [Cuotas de Durable Objects Free](https://developers.cloudflare.com/durable-objects/platform/pricing/).
- [Límites de Workers](https://developers.cloudflare.com/workers/platform/limits/).
- [D1: importar y exportar](https://developers.cloudflare.com/d1/best-practices/import-export-data/).
