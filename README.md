# Tempered Super App

**Tempered** es una plataforma modular y segura desarrollada con Next.js (App Router), TypeScript, Tailwind CSS y Firebase, diseñada para albergar múltiples aplicaciones especializadas bajo una arquitectura centralizada, un control de sesión estricto y una identidad visual única por cada módulo.

## Arquitectura y Módulos

La plataforma funciona como un contenedor central (Súper App) que da acceso a las siguientes sub-aplicaciones:

1. **Isorropia Kairos** (Administración Financiera)
   - **Resumen**: Vista rápida de saldos disponibles en tiempo real (positivos en verde, negativos en rojo).
   - **Distribuciones**: Gestión de periodos mensuales con validación de fechas (mes actual o pasados) y arrastre automático de saldos positivos ("Restante").
   - **Balance Bs / Balance $**: Tablas detalladas de ingresos y egresos con categorías fijas (8 para Bolívares, 3 para Dólares).
   - **Transferencias**: Movimientos internos entre categorías de la misma moneda con registro automático y bloqueo estricto de eliminación en las tablas para mantener la integridad contable.

2. **Grobit** (Aplicación de Hábitos)
   - Módulo enfocado en la productividad y seguimiento de rutinas personales.

3. **Mawina Kairos** (Aplicación de Rutinas)
   - Módulo dedicado al control y organización de entrenamientos y actividades periódicas.
