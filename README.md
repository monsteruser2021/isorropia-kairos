Tempered Super App

Tempered es una súper app modular de alto rendimiento y enfoque móvil (mobile-first), desarrollada con Next.js (App Router), TypeScript, Tailwind CSS y Firebase Firestore. Está diseñada para albergar múltiples aplicaciones especializadas bajo una arquitectura centralizada, control de sesión estricto, una barra de navegación global coherente y animaciones nativas aceleradas por GPU, optimizadas específicamente para ejecutarse con fluidez en dispositivos móviles de gama baja y media-baja.

🚀 Arquitectura y Módulos

La plataforma funciona como un panel central que da acceso a cuatro aplicaciones especializadas, cada una con su propia identidad cromática exclusiva que transiciona suavemente hacia el negro puro (#121212):

Panel Tempered (Súper App)

Identidad de color: #2e4484 a #121212

Descripción: Centro de control principal para seleccionar y lanzar los submódulos con escala de respuesta táctil y transiciones fluidas.

Isorropia Kairos (Gestión Financiera)

Identidad de color: #ddab36 a #121212

Descripción: Resúmenes de saldos en tiempo real, gestión de periodos mensuales, tablas detalladas para Bolívares y Dólares con categorías fijas, transferencias internas y transiciones de deslizamiento lateral.

Grobit (Seguimiento de Hábitos)

Identidad de color: #066204 a #121212

Descripción: Gráficos mensuales de cumplimiento, lista de verificación diaria (checklist) con reinicio automático diario y un CRUD completo de hábitos vinculado a sesiones de usuario personalizadas.

Mawina Kairos (Rutinas y Entrenamientos)

Identidad de color: #620404 a #121212

Descripción: Módulo dedicado al control y organización de rutinas físicas y actividades periódicas.

Herramientas / Utilidades

Identidad de color: Monocromática (Blanco y Negro)

Descripción: Menú de selección de utilidades que incluye un módulo de Lista de Tareas (To-Do List) diario con soporte CRUD completo, seguimiento mediante casillas de verificación y alertas visuales automáticas de tareas atrasadas (resaltadas en rojo según la fecha del sistema).

🧭 Navegación Global y Experiencia de Usuario

Barra superior persistente:

Izquierda: Botón global de "Volver a Tempered" presente en todas las vistas secundarias y submódulos para un retorno simétrico e instantáneo al menú principal.

Derecha: Botón seguro de cierre de sesión (Log out) con idéntico tamaño y diseño.

Gestión estricta de inactividad: Cierre de sesión automático tras 15 minutos de inactividad continua para proteger datos sensibles.

Cero librerías pesadas (Rendimiento primero): Omisión total de bibliotecas de animación pesadas (como Framer Motion). Todas las transiciones y animaciones de la interfaz se basan enteramente en CSS nativo y propiedades aceleradas por GPU (transform, opacity, will-change) para eliminar destellos blancos y garantizar una tasa de cuadros por segundo fluida en hardware móvil.

🛠️ Tecnologías Utilizadas

Framework: Next.js (App Router)

Lenguaje: TypeScript

Estilos: Tailwind CSS

Base de datos: Firebase Firestore (Aislamiento seguro de datos por usuario mediante identificadores personalizados)

Diseño: Adaptable (Mobile-First) con transiciones nativas optimizadas
