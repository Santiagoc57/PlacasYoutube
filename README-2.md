# README 2: Solución de parseo de ligas y equipos

## Objetivo
- Procesar bloques de texto con múltiples ligas en un solo pegado.
- Tratar las líneas de liga como encabezados/contexto y no como partidos.
- Desambiguar correctamente "Unión" (Santa Fe) vs. "La Unión" (Formosa).

## Cambios clave
- **[encabezados de liga]** `lib/parse-fixtures.ts`
  - Una línea sin separadores ("vs", guiones, coma o tab) se interpreta como encabezado de liga.
  - Se detecta la liga por:
    - Coincidencia exacta de nombre normalizado.
    - Palabras clave prioritarias: "femenina" → LF, "nacional" → LN, "argentina" → LA.
    - Prefijo: si el encabezado es prefijo del nombre (p.ej. "Liga Nacional" → "Liga Nacional Playoffs").
  - Se asigna `currentLeague` y `currentLeagueType` y se marca la línea con `isHeader: true` para que la UI no muestre formulario manual.

- **[no mezclar encabezado con trailing]**
  - `extractTrailingLeagueFromLine()` solo corre para líneas de partido. Antes se ejecutaba también en encabezados y vaciaba la línea.

- **[default sin contaminar contexto]**
  - Si un partido cae en liga por defecto (LN) no sobreescribimos `currentLeague` para no romper encabezados posteriores.

- **[códigos de liga]**
  - `extractLeagueCodes()` ahora es case-sensitive y solo reconoce `LN/LF/LA` en mayúsculas. Evita confundir la palabra "La" de "La Unión" con `LA`.

- **[normalización robusta]** `normalizeName()`
  - Preserva la palabra `liga` siempre.
  - Preserva `la` cuando va antes de `union` para distinguir `La Unión` vs `Unión`.
  - Mantiene espacios entre tokens (p.ej. "liga nacional").

- **[desambiguación Unión]** `resolveTeam()`
  - `"Unión"` → busca `"Union SF" | "Union Santa Fe"`.
  - `"La Unión"` → busca `"La Union" | "Formosa"`.

- **[limpieza de tokens de equipos]**
  - Se recortan puntuaciones/espacios extra al inicio/fin (`". Unión"` → `"Unión"`).

- **[UI]** `components/fixture-generator.tsx`
  - Oculta el formulario manual para líneas marcadas con `isHeader: true`.
  - Inicializa selecciones manuales solo para líneas de partido.

## Archivos modificados
- `lib/parse-fixtures.ts`: detección de encabezados, trailing, default league, códigos `LN/LF/LA` case-sensitive, normalización, desambiguación Unión, logs de depuración.
- `components/fixture-generator.tsx`: salto de UI para encabezados y precarga de selecciones manuales.
- `lib/utils.ts`: mapas de logos coherentes (sin cambios funcionales para esta corrección).

## Ejemplo de uso (funcional)
Pegar:
```
Liga Nacional
Peñarol vs. La Unión
San Martín vs. Unión

Liga Femenina
Lanús vs. El Biguá
El Talar vs. Rocamora
Ferro vs. Rocamora
Náutico vs. Quimsa
San José vs. Instituto
```
Resultado esperado:
- Líneas 2–3 → Liga Nacional.
- Líneas 5–9 → Liga Femenina.
- "Unión" → `Union SF`.
- "La Unión" → `La Union` (Formosa).

## Troubleshooting
- **Todos los partidos quedan en LN**: verifica que el encabezado siguiente sea reconocido (consola muestra `[DEBUG] Encabezado "Liga Femenina" → ... (tipo: LF)`). Si no, revisa la escritura exacta o acentos.
- **No reconoce "Unión"**: revisa que exista `"Union SF"` en `public/teams.manifest.json` y que no haya puntuación pegada (el recorte ya lo maneja `cleanToken`).
- **Cambios no reflejados**: reinicia dev server y limpia `.next`.

## Notas de depuración
- Logs `[DEBUG]` muestran:
  - Texto de encabezado antes/después de normalizar.
  - Liga detectada para el encabezado.
  - Fuente de la liga por partido (current/inline/default).

## Checklist rápida de verificación
- **Encabezados**: se muestran como "Liga seleccionada: …" y sin formulario manual.
- **Partidos**: se agregan con la liga indicada por el encabezado activo.
- **Unión vs La Unión**: se resuelven a equipos distintos.
- **Descarga**: prefijo de archivo LN/LF correcto según liga.

