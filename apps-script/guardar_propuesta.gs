/**
 * ============================================================
 * 5i · CONECTOR DE PROPUESTAS A DRIVE
 * Recibe una propuesta desde el tarifador y deja dos archivos:
 *   · Google Doc con el texto  -> carpeta de documentos
 *   · PDF de ese mismo Doc     -> carpeta de PDF
 *
 * El PDF se genera exportando el propio documento. No se
 * convierte HTML: el conversor de HTML de Google no entiende
 * maquetacion moderna y devolveria un PDF roto.
 * ------------------------------------------------------------
 * INSTALACION
 *
 * 1. Crea en Drive las dos carpetas y copia el ID de cada una
 *    de su URL (el trozo largo despues de /folders/).
 *    Crea el script CON LA MISMA CUENTA dueña de las carpetas.
 *
 * 2. script.google.com > Nuevo proyecto. Borra todo y pega
 *    este archivo. Rellena las tres constantes de abajo.
 *
 * 3. Ejecuta PROBAR_TODO y autoriza. En la pantalla "Google no
 *    ha verificado esta aplicacion": Configuracion avanzada >
 *    Ir a ... (no seguro) > Permitir.
 *    El registro tiene que poner TODO CORRECTO.
 *
 * 4. Implementar > Nueva implementacion > Aplicacion web,
 *    Ejecutar como: Yo, Acceso: Cualquier persona.
 *    Copia la URL que termina en /exec.
 *
 * 5. Pega esa URL y la clave en el tarifador, en
 *    "Conexion con Google Drive".
 *
 * Si cambias este codigo, republica: Implementar > Gestionar
 * implementaciones > lapiz > Version: Nueva version.
 * Si no, Google sigue ejecutando el codigo viejo.
 *
 * NUNCA subas este archivo con los IDs y la clave rellenados.
 * Este repositorio es publico.
 * ============================================================
 */

var CARPETA_DOCS = 'PEGA_AQUI_EL_ID_DE_LA_CARPETA_DE_DOCUMENTOS';
var CARPETA_PDF  = 'PEGA_AQUI_EL_ID_DE_LA_CARPETA_DE_PDF';
var CLAVE        = 'PEGA_AQUI_UNA_CLAVE_LARGA_INVENTADA';

var VERDE  = '#2F6B43';
var TINTA  = '#12211A';
var GRIS   = '#5C6E64';


/* ============ lo que llama el tarifador ============ */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) return json({ ok:false, error:'sin datos' });

    var d = JSON.parse(e.postData.contents);
    if (String(d.token) !== CLAVE) return json({ ok:false, error:'clave incorrecta' });

    var texto = String(d.texto || '').trim();
    if (!texto) return json({ ok:false, error:'propuesta vacia' });

    var r = guardar(String(d.nombre || 'Propuesta 5i').substring(0, 180), texto);
    return json(r);

  } catch (err) {
    return json({ ok:false, error:String(err) });
  }
}

/* Crea el Doc, lo mete en su carpeta y guarda su PDF en la otra.
   El PDF sale del propio documento, que es la via fiable: lo
   genera Google con su exportador de Docs, no un conversor de
   HTML. */
