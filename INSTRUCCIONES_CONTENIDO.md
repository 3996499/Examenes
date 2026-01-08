# Instrucciones para añadir contenido

Esta guía explica cómo añadir nuevos enlaces y recursos a la aplicación.

## 1. Añadir enlaces Daypo (Formato Estándar)

Cuando recibas enlaces en este formato:
```
https://www.daypo.com/ra05-python.html
https://www.daypo.com/ra05-python-1.html
...
```

1.  Abre el archivo del módulo correspondiente, ej: `features/python/index.html`.
2.  Busca el RA correspondiente (ej. RA5) en la evaluación correcta (1ª o 2ª).
3.  Si el RA está marcado como "En construcción", reemplázalo con el bloque de código para RAs con múltiples versiones (ver abajo).

## 2. Añadir enlaces (Formato Simplificado)

Si recibes una lista de enlaces con este encabezado:

```
MODULO - RA#
link1
link2
...
```

**Ejemplo:**
```
DAW - RA4
https://www.daypo.com/test-1.html
https://www.daypo.com/test-2.html
```

**Pasos:**
1.  Identifica el módulo (`DAW`, `Python`, etc.) y el RA (`RA4`).
2.  Ve al archivo HTML del módulo.
3.  Busca la tarjeta del RA.
4.  Copia los enlaces y pégalos como elementos `<li>` dentro de la lista de versiones.

## 3. Actualizar Noticias del Hub

**¡IMPORTANTE!** Cada vez que añadas recursos significativos, actualiza la sección de noticias en la página principal (`hub.js`).

1.  Abre `hub.js`.
2.  Busca la función `homeTemplate()`.
3.  Localiza la sección `<!-- SECCIÓN DE NOVEDADES -->`.
4.  Actualiza el contenido del primer `<li>` con la información del nuevo recurso:

```html
<li class="group ... " data-action="nav-module" data-target="features/NOMBRE_MODULO/index.html" data-label="NOMBRE_MODULO">
    <div class="flex items-center gap-4">
        <!-- Icono (puedes cambiarlo) -->
        <span class="flex h-10 w-10 ... text-lg shadow-lg">🐍</span> 
        <div>
            <!-- Título: Módulo - RA -->
            <p class="font-semibold text-white ...">Python - RA5</p>
            <!-- Descripción breve -->
            <p class="text-sm text-indigo-100/60">Añadidos tests de TDD...</p> 
        </div>
    </div>
    <!-- Flecha -->
    <span class="...">→</span>
</li>
```

## 4. Actualizar Sidebar (Etiquetas de progreso)

Si añades un NUEVO RA que **ya tiene contenido funcional**, actualiza las etiquetas en `index.html`.

**Regla Importante:**
*   Solo cuenta los RAs que **funcionan**.
*   NO cuentes los RAs que están "En construcción".

**Ejemplo:**
*   Python tiene RA 1, 2, 3, 4, 5 funcionando.
*   RA 6 está en construcción.
*   La etiqueta en `index.html` debe decir: **RA 1 - 5** (NO 1-6).

Debes actualizar la etiqueta en **dos lugares** dentro de `index.html`:
1.  Lista de menú móvil (`id="appbarMenu"`).
2.  Lista lateral de escritorio (`class="panel nav-panel"`).

## Plantilla HTML para RAs (Dropdown)

Usa este bloque HTML como plantilla dentro de la tarjeta del RA (`.ra-card`):

```html
<details class="ra-multi rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
    <summary class="flex cursor-pointer items-center justify-center gap-2 text-sm font-semibold text-slate-800 dark:text-white">
        <span>X versiones disponibles</span> <!-- Actualiza el número -->
        <span aria-hidden="true" class="text-lg">▾</span>
    </summary>
    <ul class="ra-links mt-3 list-none space-y-2 p-0 accordion-content overflow-hidden">
        <!-- Ítem 1 -->
        <li>
            <a class="inline-flex items-center gap-1 rounded-full border border-slate-200/70 bg-white/80 px-3 py-1 text-sm font-medium text-slate-900 transition hover:border-indigo-400 hover:text-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white" 
               href="LINK_AQUI">
               Versión 1 ↗
            </a>
        </li>
        <!-- Añade más <li> según sea necesario -->
    </ul>
</details>
```

Asegúrate de que la clase `accordion-content` y `overflow-hidden` estén presentes en el `<ul>` o que el script JS (`hub.js` / `module.js`) las gestione correctamente (el script actual añade automáticamente el wrapper `accordion-content`, así que la estructura HTML básica es suficiente).
