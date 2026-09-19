# 5i MAD · Tarifador de eventos

Herramienta interna de Five Iron Golf Madrid para poner precio a un evento
corporativo en dos minutos, con el margen a la vista.

Usuarios reales: **Lian (GM) e Ismael (F&B)**. No es una app pública.

---

## 1. Antes de tocar nada

**Las tres páginas del sitio tienen origen distinto. No son la misma.**

| Ruta publicada    | Archivo                    | Qué es                |
|-------------------|----------------------------|-----------------------|
| `/`               | `index.html`               | Índice de herramientas |
| `/tarifador`      | `tarifador/index.html`     | La aplicación          |
| `/docs/tarifador` | `docs/tarifador/index.html`| Documento explicativo  |

En septiembre de 2026 se sobrescribió el explicativo copiando la app encima,
y durante seis commits los dos enlaces del índice abrían lo mismo.
**Comprobación obligatoria antes de cada push:**

```bash
grep -o '<title>[^<]*</title>' index.html docs/tarifador/index.html | sort -u
# Herramientas 5i Madrid   /   Cómo funciona el Tarifador 5i
# Si sale "Tarifador de Eventos 5i" en docs/, lo has roto.
```

**El repositorio es PÚBLICO.** Nunca commitear la clave del conector, los IDs
de carpeta de Drive ni ninguna URL `/exec`. `.gitignore` bloquea `*CONFIGURADO*`,
`*_local.*` y `.env`. `apps-script/guardar_propuesta.gs` es la plantilla con
marcadores; la versión rellenada vive solo en el Apps Script de Lian y en su
disco.

---

## 2. Arquitectura

Un solo archivo HTML autocontenido por página. **Sin build, sin dependencias,
sin framework.** Solo las tipografías de Google Fonts. JavaScript ES5 dentro de
un IIFE con `"use strict"`.

Esto es deliberado: la herramienta tiene que abrirse desde un móvil en sala sin
que nadie instale nada, y tiene que seguir funcionando dentro de dos años sin
mantener dependencias. **No introduzcas React, ni bundler, ni npm.**

Despliegue: push a `main` → Vercel redespliega solo (~90 s).
Producción: `https://5i-web.vercel.app/tarifador/`

### Estructura interna de `tarifador/index.html`

```
<style>        paleta en :root, todo el CSS, @media print al final
<div>          formulario vacío + contenedores que rellena el JS
<script>
  BOCADOS[]        54 bocados del Manual Maestro con su coste real
  MENUS{}          los 4 menús cerrados
  T{}              TODOS los parámetros de negocio (ver §3)
  S{}              estado del formulario · S_FABRICA es su copia intacta
  opts(id)         opciones de cada desplegable
  renderForm()     pinta el formulario desde S
  brief()          convierte S en el objeto de cálculo
  variante(b,n)    deriva Esencial (0) y Premium (2) de la Recomendada (1)
  costes(v,pax)    coste por persona + personal
  evaluar(v,p)     suelo, recomendado, catálogo, semáforo
  inclusiones(v)   las líneas de "qué incluye"
  generarTexto()   propuesta en texto plano
  docPropuesta()   propuesta maquetada en HTML para imprimir a PDF
```

---

## 3. El modelo de precio

**No suma tarifa pública línea a línea.** Se probó y daba precios que no se
venden. Calcula el coste real por persona **al mínimo facturable** (nunca al
grupo máximo), le aplica los umbrales de margen y devuelve tres referencias:

- **Suelo** — resultado operativo del 12 % (`RO_MIN`). No bajar de ahí.
- **Recomendado** — resultado operativo del 25 % (`RO_OBJ`). El objetivo.
- **Catálogo** — suma de tarifas publicadas. Es un techo, no un precio.

Los dos primeros se redondean al alza al múltiplo de 5 €.

Todos los parámetros viven en el objeto `T`. **Cambiar un precio es cambiar una
línea de `T`, nunca tocar una fórmula.**

### Procedencia de cada cifra

- **Confirmado por dirección**: golf 39 €/h off-peak y 49 €/h peak; add-on de
  simulador +8 € 1 h y +12 € 2 h; barra abierta 11 €/h básica y 19 €/h prémium;
  food cost objetivo 25 %.
- **Escandallado del Manual Maestro Integral 2026**: los 54 bocados (0,282 € a
  1,014 €), los 4 menús, el coste de consumición (0,38 € y 1,45 €).
  Los datos en crudo están en `datos/`.
