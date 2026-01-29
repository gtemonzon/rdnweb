
# Plan: Resolver Error 404 "Resource not found" de Cybersource

## Diagnóstico del Problema

Según los logs de la función edge y la documentación encontrada, las credenciales parecen estar correctamente formateadas:

- **Merchant ID**: `visanetgt_elrefudelaninezong` (28 caracteres)
- **Key ID**: `cb1e2245-a4db-4b21-9acf-0d0150b845ff` (UUID correcto de 36 caracteres)
- **Shared Secret**: 44 caracteres en formato Base64 (detectado correctamente)
- **Ambiente**: Test (`apitest.cybersource.com`)
- **Endpoint**: `/pts/v2/payments`

El problema **NO es de autenticación** (no es un error 401), sino un **404 Resource not found**. Esto indica que el endpoint de pagos no está habilitado para esta cuenta.

## Causa Raíz

Según la documentación de Cybersource y la memoria del proyecto:

> En el ambiente de pruebas/producción de Cybersource, un error 404 "Resource not found" para el endpoint de pagos típicamente indica que el servicio **'REST API Payments'** no ha sido habilitado para la cuenta por parte del proveedor (VisaNet Guatemala).

Este servicio debe ser explícitamente solicitado y activado por VisaNet antes de que la integración pueda procesar transacciones.

## Acción Requerida (No técnica)

Debes contactar a tu representante de **VisaNet Guatemala** y solicitar lo siguiente:

1. **Activar el servicio "REST API Payments"** para tu cuenta de sandbox
2. Mencionar que estás usando una **integración REST API directa** (server-to-server) con HTTP Signature authentication
3. Especificar el endpoint que necesitas: `POST /pts/v2/payments`
4. Proporcionar tu Merchant ID: `visanetgt_elrefudelaninezong`

## Mejoras Técnicas Propuestas

Mientras esperamos la activación del servicio, implementaré las siguientes mejoras:

### 1. Mejorar el diagnóstico en la función de prueba

Actualizar `cybersource-auth-test` para:
- Detectar específicamente el error 404 y mostrar un mensaje claro indicando que el servicio REST API Payments no está habilitado
- Proporcionar instrucciones específicas para contactar a VisaNet
- Agregar un endpoint alternativo de verificación (`/reporting/v3/reports`) que puede ayudar a validar que las credenciales están correctas aunque el servicio de pagos no esté activo

### 2. Agregar endpoint de verificación de cuenta

Probar primero con un endpoint que generalmente está habilitado por defecto (como reporting o key management) para confirmar que las credenciales son válidas, y luego probar el endpoint de pagos.

### 3. Actualizar la UI de diagnóstico

- Mostrar mensaje específico cuando se detecte el error 404
- Incluir instrucciones claras sobre qué solicitar a VisaNet
- Diferenciar entre errores de autenticación (401) y errores de servicio no habilitado (404)

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/cybersource-auth-test/index.ts` | Agregar detección de 404 con mensaje específico, probar endpoint de verificación alternativo |
| `src/pages/AdminCybersource.tsx` | Mostrar mensaje específico para error 404 con instrucciones para VisaNet |

## Resumen

El error 404 no es un problema con el código o las credenciales, sino que **VisaNet Guatemala necesita habilitar el servicio "REST API Payments"** para tu cuenta de sandbox. Mientras tanto, implementaré mejoras para que el sistema de diagnóstico detecte y explique claramente este escenario.
