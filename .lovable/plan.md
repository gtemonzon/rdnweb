
# Plan: Integración de Pagos con Cybersource/VisaNet

## Estado Actual: Bloqueado - Requiere Activación por NeoNet/VisaNet

### Diagnóstico Completo

Después de una investigación exhaustiva, hemos confirmado que:

1. **Las credenciales son correctas** (formato válido, longitudes correctas)
2. **La autenticación HTTP Signature está correctamente implementada**
3. **PERO los servicios REST API no están habilitados para esta cuenta**

### Endpoints Probados

| Endpoint | Resultado | Significado |
|----------|-----------|-------------|
| `/pts/v2/payments` | 404 Not Found | Servicio "REST API Payments" no habilitado |
| `/reporting/v3/report-definitions` | 406 | Servicio de reportes no acepta el request |
| `/flex/v2/sessions` | 401 Auth Failed | Servicio "Flex Microform" no habilitado |
| `/microform/v2/sessions` | 401 Auth Failed | Servicio "Microform" no habilitado |

### Análisis del Sitio WordPress Actual

El sitio en `refugiodelaninez.org/donaciones/` usa un formulario HTML simple que:
- Captura datos de tarjeta directamente en inputs HTML
- Envía a `/confirmacion` (backend PHP en WordPress)
- El backend PHP probablemente usa **SOAP API** (Simple Order API) con certificados SSL

Esto explica por qué funciona el sitio actual pero no nuestra integración REST API.

## Opciones para Resolver

### Opción 1: Solicitar Activación de Servicios REST (Recomendado)
**Tiempo estimado**: 1-2 semanas (depende de NeoNet)

Contactar a NeoNet/VisaNet y solicitar:
- Activación del servicio **"REST API Payments"** (POST /pts/v2/payments)
- Opcionalmente: **"Flex Microform"** para tokenización segura (mejor PCI compliance)

**Plantilla de correo**:
```
Estimados,

Solicito la activación del servicio "REST API Payments" para nuestra cuenta de sandbox/pruebas.

Detalles de la integración:
- Merchant ID: visanetgt_elrefudelaninezong
- Tipo de integración: REST API directa (server-to-server)
- Autenticación: HTTP Signature (HMAC-SHA256)
- Endpoint requerido: POST /pts/v2/payments

Actualmente recibimos un error 404 "Resource not found" al intentar acceder al endpoint de pagos.

Adicionalmente, si es posible, solicitamos la habilitación del servicio "Flex Microform" 
para tokenización segura de tarjetas (mejor cumplimiento PCI-DSS).

Agradezco su pronta atención.

Saludos cordiales.
```

### Opción 2: Implementar SOAP API (Simple Order)
**Tiempo estimado**: 3-5 días de desarrollo

Replicar el método del sitio WordPress usando SOAP API:
- Requiere implementar cliente SOAP en Deno
- Más complejo pero ya está probado en la cuenta actual
- Mismo nivel de riesgo PCI que el sitio actual

### Opción 3: Usar Secure Acceptance (Hosted Checkout)
**Tiempo estimado**: 2-3 días de desarrollo

Redirigir al usuario a una página de Cybersource para completar el pago:
- Menor control sobre la experiencia de usuario
- Mejor compliance PCI (SAQ-A)
- Puede requerir habilitación por NeoNet

## Lo que ya está implementado

1. **Edge Functions creadas**:
   - `cybersource-auth-test` - Diagnóstico de credenciales
   - `process-payment` - Pagos REST API (listo, pero servicio no habilitado)
   - `flex-capture-context` - Obtener contexto para Flex Microform
   - `flex-tokenize` - Procesar pago con token de Flex

2. **Componente Frontend**:
   - `FlexMicroform.tsx` - Componente para iFrames seguros de Cybersource

3. **Panel de diagnóstico**:
   - `/admin/cybersource` - Herramienta para probar credenciales

## Próximos Pasos

1. **Contactar a NeoNet/VisaNet** con la plantilla de arriba
2. **Esperar confirmación** de que los servicios están habilitados
3. **Probar de nuevo** en `/admin/cybersource`
4. **Integrar al formulario de donación** una vez que funcione

---

*Última actualización: 29 enero 2026*
