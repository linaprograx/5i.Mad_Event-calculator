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
  T{}              casi todos los parámetros de negocio (ver §3, hay excepciones)
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

La mayoría de los parámetros viven en el objeto `T`, y la regla es que **cambiar
un precio sea cambiar una línea de `T`, nunca tocar una fórmula.** Hoy hay
excepciones metidas en funciones, que habrá que ir subiendo a `T`:

- `PVP_MENU` (22,73 / 29,09 / 36,36 / 45,45) y `pvpComida()`: desayunos 19 y 24 €,
  food cost 0,25 del menú a medida.
- `precioCatalogo()`: consumición 2,9 y 7,7 €, Welcome Coffee 3,5 €, cóctel 4,1 €.
- `costes()`: ratios de personal (25 / 40 / 40 / 50 pax, anfitrión desde 40,
  técnico desde 4 simuladores, seguridad desde 80), limpieza 2 h, montaje 1,5 h.
- Textos que repiten a mano cifras de `T`: «60 %», «12 %», «120 personas»,
  «40 %», «+8 € 1 h · +12 € 2 h». Si cambias `T`, cambia también el texto.
- El bloque «Cómo calcula y con qué números» del propio HTML repite todas las
  cifras en prosa.

### Procedencia de cada cifra

- **Confirmado por dirección**: golf 39 €/h off-peak y 49 €/h peak; add-on de
  simulador +8 € 1 h y +12 € 2 h; barra abierta 11 €/h básica y 19 €/h prémium;
  food cost objetivo 25 %.
- **Sin procedencia documentada** (no presentarlas como validadas hasta aclararlo):
  coste empresa por hora del personal (`T.ch`), comisión 1,4 %, consumibles
  0,65 €, DJ 300 €, decoración 180 €, Welcome Coffee 1,80 €, cóctel 1,85 €,
  add-on +4 €/h a partir de la segunda hora, y los PVP de `precioCatalogo()`.
- **Escandallado del Manual Maestro Integral 2026**: los 54 bocados (0,282 € a
  1,014 €), los 4 menús, el coste de consumición (0,38 € y 1,45 €).
  Los datos en crudo están en `datos/`.
- **Pendiente de validar por dirección** — no presentarlo como cerrado:
  - Suplemento por franja `T.franja` = 0 / 5 / 8 / 12 €/pax. **Propuesta, no tarifa.**
  - Coste de los desayunos `costeB1` 4,75 € y `costeB2` 6,00 €. Estimación.
  - Conflicto abierto: el Manual Maestro tarifa la barra a 7 €/h; dirección
    la fijó en 11/19. Hoy conviven las dos cifras en documentos distintos.
  - `RO_OBJ` 25 %: las 8 propuestas reales del catálogo rinden entre 35 % y 58 %
    (mediana 53 %). El precio real de la Recomendada supera al recomendado entre
    6 y 41 €/pax según la plantilla (18 € de media).
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
node --check <(sed -n '/^<script>$/,/^<\/script>$/{/^<\/*script>$/!p;}' tarifador/index.html)
# y abre la página con Playwright, carga una plantilla y comprueba el número
```

Ojo: la versión anterior de este comando metía las etiquetas `<script>` en lo
que se comprobaba y fallaba siempre, estuviera bien el código o no.

Playwright se usa con `npx`, sin instalarlo en el proyecto. No hay navegadores
de Playwright descargados: lanza con `chromium.launch({ channel: 'chrome' })`
para usar el Chrome del Mac.

**Prueba las plantillas encadenadas, no una a una.** El fallo de septiembre solo
aparecía al cargar una plantilla después de otra: los campos que la nueva no
declara se arrastraban. `S_FABRICA` lo resuelve; no lo quites.

**Nunca inventes una cifra de negocio.** Si falta un dato, pregúntale a Lian o
márcalo como pendiente de validar. Un número inventado en esta herramienta sale
en una propuesta a un cliente.

**Dos PDF distintos, no los confundas:**
- *Propuesta en PDF* — para el cliente, fondo claro, portada verde. Entre 6 y 9
  páginas: una por cada carta de comida distinta entre las tres opciones.
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
maquetado no puede llegar a Drive automáticamente; se saca desde el
diálogo de impresión.

Si cambias el .gs, hay que **republicar**: Implementar → Gestionar
implementaciones → lápiz → Versión: Nueva versión. Guardar no basta.

---

## 8. Lo que falta

1. Recalibrar `RO_OBJ` cuando dirección decida (§3).
2. Hoja de producción de cocina: unidades de cada bocado para N personas, con
   escandallo y alérgenos. Es el paso que convierte esto de calculadora en
   sistema. **Los datos están a medias** (ver §9): `datos/catalogo.json` tiene
   bocado, tipo, coste y menú, pero no receta con gramos ni alérgenos.
3. Registro de propuestas emitidas: la hoja existe en Drive y está vacía.
4. Traspaso de GitHub, Vercel y Drive a cuentas corporativas de 5iberia.

---

## 9. Estado de los datos de cocina (revisado el 19-09-2026)

- `datos/` coincide con los tres Excel exportados del Manual Maestro (bocados,
  bebidas, materias primas). Los 54 bocados de `BOCADOS[]` coinciden uno a uno
  con `catalogo.json`.
- **Alérgenos: no existen en ningún archivo.** Nunca mostrar «sin alérgenos»:
  mientras no haya dato, se marca como pendiente.
- **Recetas con gramos**: solo existen para los platos de **carta** del
  restaurante, en `Tarifario | 5i MAD | Escandallos y Recetas | MASTER.xlsx`
  (35 fichas, aunque su guía dice 23). **Los bocados de evento no tienen ficha.**
- Problemas en ese MASTER, antes de fiarse de sus cifras:
  - Dos bases de ingredientes que no cuadran: 239 productos en el MASTER y 44
    en el Manual Maestro, con precios distintos (costilla 4,20 frente a 7,50 €/kg).
  - Formatos de compra desplazados en «Base ingredientes» (costilla en
    «Garrafa 1 L», coppa en «Botella 700 ml», jamón cocido a 1,80 €/kg).
  - La merma se aplica dos veces en las fichas; el propio Excel lo avisa.
  - El food cost objetivo va del 20 % al 33 % según el plato, no un 25 % fijo.
