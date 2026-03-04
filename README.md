<!-- spellchecker: disable -->
# README: Deploy y Actualización en Netlify

Este documento explica cómo desplegar y actualizar la aplicación **Generador de Portadas para YouTube** en Netlify.

## Descripción del Proyecto
Aplicación web construida con Next.js para generar thumbnails de partidos de básquetbol. Incluye gestión de equipos, fixtures, preview de thumbnails y descarga automática.

## Requisitos
- Node.js 18+ instalado.
- Cuenta en Netlify (gratuita).
- Git para versionar cambios.

## Configuración Inicial (Primera Vez)
1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Probar localmente**:
   ```bash
   npm run dev
   ```
   Abre `http://localhost:3000` para verificar que funciona.

3. **Autenticar con Netlify**:
   ```bash
   npm install -g netlify-cli
   netlify login
   ```
   Sigue las instrucciones para conectar tu cuenta (abre navegador).

4. **Inicializar sitio en Netlify**:
   ```bash
   netlify init
   ```
   - Selecciona "Create & configure a new site".
   - Elige tu team si tienes.
   - Sitio: deja vacío para autogenerado o ingresa un nombre único.
   - Build command: `npm run build`.
   - Publish directory: `.next`.
   - La configuración en `netlify.toml` se aplica automáticamente.

5. **Deploy inicial**:
   ```bash
   netlify deploy --build --prod
   ```
   Esto construye y despliega a producción. Obtén la URL del sitio (ej. `https://mi-sitio.netlify.app`).

## Actualizaciones (Cambios Posteriores)
Una vez configurado, Netlify detecta cambios automáticamente si conectas un repositorio Git (recomendado). Sigue estos pasos para actualizar:

1. **Hacer cambios en el código**:
   - Edita archivos (ej. `app/page.tsx`, componentes).
   - Prueba localmente con `npm run dev`.

2. **Construir y probar**:
   ```bash
   npm run build
   npm run start  # Prueba el build en local en puerto 3000
   ```

3. **Commit y push a Git**:
   - Si usas GitHub/GitLab:
     ```bash
     git add .
     git commit -m "Descripción de cambios"
     git push origin main  # O la rama principal
     ```
   - Si Netlify está conectado al repo, detecta el push y auto-despliega.

4. **Deploy manual (opcional)**:
   - Si no tienes repo conectado:
     ```bash
     netlify deploy --build --prod
     ```
   - Usa `netlify status` para verificar el deploy.

## Notas Importantes
- **Variables de entorno**: Si agregas APIs o claves, configúralas en Netlify Dashboard > Site Settings > Environment Variables.
- **Build automático**: En Netlify Dashboard, ve a Site Settings > Build & Deploy. Asegúrate de que "Branch deploys" esté en "main" o tu rama principal.
- **Logs**: Revisa builds en Netlify Dashboard > Deploys. Si falla, chequea errores en la consola.
- **Rollback**: En Deploys, puedes restaurar versiones anteriores si algo sale mal.
- **Dominio personalizado**: En Site Settings > Domain Management, agrega tu dominio si tienes uno.

## Troubleshooting
- **Build falla**: Asegúrate de que `netlify.toml` esté en la raíz y `scripts/generate-teams-manifest.mjs` genere `public/teams.manifest.json`.
- **Imágenes no cargan**: Verifica que logos estén en `public/logos-equipos/` y que el manifest se genere correctamente.
- **Errores en producción**: Chequea consola del navegador en la URL de Netlify y logs en Dashboard.

¡Con esto, tu app estará actualizada automáticamente con cada push! Si tienes problemas, revisa los logs en Netlify Dashboard.
