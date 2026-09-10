import { apiClient } from "@/lib/api";
import { aNumero, avisarSiDiverge } from "@/lib/api-normalizacion";
import type {
  Discount,
  CreateDiscountDto,
  UpdateDiscountDto,
  ValidateDiscountDto,
  ValidateDiscountResponse,
  DiscountStats,
} from "@/types";

/**
 * Los importes del cupón llegan como texto, y aquí eso no era cosmético: era
 * un cupón que NO SE PODÍA GUARDAR.
 *
 * `value`, `minPurchaseAmount` y `maxDiscountAmount` son columnas `numeric`, así
 * que la API las devuelve como `"5.00"`, `"10.00"`, `"15.00"` aunque `Discount`
 * las declare `number`. El formulario de edición cargaba esas cadenas tal cual
 * en su estado y sólo hacía `parseFloat` de los campos que el administrador
 * TOCABA. Al guardar, el PATCH salía con `value: "5.00"`, y el `ValidationPipe`
 * del backend —que corre sin `enableImplicitConversion` y exige `@IsNumber()`—
 * lo rechazaba con un 400:
 *
 *     "value must be a number conforming to the specified constraints"
 *
 * Resultado: abrir un cupón que tuviera monto mínimo o máximo y pulsar guardar
 * devolvía "error al actualizar" pasara lo que pasara, aunque no se hubiera
 * cambiado nada. Sólo se salvaban los cupones de porcentaje sin montos.
 *
 * Es el caso que mejor explica por qué el tipo tiene que decir la verdad: no
 * basta con que la pantalla PINTE bien el valor coaccionado, porque el valor
 * también viaja de vuelta.
 */
function normalizarCupon(crudo: Discount): Discount {
  avisarSiDiverge("GET /discounts", crudo, {
    value: "number",
    currentUses: "number",
  });

  return {
    ...crudo,
    value: aNumero(crudo.value),
    currentUses: aNumero(crudo.currentUses),
    // Estos son opcionales de verdad: un cupón sin monto mínimo no trae el
    // campo, y convertir esa ausencia en `0` sería inventarse un umbral.
    minPurchaseAmount:
      crudo.minPurchaseAmount == null
        ? crudo.minPurchaseAmount
        : aNumero(crudo.minPurchaseAmount),
    maxDiscountAmount:
      crudo.maxDiscountAmount == null
        ? crudo.maxDiscountAmount
        : aNumero(crudo.maxDiscountAmount),
    maxUses: crudo.maxUses == null ? crudo.maxUses : aNumero(crudo.maxUses),
  };
}

export const discountsService = {
  // Listar todos los cupones (Admin)
  async getAll(): Promise<Discount[]> {
    const crudo = await apiClient.get<Discount[]>("/discounts");
    return crudo.map(normalizarCupon);
  },

  // Obtener estadísticas (Admin)
  async getStats(): Promise<DiscountStats> {
    return apiClient.get<DiscountStats>("/discounts/stats");
  },

  // Obtener cupón por UUID (Admin)
  async getByUuid(uuid: string, ): Promise<Discount> {
    return normalizarCupon(await apiClient.get<Discount>(`/discounts/${uuid}`));
  },

  // Validar cupón (Público)
  async validate(data: ValidateDiscountDto): Promise<ValidateDiscountResponse> {
    return apiClient.post<ValidateDiscountResponse>(
      "/discounts/validate",
      data
    );
  },

  // Crear cupón (Admin)
  async create(data: CreateDiscountDto, ): Promise<Discount> {
    return normalizarCupon(await apiClient.post<Discount>("/discounts", data));
  },

  // Actualizar cupón (Admin)
  async update(
    uuid: string,
    data: UpdateDiscountDto,
    
  ): Promise<Discount> {
    return normalizarCupon(
      await apiClient.patch<Discount>(`/discounts/${uuid}`, data),
    );
  },

  // Eliminar cupón (Admin)
  async delete(uuid: string, ): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/discounts/${uuid}`);
  },
};
