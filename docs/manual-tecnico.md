# TARIFADOR DE EVENTOS 5i — MANUAL TÉCNICO INTERNO
Documento para Lian. Cómo está montado, cómo se relaciona con el Excel/Sheet de escandallos,
y cómo cambiar cualquier cosa sin romperlo.

Última revisión: septiembre 2026


## 1. LAS PIEZAS Y DÓNDE VIVE CADA UNA

Hay tres piezas y es importante no confundir sus papeles.

PIEZA 1 — El libro de escandallos (Google Sheets)
  Nombre: CALCULADORA_EVENTOS_FIVE_IRON_MADRID
  17 pestañas. Es la FUENTE DE VERDAD del coste de materia prima y la auditoría.
  Ahí vive la trazabilidad completa: precio de compra de cada ingrediente (20_INGREDIENTES),
  fichas técnicas por plato (21_FICHAS_TECNICAS), escandallos de carta (22_ESCANDALLOS),
  y los parámetros del sistema (01_CONFIGURACION_MAESTRA).
  NO se usa para poner precio a un evento en caliente. Es demasiado lento y pesado.

PIEZA 2 — El tarifador (archivo HTML)
  Un solo archivo autocontenido: HTML + CSS + JavaScript, sin dependencias externas
  salvo las tipografías de Google Fonts.
  Lleva DENTRO una copia resumida de los costes, no lee el Sheet en vivo.
  Es la herramienta de uso diario.

PIEZA 3 — El documento explicativo (archivo HTML)
  Página para enseñar a terceros qué hace la herramienta y con qué lógica.
  No tiene lógica de cálculo, es solo texto.


## 2. CÓMO SE RELACIONAN

La relación es de UNA DIRECCIÓN y es manual, a propósito:

  Sheet de escandallos  --->  (copia manual de constantes)  --->  HTML del tarifador

El tarifador NO se conecta al Sheet. Razones:
  - Un HTML estático no puede leer un Google Sheet privado sin publicar el Sheet
    o montar credenciales. Publicar el Sheet expondría los costes de compra.
  - Si el Sheet se cae, se renombra o alguien mueve una fila, el tarifador seguiría
    funcionando igual. Esto es una ventaja, no una limitación.
  - Las constantes cambian dos o tres veces al año. No justifica una integración.

Lo que SÍ hay que hacer: cuando el Sheet actualice un coste real, copiarlo a mano
al HTML. Son diez constantes. Tarda dos minutos. El apartado 4 dice exactamente cómo.


## 3. DÓNDE ESTÁ CADA NÚMERO DENTRO DEL HTML

Abre el archivo con cualquier editor de texto. Busca la línea que empieza por `var T = {`.
Ese objeto `T` es el panel de control completo. Todo lo económico está ahí y en ningún
otro sitio. No hay números sueltos escondidos en las fórmulas.

Contenido de T:

  golfOff: 39            tarifa pública del simulador en off-peak, €/hora
  golfPeak: 49           tarifa pública del simulador en peak, €/hora

  costePase: 1.09        coste de materia prima de un pase de cóctel, por persona
  costeWCoffee: 1.80     coste del Welcome Coffee por persona
  costeWCoctel: 1.85     coste del cóctel de bienvenida por persona
  costeB1: 4.75          coste del Breakfast Experience por persona
  costeB2: 6.00          coste del Five Iron Breakfast por persona
  costeCons: [0, 1.35, 1.85]
                         coste por consumición. Posición 1 = cerveza/vino/refresco.
                         Posición 2 = premium con destilados. La posición 0 no se usa.

  curva: [2.5, 2.0, 1.5, 1.2]
                         consumiciones por persona en la hora 1, 2, 3 y siguientes
                         de barra abierta. Solo afecta al COSTE, nunca al precio.

  consumible: 0.65       servilletas, vasos, hielo, etc., por persona
  comision: 0.014        comisión de medios de pago sobre el importe con IVA

  costeDJ: 300           coste directo de contratar DJ, fijo por evento
  costeDec: 180          coste directo de decoración temática, fijo por evento

  ch: { sala:18, barra:18, cocina:20, anfitrion:16,
        tecnico:25, seguridad:22, limpieza:16 }
                         coste EMPRESA por hora de cada rol. No es el salario bruto.

  RO_MIN: 0.12           resultado operativo mínimo. Por debajo, la oferta se BLOQUEA.
  RO_OBJ: 0.25           resultado operativo objetivo. Define el precio RECOMENDADO.
  MC_MIN: 0.60           margen de contribución mínimo. Por debajo, se BLOQUEA.
  DTO_MAX: 10            descuento máximo en % sin aprobación de dirección
  AFORO: 120             aforo del local
  PAX_BAY: 6             personas cómodas por simulador
  BLOQUEO_MAX: 0.40      % máximo de la factura que puede representar el valor
                         de bloqueo de los simuladores antes de avisar

  addon1h: 8             add-on de simulador por persona, 1 hora
  addon2h: 12            add-on de simulador por persona, 2 horas
  addonHoraExtra: 4      incremento por cada hora adicional a partir de la segunda

