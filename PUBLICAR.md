# Cómo se arma este sitio

Tres páginas, tres orígenes distintos. **No son la misma.**

| Ruta publicada        | Qué es                         | Origen |
|-----------------------|--------------------------------|--------|
| `/`                   | Índice de herramientas         | `index.html` |
| `/tarifador`          | La aplicación                  | `tarifador_5i.html` |
| `/docs/tarifador`     | El documento explicativo       | `como_funciona_tarifador.html` |

## Aviso

`docs/tarifador/index.html` es el **explicativo**, no la app.

En septiembre de 2026 se sobrescribió por error copiando la aplicación
encima, y durante varios commits los dos enlaces del índice abrían lo
mismo. Si al actualizar la app copias su HTML a las dos rutas, vuelves a
romperlo.

Comprobación rápida antes de publicar:

```
grep -o '<title>[^<]*</title>' index.html tarifador/index.html docs/tarifador/index.html
```

Tienen que salir **tres títulos distintos**:

```
index.html:             <title>Herramientas 5i Madrid</title>
tarifador/index.html:   <title>Tarifador de Eventos 5i</title>
docs/tarifador/index.html: <title>Cómo funciona el Tarifador 5i</title>
```
