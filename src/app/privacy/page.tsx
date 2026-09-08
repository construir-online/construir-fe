'use client';

import PaginaLegal from '@/components/legal/PaginaLegal';
import { SECCIONES_PRIVACIDAD } from '@/lib/legal';

/**
 * Política de privacidad.
 *
 * El pie de página llevaba a /privacy desde siempre y la ruta no existía.
 *
 * A diferencia de los términos, este texto NO es una plantilla: describe lo
 * que el software hace de verdad y está derivado del código, campo por campo.
 * Se comprobó en:
 *   - src/app/register/page.tsx y src/app/checkout/page.tsx (qué se pide)
 *   - construir-be/src/users/user.entity.ts, customers/, orders/ (qué se guarda)
 *   - construir-be/src/email/ (correos transaccionales)
 *   - construir-be/src/products/s3.service.ts (subida de imágenes a S3)
 *   - construir-be/src/api-request-logs/ (registro de peticiones del API v1)
 *   - src/lib/analytics.ts y src/lib/api.ts (GA4 y cookie de sesión)
 *
 * SI CAMBIA EL SOFTWARE, CAMBIA ESTE TEXTO: añadir un campo a un formulario o
 * a una entidad sin actualizar `legal.privacy.sections.datos*` en
 * messages/es.json y messages/en.json deja la política mintiendo.
 *
 * ⚠️ PENDIENTE DE REVISIÓN LEGAL. ⚠️
 * Lo que el código no puede decir queda marcado con `[POR DEFINIR: …]`:
 * sobre todo los plazos de conservación de los datos (no hay ninguna política
 * de retención ni borrado automático implementada) y la identificación fiscal
 * del responsable del tratamiento (razón social y RIF, que /api/v1/store-info
 * no sirve). Eso lo completa el dueño; el documento lo revisa un abogado.
 */
export default function PrivacyPage() {
  return <PaginaLegal documento="privacy" secciones={SECCIONES_PRIVACIDAD} />;
}
