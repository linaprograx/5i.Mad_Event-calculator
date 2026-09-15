/**
 * ============================================================
 * 5i · CONECTOR DE PROPUESTAS A DRIVE
 * Recibe una propuesta desde el tarifador y deja dos archivos
 * en tu Drive de una sola vez:
 *   · el Google Doc editable con el texto      -> carpeta DOCS
 *   · el PDF maquetado con las tres opciones   -> carpeta PDF
 * ------------------------------------------------------------
 * INSTALACION (una sola vez, cinco minutos)
 *
 * 1. En Drive, crea las DOS carpetas: una para los documentos y
 *    otra dentro para los PDF. Abre cada una y copia su ID de la
 *    URL. El ID es el trozo largo despues de /folders/ :
 *      drive.google.com/drive/folders/1AbCdEfGhIjK...
 *                                     ^^^^^^^^^^^^^^ esto
 *    IMPORTANTE: crea el script con LA MISMA CUENTA de Google
 *    que es duena de esas carpetas, o no las encontrara.
 *
 * 2. Ve a script.google.com > Nuevo proyecto.
 *    Borra todo y pega este archivo.
 *
 * 3. Rellena las tres constantes de abajo. La CLAVE inventatela:
 *    una frase larga sin espacios. Es la que tendras que pegar
 *    tambien en el tarifador.
 *
 * 4. Ejecuta PROBAR_CARPETAS y autoriza cuando lo pida. En el
 *    registro deben salir los nombres de las dos carpetas.
 *
 * 5. Implementar > Nueva implementacion.
 *      Tipo: Aplicacion web
 *      Ejecutar como: Yo
 *      Quien tiene acceso: Cualquier persona
 *    Implementar. Copia la URL que termina en /exec.
 *
 * 6. En el tarifador, abre "Conexion con Google Drive" y pega
 *    la URL y la clave. Listo.
 *
 * SOBRE LA SEGURIDAD: la implementacion es publica porque el
 * navegador tiene que poder llamarla sin iniciar sesion, pero
 * solo hace una cosa (crear los archivos en esas carpetas) y
 * exige la clave. Si alguna vez sospechas que la URL se ha
 * filtrado, cambia la CLAVE aqui y en el tarifador, o crea una
 * implementacion nueva y descarta la anterior.
 *
 * NUNCA subas a GitHub este archivo con los IDs y la clave
 * rellenados. Este repositorio es publico.
 * ============================================================
 */

var CARPETA_DOCS = 'PEGA_AQUI_EL_ID_DE_LA_CARPETA_DE_DOCUMENTOS';
var CARPETA_PDF  = 'PEGA_AQUI_EL_ID_DE_LA_CARPETA_DE_PDF';
var CLAVE        = 'PEGA_AQUI_UNA_CLAVE_LARGA_INVENTADA';


function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) return json({ ok:false, error:'sin datos' });

    var d = JSON.parse(e.postData.contents);
    if (d.token !== CLAVE) return json({ ok:false, error:'clave incorrecta' });

    var texto = String(d.texto || '').trim();
    if (!texto) return json({ ok:false, error:'propuesta vacia' });

    var nombre = String(d.nombre || 'Propuesta 5i').substring(0, 180);

    /* ---------- 1. el Google Doc con el texto ---------- */
    var doc = DocumentApp.create(nombre);
    var body = doc.getBody();
    body.setMarginTop(56).setMarginBottom(56).setMarginLeft(56).setMarginRight(56);

    texto.split('\n').forEach(function (linea, i) {
      var p = body.appendParagraph(linea);
      var limpia = linea.trim();
      var esTitulo = limpia.length > 2 && limpia === limpia.toUpperCase() &&
                     /[A-ZÁÉÍÓÚÑ]/.test(limpia) && limpia.indexOf('·') === -1;
      if (i === 0) {
        p.setHeading(DocumentApp.ParagraphHeading.TITLE);
      } else if (esTitulo) {
        p.setHeading(DocumentApp.ParagraphHeading.HEADING2);
      }
    });

    if (body.getNumChildren() > 1) {
      var primero = body.getChild(0);
      if (primero.getType() === DocumentApp.ElementType.PARAGRAPH &&
          primero.asParagraph().getText() === '') {
        body.removeChild(primero);
      }
    }
    doc.saveAndClose();

    var archivo = DriveApp.getFileById(doc.getId());
    DriveApp.getFolderById(CARPETA_DOCS).addFile(archivo);
    try { DriveApp.getRootFolder().removeFile(archivo); } catch (err) {}

    var salida = { ok:true, url:doc.getUrl(), nombre:nombre };

    /* ---------- 2. el PDF maquetado ---------- */
    /* Si el PDF falla no se pierde el documento: se devuelve el
       error del PDF aparte y el Doc sigue guardado. */
    var html = String(d.html || '').trim();
    if (html) {
      try {
        var pdf = Utilities.newBlob(html, 'text/html', nombre + '.html')
                           .getAs('application/pdf')
                           .setName(nombre + '.pdf');
        var fpdf = DriveApp.getFolderById(CARPETA_PDF).createFile(pdf);
        salida.pdf = fpdf.getUrl();
      } catch (errPdf) {
        salida.pdfError = String(errPdf);
      }
    }

    return json(salida);

  } catch (err) {
    return json({ ok:false, error:String(err) });
  }
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

/** Ejecuta esto PRIMERO, antes de implementar.
 *  Debe escribir el nombre de las DOS carpetas en el registro. */
function PROBAR_CARPETAS() {
  var docs = DriveApp.getFolderById(CARPETA_DOCS);
  var pdfs = DriveApp.getFolderById(CARPETA_PDF);
  Logger.log('Carpeta de documentos: ' + docs.getName() + '  ->  ' + docs.getUrl());
  Logger.log('Carpeta de PDF:        ' + pdfs.getName() + '  ->  ' + pdfs.getUrl());
}

/** Prueba completa sin pasar por el navegador: deja un documento
 *  y un PDF de ejemplo en sus carpetas. Borralos despues a mano. */
function PROBAR_GUARDADO() {
  var r = doPost({ postData: { contents: JSON.stringify({
    token: CLAVE,
    nombre: 'PRUEBA · borrar',
    texto: 'FIVE IRON GOLF MADRID\n\nPROPUESTA DE PRUEBA\n\nSi ves este documento en la carpeta, el conector funciona.',
    html: '<!doctype html><html><head><meta charset="utf-8"></head><body>' +
          '<h1>Five Iron Golf Madrid</h1><p>PDF de prueba. Si lo ves en la carpeta ' +
          'de PDF, la conversion a PDF funciona.</p></body></html>'
  }) } });
  Logger.log(r.getContent());
}
