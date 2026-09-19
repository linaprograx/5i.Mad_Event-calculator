/*
 * Puente entre el tarifador y el Apps Script de Drive.
 *
 * La URL /exec y la clave viven en variables de entorno de Vercel
 * (CONECTOR_URL y CONECTOR_CLAVE), nunca en el repositorio, que es publico.
 * Asi nadie tiene que configurar nada en su navegador.
 *
 * Sin dependencias: fetch es nativo en el runtime de Node de Vercel.
 */
var ACCIONES = ['listar_propuestas', 'guardar_propuesta', 'guardar_doc'];

module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'solo POST' });

  var url = process.env.CONECTOR_URL, clave = process.env.CONECTOR_CLAVE;
  if (!url || !clave) {
    return res.status(200).json({ ok:false, sinConfigurar:true,
      error:'la conexión con Google Drive no está configurada en Vercel' });
  }

  var d = req.body;
  if (typeof d === 'string') {
    try { d = JSON.parse(d); } catch (e) { return res.status(400).json({ ok:false, error:'JSON no válido' }); }
  }
  if (!d || ACCIONES.indexOf(d.accion) < 0) {
    return res.status(400).json({ ok:false, error:'acción no permitida' });
  }

  /* la clave la pone el servidor; la que venga del navegador se ignora.
     'guardar_doc' no es una accion del .gs: sin accion conocida, guarda el Doc */
  var cuerpo = Object.assign({}, d, { token:clave });

  try {
    var r = await fetch(url, {
      method:'POST',
      headers:{ 'Content-Type':'text/plain;charset=utf-8' },
      body:JSON.stringify(cuerpo),
      redirect:'follow'
    });
    var txt = await r.text();
    var j;
    try { j = JSON.parse(txt); } catch (e) {
      return res.status(502).json({ ok:false,
        error:'el conector no ha devuelto datos: revisa que esté publicado con acceso "Cualquier persona"' });
    }
    return res.status(200).json(j);
  } catch (e) {
    return res.status(502).json({ ok:false, error:'no se ha podido contactar con el conector' });
  }
};
