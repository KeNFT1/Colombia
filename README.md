# Mesa de Respuesta - Sismo Colombia

Aplicación local-first para coordinar reportes, verificación, asignaciones, recursos, albergues y reportes SITREP después del sismo en Colombia del 10 de agosto de 2026.

Tema visual construido con la línea sobria de Lulo Studios: fondo oscuro, tarjetas elevadas, acentos morados y uso mínimo de amarillo colombiano para señales de atención.

## Ejecutar

```bash
npm install
npm run dev
npm run build
```

## Qué hace

- Inicio guiado en español con tres acciones grandes: reportar ayuda necesaria, ofrecer recursos/ayuda y coordinar casos.
- En móvil, la pantalla inicial oculta navegación/exportación para que las tres acciones de emergencia aparezcan primero.
- Selector de rol para ciudadano/enlace comunitario, voluntario, coordinador, albergue y logística, guardado localmente.
- Flujo de reporte una pregunta a la vez: necesidad, ubicación, personas afectadas, urgencia, contacto y revisión.
- Flujo guiado para ofrecer ayuda: registra insumos/cupos como `Recurso` o equipos/personas como `Voluntario` en el mismo localStorage.
- Plantillas rápidas para agua, salud/heridos, familias sin albergue, vía bloqueada y persona no localizada.
- Vista de coordinación con lenguaje claro y feed completo ordenado por crítico, nuevo, verificado/sin asignar, asignado, bloqueado y reciente.
- Asignación sugerida con confirmación explícita; los casos nuevos deben verificarse antes de confirmar asignación.
- Botón grande para crear un reporte SITREP copiable con variantes WhatsApp, radio y email.
- Resumen operativo con casos abiertos, críticos, asignados y cerrados.
- Registro de reportes con campos seguros y placeholders para fuentes locales.
- Cola de casos con filtros de acción: todos, críticos, sin verificar, sin asignar y por necesidad.
- Mesa de verificación con criterios mínimos antes de asignar o exportar.
- Tablero de asignaciones con ETA, responsable y estado.
- Solicitudes concretas de suministros por caso.
- Inventario editable con estado, ubicación, cantidad y responsable operativo.
- Equipos/usuarios editables con rol de coordinador, verificador o voluntario, estado, turno y habilidades.
- Albergues editables con capacidad, ocupación, estado, responsable y necesidades.
- Check-ins de personas/grupos con etiqueta segura, estado y nota mínima.
- Asignaciones de casos a equipos con ETA, responsable y estado; al crear una asignación el caso queda marcado como asignado.
- SITREP copiable y exportación CSV/JSON con casos, equipos, recursos, albergues, personas, asignaciones y solicitudes.

## Límites de seguridad

Los datos se guardan en `localStorage` del navegador. No ingreses cédulas, historias clínicas, direcciones privadas completas ni nombres completos de personas vulnerables si vas a compartir exportaciones. Contactos, notas y verificaciones deben revisarse antes de publicar.

## Ideas evaluadas

1. Mesa operativa local-first: mayor impacto porque convierte reportes dispersos en trabajo verificable y asignable.
2. Mapa público de necesidades: útil, pero requiere fuerte verificación y redacción.
3. Matching de donaciones: útil después, cuando existan socios confiables.
4. Registro público de desaparecidos: valor humanitario alto, riesgo alto; aquí se mantiene como chequeo mínimo local.
5. Resumen automático de noticias: menor impacto que coordinación accionable.

## Fuentes

- AP sobre el sismo M7.4 en Colombia: https://apnews.com/article/26fd40f93272d834fced47a4a673edc9
- Alerta de la Embajada de EE. UU. sobre el sismo en Chocó: https://co.usembassy.gov/natural-disaster-alert-alert-7-4-earthquake-in-choco-august-10-2026/
- Banco Mundial sobre gestión del riesgo de desastres en Colombia: https://blogs.worldbank.org/en/latinamerica/como-colombia-sistema-mas-resiliente-ante-desastres
- Sahana Foundation: https://sahanafoundation.org/
- Ushahidi: https://www.ushahidi.com/
- Crisis Cleanup: https://crisiscleanup.org/about
- KoBoToolbox: https://hhi.harvard.edu/kobotoolbox