Ratios de personal: NO están en T, están dentro de la función `costes()`.
Busca las líneas con `Math.ceil(pax/25)` y similares. El 25 es "un camarero cada
25 personas". Los demás: barra cada 40, cocina cada 40, anfitrión desde 40,
técnico con 4 simuladores o más, seguridad desde 80, limpieza una cada 50.
Las horas de personal son `v.horas + 1.5` (el 1.5 es montaje y desmontaje).

Franjas peak/off-peak: en la función `repartoGolf()`. La variable `frontera` vale
16 los viernes y 20 de lunes a jueves. Sábado y domingo devuelven todo peak.


## 4. CÓMO CAMBIAR UN COSTE CUANDO EL SHEET TENGA EL DATO REAL

Los costes marcados como "derivados" están calculados así:

  coste = PVP neto de carta × objetivo de food cost

Ejemplo del pase de cóctel:
  PVP con IVA 4,80 € → neto = 4,80 / 1,10 = 4,36 €
  objetivo de food cost en eventos = 25 %
  coste = 4,36 × 0,25 = 1,09 €

Cuando la pestaña 21_FICHAS_TECNICAS del Sheet tenga cerrada la ficha real de los
pases de evento, el coste real sustituye a ese 1,09. Procedimiento:

  1. En el Sheet, saca el coste de materia prima por ración del pase de evento.
  2. Abre el HTML en un editor de texto.
  3. Busca `costePase: 1.09` y cambia el número. Usa PUNTO decimal, no coma.
  4. Guarda.
  5. Vuelve a desplegar (apartado 7).

Lo mismo para los desayunos (costeB1, costeB2) y las consumiciones (costeCons).

IMPORTANTE: los números del código van SIEMPRE con punto decimal. `1.09`, no `1,09`.
Si pones coma, el archivo deja de funcionar entero. Es el error más fácil de cometer.


## 5. CÓMO AÑADIR O EDITAR UNA PLANTILLA DE PROPUESTA

Busca `var PLANTILLAS = [`. Cada entrada tiene esta forma:

  { n:'Nombre que sale en el desplegable',
    p:['55','60','75'],          precios base de Esencial, Recomendada y Premium
    c:{ ...configuración... } }

Los campos de `c` son los mismos identificadores que usa el estado `S`. Los valores
van SIEMPRE entre comillas para los desplegables, y true/false sin comillas para las
casillas. Copia una entrada existente y modifícala; es más seguro que escribirla nueva.

Campos disponibles en `c`:
  cliente, paxmin, paxmax, paxfac, horas, dia ('LJ'/'V'/'SD'), inicio ('18:00'),
  bays, baysh, excl ('0'/'1'/'2'), simcobro ('0' incluido / '1' add-on),
  f1, dardos, tour, coord, equipos, lounge, av  (true/false),
  musica ('0' ambiente / '1' DJ), dec (true/false),
  comida ('0' sin comida / 'c' pases / 'b1' Breakfast Experience / 'b2' Five Iron Breakfast),
  pases, wcoffee, wcoctel, modal ('0'/'1'/'2'), btipo ('1'/'2'), bcant

Si añades una plantilla nueva, aparece sola en el desplegable. No hay que tocar nada más.


## 6. CÓMO AÑADIR UN CAMPO NUEVO AL FORMULARIO

Hay que tocar cuatro sitios, siempre en este orden:

  1. `opts(id)` — añade un `case 'miCampo': return [...]` con las opciones.
  2. `var S = {` — añade `miCampo:'valorPorDefecto',`.
  3. `renderForm()` — añade `campo('miCampo', 'Etiqueta visible')` en el grupo que toque.
  4. `brief()` — añade `miCampo: S.miCampo,` para que llegue al motor.

Si el campo debe admitir valor propio, añádelo también al objeto `LIBRES` indicando
el tipo: 'texto', 'hora', 'entero' o 'decimal'.

Si el campo afecta al coste, tócalo en `costes()`. Si afecta a lo que se escribe en
la propuesta, en `inclusiones()`. Si debe moverse entre Esencial y Premium, en `variante()`.


## 7. DESPLIEGUE EN VERCEL

Estructura de carpetas recomendada. Crea una carpeta en tu ordenador llamada `5i-web`:

  5i-web/
    index.html                    portada con enlaces a las herramientas
    tarifador/index.html          el tarifador de eventos
    docs/tarifador/index.html     el documento explicativo

Con esa estructura, las URLs salen limpias:
  tudominio.vercel.app/tarifador
  tudominio.vercel.app/docs/tarifador

