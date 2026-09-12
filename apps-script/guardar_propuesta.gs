/**
 * ============================================================
 * 5i · CONECTOR DE PROPUESTAS A DRIVE
 * Recibe una propuesta desde el tarifador y crea un Google Doc
 * en una carpeta fija de tu Drive.
 * ------------------------------------------------------------
 * INSTALACION (una sola vez, cinco minutos)
 *
 * 1. En Drive, crea la carpeta donde quieres que caigan las
 *    propuestas. Por ejemplo:
 *      5I SYSTEM GERENCIA / 06 Comercial / Propuestas de eventos
 *    Abrela y copia el ID de la URL. El ID es el trozo largo
 *    despues de /folders/ :
 *      drive.google.com/drive/folders/1AbCdEfGhIjK...
 *                                     ^^^^^^^^^^^^^^ esto
 *
 * 2. Ve a script.google.com > Nuevo proyecto.
 *    Borra todo y pega este archivo.
 *
 * 3. Rellena las dos constantes de abajo: CARPETA_ID y CLAVE.
 *    La CLAVE inventatela: una frase larga sin espacios. Es la
 *    que tendras que pegar tambien en el tarifador.
 *
 * 4. Guarda. Luego: Implementar > Nueva implementacion.
 *      Tipo: Aplicacion web
 *      Ejecutar como: Yo
 *      Quien tiene acceso: Cualquier persona
 *    Implementar, y autoriza cuando lo pida.
 *
 * 5. Copia la URL que te da, la que termina en /exec.
 *
 * 6. En el tarifador, abre "Conexion con Google Drive" y pega
 *    la URL y la clave. Listo.
 *
 * SOBRE LA SEGURIDAD: la implementacion es publica porque el
 * navegador tiene que poder llamarla sin iniciar sesion, pero
 * solo hace una cosa (crear un Doc en esa carpeta) y exige la
 * clave. Si alguna vez sospechas que la URL se ha filtrado,
 * cambia la CLAVE aqui y en el tarifador, o crea una
 * implementacion nueva y descarta la anterior.
 * ============================================================
 */

var CARPETA_ID = 'PEGA_AQUI_EL_ID_DE_LA_CARPETA';
var CLAVE      = 'PEGA_AQUI_UNA_CLAVE_LARGA_INVENTADA';

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) return json({ ok:false, error:'sin datos' });

    var d = JSON.parse(e.postData.contents);
    if (d.token !== CLAVE) return json({ ok:false, error:'clave incorrecta' });

    var texto = String(d.texto || '').trim();
    if (!texto) return json({ ok:false, error:'propuesta vacia' });

    var nombre = String(d.nombre || 'Propuesta 5i').substring(0, 180);

    var doc = DocumentApp.create(nombre);
    var body = doc.getBody();
    body.setMarginTop(56).setMarginBottom(56).setMarginLeft(56).setMarginRight(56);

    // El tarifador manda texto plano con lineas en blanco como separadores.
    // Los titulos van en MAYUSCULAS, asi que los detectamos y los marcamos.
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
    // El primer parrafo vacio que crea Google al abrir el doc.
    if (body.getNumChildren() > 0) {
      var primero = body.getChild(0);
      if (primero.getType() === DocumentApp.ElementType.PARAGRAPH &&
          primero.asParagraph().getText() === '' && body.getNumChildren() > 1) {
        body.removeChild(primero);
      }
    }
    doc.saveAndClose();

    var archivo = DriveApp.getFileById(doc.getId());
    var carpeta = DriveApp.getFolderById(CARPETA_ID);
    carpeta.addFile(archivo);
    try { DriveApp.getRootFolder().removeFile(archivo); } catch (err) {}

    return json({ ok:true, url:doc.getUrl(), nombre:nombre });

  } catch (err) {
    return json({ ok:false, error:String(err) });
  }
}

function doGet() {
  return ContentService.createTextOutput(
    'Conector de propuestas 5i activo. Este endpoint solo acepta POST desde el tarifador.'
  );
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Ejecuta esta funcion una vez desde el editor para comprobar
 *  que el ID de la carpeta es correcto antes de implementar. */
function PROBAR_CARPETA() {
  var c = DriveApp.getFolderById(CARPETA_ID);
  Logger.log('Carpeta encontrada: ' + c.getName());
  SpreadsheetApp.getUi; // sin uso, evita avisos del editor
}