- **Pendiente de validar por dirección** — no presentarlo como cerrado:
  - Suplemento por franja `T.franja` = 0 / 5 / 8 / 12 €/pax. **Propuesta, no tarifa.**
  - Coste de los desayunos `costeB1` 4,75 € y `costeB2` 6,00 €. Estimación.
  - Conflicto abierto: el Manual Maestro tarifa la barra a 7 €/h; dirección
    la fijó en 11/19. Hoy conviven las dos cifras en documentos distintos.
  - `RO_OBJ` 25 %: las 8 propuestas reales del catálogo rinden entre 35 % y 58 %
    (mediana 53 %), así que el recomendado se queda ~18 €/pax corto en todas.
    Dirección tiene que elegir el nuevo objetivo.

---

## 4. Git y despliegue

`.claude/settings.json` ya pre-aprueba las operaciones de git, así que puedes
commitear y empujar sin pedir permiso cada vez. Pero **un push a `main` despliega
en producción**, y la usan Lian e Ismael para dar precios a clientes. Así que:

- Commitea a menudo, con mensajes que digan **qué cambió y por qué**, no
  "cambios" ni marcas de tiempo.
- **Empuja solo cuando el cambio esté verificado y completo.** Nunca a mitad de
  un trabajo, nunca sin haber ejecutado la comprobación de §1 y §5.
- Antes de empujar, dile a Lian qué vas a subir.
- `git push --force` y `git reset --hard` están denegados a propósito.

## 5. Reglas de trabajo

**Verifica ejecutando, no leyendo.** Este proyecto ha tenido tres fallos que un
repaso visual del código no habría cogido: un desbordamiento en el PDF, columnas
aplastadas por `table-layout:fixed`, y estado arrastrado entre plantillas.
Playwright está disponible. Para cualquier cambio en cálculo, impresión o PDF:

```bash
node --check <(sed -n '/<script>/,/<\/script>/p' tarifador/index.html)
# y abre la página con Playwright, carga una plantilla y comprueba el número
```

**Prueba las plantillas encadenadas, no una a una.** El fallo de septiembre solo
aparecía al cargar una plantilla después de otra: los campos que la nueva no
declara se arrastraban. `S_FABRICA` lo resuelve; no lo quites.

**Nunca inventes una cifra de negocio.** Si falta un dato, pregúntale a Lian o
márcalo como pendiente de validar. Un número inventado en esta herramienta sale
en una propuesta a un cliente.

**Dos PDF distintos, no los confundas:**
- *Propuesta en PDF* — 9 páginas, para el cliente, fondo claro, portada verde.
- *Imprimir* — el panel interno con costes y márgenes, **fondo negro**, A4
  apaisado, una página. Nunca lo pongas en blanco: fue un fallo explícito.

**Idioma.** Todo de cara al usuario en español de España. Los comentarios del
código, en español y sin tildes (Apps Script se atraganta con algunas).

---

## 6. Identidad de marca

Del documento `5i-Mad. Calendar Protocol v3.0`. Los valores están muestreados
del PDF original, no inventados.

```
--ground  #000000   negro puro, el fondo de la marca
--lime    #B3E428   el acento. NO es el #5FC97F que usó el tarifador al principio
--white   #FFFFFF
--grey    #9AA09E   texto corrido
--faint   #6A706E   pies y leyendas
--rule    #1F1F1F   filetes
```

Categorías: `#77BB4A` `#2D9DD3` `#FF912D` `#AD59D0` `#00C2B4` `#FFD237`
`#82878A` `#E84B8A` `#79D566` `#EB463A`

Grotesca pesada muy apretada en titulares. Monoespaciada en mayúsculas con
tracking ancho para etiquetas. Secciones numeradas `01` `02`. Filas de tabla con
barra de color a la izquierda.

El tarifador sigue con su paleta verde propia por continuidad; los documentos de
presentación usan la de marca.

---

## 7. Conector de Drive

`apps-script/guardar_propuesta.gs` es un Apps Script publicado como aplicación
web. Recibe la propuesta en texto, crea un Google Doc y guarda **el PDF de ese
mismo Doc** en otra carpeta.

**No conviertas el HTML de la propuesta a PDF en Apps Script.** Se intentó con
`Utilities.newBlob(html).getAs('application/pdf')` y el conversor de Google
ignora flexbox, `columns` y `@page`: devuelve un documento roto. El PDF
maquetado de 9 páginas no puede llegar a Drive automáticamente; se saca desde el
diálogo de impresión.

Si cambias el .gs, hay que **republicar**: Implementar → Gestionar
implementaciones → lápiz → Versión: Nueva versión. Guardar no basta.

---

## 8. Lo que falta

1. Recalibrar `RO_OBJ` cuando dirección decida (§3).
2. Hoja de producción de cocina: unidades de cada bocado para N personas, con
   escandallo y alérgenos. Es el paso que convierte esto de calculadora en
   sistema, y los datos ya están en `datos/catalogo.json`.
3. Registro de propuestas emitidas: la hoja existe en Drive y está vacía.
4. Traspaso de GitHub, Vercel y Drive a cuentas corporativas de 5iberia.
