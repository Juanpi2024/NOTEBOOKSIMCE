# SIMCE App 2026 (Desde Notebook)

Aplicación web cooperativa en tiempo real (basada en Node.js, Express y Socket.IO) diseñada para que más de 40 estudiantes respondan preguntas estilo SIMCE simultáneamente y derroten a un "Monstruo" (Boss Fight). 

## Características Principales

* **Multijugador Cooperativo:** Soporta 40+ alumnos conectados en tiempo real.
* **Gamificación:** Cada respuesta correcta le quita puntos de vida al monstruo global de la sala.
* **Roles Separados:** 
    * **Profesor:** Controla el ritmo del juego, envía las preguntas a las pantallas de los estudiantes y monitorea el progreso.
    * **Estudiante:** Recibe preguntas, responde, e inmediatamente ve feedback y el daño causado al monstruo.
* **Manejo de Estado Dinámico:** Sincronización mediante Socket.IO de puntajes, hp del monstruo y pantallas.

## Requisitos Previos

* Node.js v14+ instalado.

## Instalación y Uso

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Iniciar el servidor:
   ```bash
   npm start
   ```
   *(También puedes ejecutar `node server.js`)*
3. El servidor correrá en `http://localhost:3000` (o el puerto configurado por el entorno).

## Archivos Importantes

* `server.js`: El cerebro de la aplicación. Configura Express y Socket.IO, además de mantener el estado global del juego.
* `public/`: Contiene los archivos estáticos que se envían al navegador (`index.html`, `dashboard.html`, JS, CSS).
* `data/questions.json`: Banco de preguntas que se cargarán en la sesión de juego.