function guardar(nombre, texto) {
  var doc  = DocumentApp.create(nombre);
  var body = doc.getBody();
  body.setMarginTop(56).setMarginBottom(56).setMarginLeft(56).setMarginRight(56);

  var lineas = texto.split('\n');
  var primera = true;

  /* devuelve la siguiente linea con contenido, para saber si la
     actual es el encabezado de una lista (Bocados frios, Dulces...) */
  function siguiente(desde) {
    for (var k = desde + 1; k < lineas.length; k++) {
      var t = lineas[k].trim();
      if (t !== '') return t;
    }
    return '';
  }

  for (var i = 0; i < lineas.length; i++) {
    var linea = lineas[i];
    var limpia = linea.trim();

    if (limpia === '') { body.appendParagraph(''); continue; }

    /* vinetas: las lineas que empiezan por · */
    if (limpia.indexOf('· ') === 0) {
      var li = body.appendListItem(limpia.substring(2));
      li.setGlyphType(DocumentApp.GlyphType.BULLET);
      li.setAttributes(estilo(11, TINTA, false));
      continue;
    }

    var p = body.appendParagraph(limpia);

    if (primera) {
      p.setHeading(DocumentApp.ParagraphHeading.TITLE);
      p.setAttributes(estilo(22, VERDE, true));
      primera = false;
      continue;
    }

    /* todo en mayusculas = seccion o subtitulo */
    var mayus = limpia.length > 2 && limpia === limpia.toUpperCase() &&
                /[A-ZÁÉÍÓÚÑ]/.test(limpia);

    /* encabezado de lista: corto, sin punto final y seguido de vinetas */
    var abreLista = !mayus && limpia.length < 42 &&
                    limpia.charAt(limpia.length - 1) !== '.' &&
                    siguiente(i).indexOf('· ') === 0;

    if (mayus && limpia.indexOf('·') > -1) {
      /* PROPUESTA · RECOMENDADA, justo debajo del titulo */
      p.setHeading(DocumentApp.ParagraphHeading.HEADING3);
      p.setAttributes(estilo(13, GRIS, true));
    } else if (mayus) {
      p.setHeading(DocumentApp.ParagraphHeading.HEADING2);
      p.setAttributes(estilo(13, VERDE, true));
    } else if (abreLista) {
      p.setHeading(DocumentApp.ParagraphHeading.HEADING4);
      p.setAttributes(estilo(11, VERDE, true));
    } else if (limpia.indexOf('€ por persona') > -1 || limpia.indexOf('Precio final') === 0) {
      p.setAttributes(estilo(12, TINTA, true));
    } else if (limpia.indexOf('events@') === 0) {
      p.setAttributes(estilo(10, GRIS, false));
    } else {
      p.setAttributes(estilo(11, TINTA, false));
    }
  }

  /* quitar el parrafo vacio que Google mete al crear el documento */
  if (body.getNumChildren() > 1) {
    var c0 = body.getChild(0);
    if (c0.getType() === DocumentApp.ElementType.PARAGRAPH &&
        c0.asParagraph().getText() === '') {
      body.removeChild(c0);
    }
  }

  doc.saveAndClose();

  var archivo = DriveApp.getFileById(doc.getId());
  archivo.moveTo(DriveApp.getFolderById(CARPETA_DOCS));

  var salida = { ok:true, url:doc.getUrl(), nombre:nombre };

  try {
    var pdf = archivo.getAs('application/pdf').setName(nombre + '.pdf');
    salida.pdf = DriveApp.getFolderById(CARPETA_PDF).createFile(pdf).getUrl();
  } catch (errPdf) {
    salida.pdfError = String(errPdf);
  }

  return salida;
}

function estilo(tam, color, negrita) {
  var a = {};
  a[DocumentApp.Attribute.FONT_SIZE]       = tam;
  a[DocumentApp.Attribute.FOREGROUND_COLOR] = color;
  a[DocumentApp.Attribute.BOLD]            = !!negrita;
  a[DocumentApp.Attribute.FONT_FAMILY]     = 'Verdana';
  return a;
}

function doGet() {
  return ContentService.createTextOutput(
    'Conector de propuestas 5i activo. Solo acepta POST desde el tarifador.'
  );
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


/* ============ la unica prueba que necesitas ============ */
/**
 * Comprueba las dos carpetas y hace un guardado real de prueba.
 * Si termina con TODO CORRECTO, el conector funciona y ya puedes
 * publicarlo. Borra a mano los dos archivos de prueba despues.
 */
function PROBAR_TODO() {
  var fallos = [];

  var nDocs = '', nPdf = '';
  try {
    var cd = DriveApp.getFolderById(CARPETA_DOCS);
    nDocs = cd.getName();
    Logger.log('1/3  Carpeta de documentos OK: ' + nDocs);
  } catch (e) {
    fallos.push('No encuentro la carpeta de DOCUMENTOS (' + CARPETA_DOCS + '). ' +
                'Casi seguro: has creado el script con otra cuenta de Google. ' +
                'Detalle: ' + e);
  }

  try {
    var cp = DriveApp.getFolderById(CARPETA_PDF);
    nPdf = cp.getName();
    Logger.log('2/3  Carpeta de PDF OK: ' + nPdf);
  } catch (e) {
    fallos.push('No encuentro la carpeta de PDF (' + CARPETA_PDF + '). ' +
                'Misma causa probable que la anterior. Detalle: ' + e);
  }

  if (fallos.length) {
    Logger.log('');
    Logger.log('ERROR. No sigas hasta arreglar esto:');
    fallos.forEach(function (f, i) { Logger.log('  ' + (i + 1) + '. ' + f); });
    return;
  }

  try {
    var r = guardar('PRUEBA 5i · borrar', [
      'FIVE IRON GOLF MADRID',
      '',
      'PROPUESTA DE PRUEBA',
      '60 € por persona',
      '',
      'INCLUYE',
      '· Si ves este documento, el conector funciona',
      '· Y si ves tambien el PDF, la exportacion funciona',
      '',
      'events@5iberia.com'
    ].join('\n'));

    Logger.log('3/3  Guardado de prueba OK');
    Logger.log('');
    Logger.log('TODO CORRECTO');
    Logger.log('  Documento: ' + r.url);
    Logger.log('  PDF:       ' + (r.pdf || 'NO se ha creado -> ' + r.pdfError));
    Logger.log('');
    Logger.log('Ya puedes publicar: Implementar > Nueva implementacion.');
    Logger.log('Borra a mano los dos archivos de prueba cuando quieras.');
  } catch (e) {
    Logger.log('ERROR al guardar la prueba: ' + e);
  }
}
