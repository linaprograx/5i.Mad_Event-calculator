# 5i-web — Herramientas web de gerencia

Sitio estático con las herramientas internas de dirección y F&B de Five Iron Golf Madrid.
Sin build, sin dependencias: HTML, CSS y JavaScript en archivos autocontenidos.

## Qué hay

| Ruta | Archivo | Qué es |
|---|---|---|
| `/` | `index.html` | Portada con enlaces a las herramientas |
| `/tarifador` | `tarifador/index.html` | Tarifador de eventos: precio por persona, suelo, margen y propuesta |
| `/docs/tarifador` | `docs/tarifador/index.html` | Explicación del tarifador para compartir con cualquiera |

Además:

- `apps-script/guardar_propuesta.gs` — conector que guarda las propuestas como Google Doc
  en una carpeta de Drive. No se despliega con el sitio: se pega en script.google.com.
  Las instrucciones de instalación están dentro del propio archivo.
- `docs/manual-tecnico.md` — manual interno: dónde está cada constante económica, cómo
  cambiarla, cómo añadir plantillas y campos, y qué no tocar.

## Despliegue

Vercel, sin configuración. No hay framework, ni build command, ni output directory.
`vercel.json` solo activa `cleanUrls` para que las rutas no lleven `.html`.

Con el repositorio conectado a Vercel, cada `push` a `main` publica automáticamente.

## Cómo cambiar un precio o un coste

Todo lo económico del tarifador vive en un único objeto `T` al principio del
`<script>` de `tarifador/index.html`. No hay números sueltos dentro de las fórmulas.

Los números van **con punto decimal**: `1.09`, nunca `1,09`. Una coma decimal deja la
página en blanco. El manual técnico lo explica con detalle.

## Convención de versiones

Cada cambio que salga a producción va en un commit propio con un mensaje que diga qué
número se ha tocado y por qué. La pestaña `11_CONTROL` del libro de escandallos debe
registrar qué versión está publicada y en qué fecha: es el único puente entre el Excel
de costes y estas herramientas.
