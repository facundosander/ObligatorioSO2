# Lectores y escritores — demo animada con semáforos

Ejecutar: python -m http.server 8080 --directory dist
Abrir http://localhost:8080. Pruebas: npm test (Node.js 18+).

## Archivos separados

- dist/algoritmo.js: únicamente Semaforo y LectoresEscritores. No conoce la página, el tiempo ni la animación. Las funciones lector(leer) y escritor(escribir) reciben la operación a ejecutar como función asíncrona. Sigue el pseudocódigo proporcionado.
- dist/simulacion.js: adaptador para los participantes y la duración visual. Hereda el algoritmo y lo utiliza; no decide los permisos.
- dist/app.js: botones, reloj automático y movimiento de los participantes.
- dist/index.html: estructura de la página.
- dist/styles.css: colores, posiciones y transiciones.
- tests/monitor.test.js: semáforos, sincronización y algoritmo independiente de la página.

## Usar

Tocar «Ver ejemplo» o agregar lectores/escritores. La demo avanza automáticamente. Se puede pausar y reiniciar. Los verdes leen juntos; el naranja escribe solo; los que esperan permanecen a la izquierda y los que terminan se mueven a la derecha. Máximo 10 participantes pendientes para que se vean bien. Se muestran los últimos seis terminados.

La operación visual dura 3900 ms de animación activa. Un único reloj por fotogramas descuenta el tiempo restante y dibuja la barra; al llegar a cero se completa la operación. La pausa congela tanto el avance como la barra. Esto sólo representa su duración; el algoritmo no contiene temporizadores. El contador y los semáforos se muestran cuando las tareas se estabilizan, por eso mutex puede parecer siempre libre en casos que lo ocupan brevemente.

## Algoritmo

Inicialización: lectores=0; mutex=1; recurso=1. P espera un permiso; V libera o transfiere el permiso al primero bloqueado en ese semáforo. Mutex protege el contador; el primer lector toma recurso y el último lo libera. El escritor toma recurso antes de escribir y lo libera al terminar.

Prioridad a lectores, SIN FIFO global: un lector nuevo puede adelantar a un escritor que espera cuando ya hay lectores activos. Con lectores continuos puede haber inanición de escritores. El contador puede incluir al primer lector bloqueado en recurso mientras conserva mutex.

Semáforos de aplicación implementados con Promise y await; tareas asíncronas cooperativas en un event loop, sin hilos reales ni semáforos nativos del SO. Las operaciones recibidas deben terminar normalmente; la implementación reproduce el pseudocódigo, no incluye recuperación de excepciones dentro de leer/escribir.

El informe PDF formal queda para otra etapa.