Primer despliegue:
  Opción A (sin terminal): entra en vercel.com, "Add New Project", arrastra la carpeta
  `5i-web` completa. Vercel detecta que es un sitio estático y publica. No hace falta
  configurar nada: sin framework, sin build command, sin output directory.

  Opción B (con Git): sube `5i-web` a un repositorio de GitHub e impórtalo en Vercel.
  Esta es la buena a medio plazo: cada vez que subas un cambio al repo, Vercel
  vuelve a publicar solo.

Actualizar después de cambiar un número:
  - Con la opción A: vuelves a arrastrar la carpeta. Vercel crea un despliegue nuevo.
  - Con la opción B: `git commit` y `git push`. Se publica solo en un minuto.

Dominio propio: en el proyecto de Vercel, Settings → Domains. Si quieres algo tipo
eventos.tudominio.com, hay que añadir un registro CNAME en el DNS del dominio.


## 8. GOOGLE DRIVE

Aviso importante: Drive NO ejecuta HTML. Si subes el archivo y haces doble clic, te lo
descarga en vez de abrirlo. Drive sirve como ARCHIVO Y COPIA DE SEGURIDAD, no como
lugar de uso.

Estructura sugerida dentro de 5I SYSTEM GERENCIA:

  07 Sistemas, datos y activos/
    Herramientas web/
      tarifador-eventos/
        tarifador_5i_v6.html                   versión publicada
        tarifador_5i_manual_tecnico.md         este documento
        como_funciona_tarifador.html           documento explicativo
        historico/
          tarifador_5i_v5.html                 versiones anteriores

Regla: cada vez que cambies algo y lo despliegues, sube el HTML a Drive con número de
versión nuevo y mueve el anterior a `historico/`. Así siempre puedes volver atrás.
Nunca sobreescribas el archivo publicado sin guardar el anterior.

En el Sheet de escandallos, en la pestaña 11_CONTROL, conviene añadir una línea que
diga qué versión del tarifador está publicada y con qué fecha. Es el único puente
entre las dos piezas, y si no existe nadie sabrá si el HTML está al día.


## 9. QUÉ REVISAR Y CUÁNDO

Cada vez que cambien las tarifas públicas:
  golfOff, golfPeak, addon1h, addon2h. Son las tarifas de cara al cliente.

Cada vez que se revise el convenio o suba el coste de personal:
  el objeto `ch`.

Cada trimestre, o cuando el Sheet cierre fichas técnicas nuevas:
  costePase, costeB1, costeB2, costeCons.

Cuando dirección revise los umbrales de rentabilidad:
  RO_MIN, RO_OBJ, MC_MIN, DTO_MAX, BLOQUEO_MAX.

Una vez, con la asesoría, y dejarlo por escrito:
  el tratamiento del IVA cuando el alquiler de espacio va empaquetado con servicio de
  hostelería. Hasta entonces el tarifador aplica los tipos generales y sirve para
  presupuestar, no para facturar.

Después de dos o tres eventos reales cerrados:
  comparar lo que el tarifador dijo que dejaría el evento con lo que dejó de verdad.
  Si se desvía más de un 10 %, el sospechoso más probable es la curva de consumo de
  barra (`curva`) o los ratios de personal.


## 10. LO QUE NO HAY QUE TOCAR

  - Las funciones `evaluar()`, `escenario()` y `suelo()`. Son el motor. Si hay que
    cambiar la lógica económica, mejor pedirlo que improvisar ahí.
  - El bloque `LIBRES`, salvo para añadir campos nuevos.
  - La estructura `selHTML()` / `campo()`. Todo el formulario se genera desde ahí;
    un cambio mal hecho deja la página en blanco.

Si la página aparece en blanco después de un cambio, el 95 % de las veces es una coma
fuera de sitio, una comilla sin cerrar, o un número escrito con coma decimal. Abre la
consola del navegador (clic derecho → Inspeccionar → Console) y te dirá la línea exacta.

Antes de tocar nada, guarda una copia del archivo. Siempre.


## 11. LIMITACIONES CONOCIDAS

  - Las opciones que se añaden con "Otro…" se guardan en el navegador de quien las
    escribe, no en la herramienta. No se comparten entre usuarios. Para que fueran
    compartidas haría falta darle a la página una base de datos propia.
  - El tarifador no guarda historial de presupuestos. Cada vez que se abre, empieza
    de cero. Si hace falta un registro de lo presupuestado, es otra pieza.
  - No incluye alquiler ni estructura. Lo que dice que "deja" un evento es lo que
    queda después de producto y personal, antes de la casa.
  - El add-on de simuladores para duraciones distintas de 1 h y 2 h es una
    extrapolación de esos dos datos, no un precio confirmado por dirección.
