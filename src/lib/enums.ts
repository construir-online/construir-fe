export enum PaymentMethod {
  ZELLE = "zelle",
  PAGO_MOVIL = "pagomovil",
  TRANSFERENCIA = "transferencia",
}

export enum AuditAction {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  BULK = "bulk",
}

export enum AuditResource {
  PRODUCT = "product",
  CATEGORY = "category",
  ORDER = "order",
  USER = "user",
  DISCOUNT = "discount",
  BANNER = "banner",
  API_KEY = "api-key",
  EXCHANGE_RATE = "exchange-rate",
}