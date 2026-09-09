import {
  PaymentMethod as PaymentMethodEnum,
  AuditAction,
  AuditResource,
} from "@/lib/enums";
export { AuditAction, AuditResource };

// User roles
export enum UserRole {
  ADMIN = "admin",
  ORDER_ADMIN = "order_admin",
  CUSTOMER = "customer",
}

export interface User {
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  /**
   * Perfil de contacto. Llegan de `GET /auth/profile`, que los lee de la fila
   * y no del token — pueden completarse después del alta.
   *
   * Nulos en cuentas viejas: el checkout los pide sólo a quien le falten.
   */
  phone?: string | null;
  identificationType?: IdentificationType | null;
  identificationNumber?: string | null;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  uuid: string;
  email: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  expiresAt: string;
  createdAt: string;
  usedAt: string | null;
}

export interface InvitationTokenInfo {
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  expiresAt: string;
}

export interface InviteUserDto {
  email: string;
  role?: string;
  firstName?: string;
  lastName?: string;
}

export interface CompleteRegistrationDto {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface Category {
  uuid: string;
  name: string;
  customName?: string | null;
  externalCode?: string | null;
  slug: string;
  description?: string;
  image?: string;
  order: number;
  visible: boolean;
  isFeatured: boolean;
  parent?: Category | null;
  childrens?: Category[];
  products?: Product[];
  /** Productos asignados directamente; solo lo trae el listado del admin. */
  productCount?: number;
  publishedProductCount?: number;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Atajos por problema de la barra de filtros del listado de categorías. */
export type CategoryListFilter = 'parents' | 'no-image' | 'hidden';

export interface CategoryStats {
  total: number;
  visible: number;
  hidden: number;
  parents: number;
  children: number;
  featured: number;
  /** Cuántas categorías caben en la franja de destacadas de la portada. */
  featuredSlots: number;
  featuredWithoutImage: number;
  withoutImage: number;
  hiddenWithPublishedProducts: number;
}

/** Dónde se usa hoy una categoría: panel de edición y modal de eliminado. */
export interface CategoryUsage {
  menuPosition: number | null;
  menuTotal: number;
  featuredSlot: number | null;
  featuredSlots: number;
  activeBanners: number;
  publishedProducts: number;
  totalProducts: number;
  children: {
    uuid: string;
    name: string;
    slug: string;
    productCount: number;
  }[];
}

export interface ProductImage {
  uuid: string;
  url: string;
  isPrimary: boolean;
  order: number;
}

export interface Product {
  uuid: string;
  name: string;
  customName?: string | null;
  sku: string;
  inventory: number;
  price: string;
  priceVes: string | null;
  iva: number;
  priceWithIva: number;
  ivaVes: number;
  priceWithIvaVes: number;
  categories?: {
    uuid: string;
    name: string;
    slug: string;
  }[];
  description?: string;
  shortDescription?: string;
  type?: "simple" | "variable";
  published: boolean;
  featured: boolean;
  visibility?: "visible" | "hidden" | "catalog" | "search";
  barcode?: string;
  tags?: string[];
  images?: ProductImage[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  identificationType: IdentificationType;
  identificationNumber: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface CreateProductDto {
  name: string;
  customName?: string | null;
  sku: string;
  inventory: number;
  price: number;
  categoryUuids?: string[];
  description?: string;
  shortDescription?: string;
  type?: "simple" | "variable";
  published?: boolean;
  featured?: boolean;
  visibility?: "visible" | "hidden" | "catalog" | "search";
  barcode?: string;
  tags?: string[];
}

export interface UpdateProductDto {
  name?: string;
  customName?: string | null;
  inventory?: number;
  price?: number;
  categoryUuids?: string[];
  description?: string;
  shortDescription?: string;
  type?: "simple" | "variable";
  published?: boolean;
  featured?: boolean;
  visibility?: "visible" | "hidden" | "catalog" | "search";
  barcode?: string;
  tags?: string[];
}

export interface CreateCategoryDto {
  name: string;
  customName?: string | null;
  slug: string;
  description?: string;
  image?: string;
  order?: number;
  visible?: boolean;
  isFeatured?: boolean;
}

export interface UpdateCategoryDto {
  name?: string;
  customName?: string | null;
  slug?: string;
  description?: string;
  image?: string;
  order?: number;
  visible?: boolean;
  isFeatured?: boolean;
}

export interface AssignParentDto {
  parentUuid: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  lastPage: number;
}

export interface ProductStats {
  total: number;
  published: number;
  unpublished: number;
  featured: number;
  lowStock: number;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
  /** Identificador estable del motivo, cuando el endpoint lo manda. */
  code?: string;
}

// Bank types
export interface Bank {
  uuid: string;
  code: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Identification types
export enum IdentificationType {
  V = "V", // Venezolano
  E = "E", // Extranjero
  J = "J", // Jurídico
  G = "G", // Gobierno
  P = "P", // Pasaporte
}

// Guest Customer types
export interface GuestCustomer {
  uuid: string;
  identificationType: IdentificationType;
  identificationNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  additionalInfo?: string;
  latitude?: number;
  longitude?: number;
  ordersCount: number;
  lastOrderDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Banner types
export interface BannerImageVariants {
  desktop: {
    webp: string;
    jpeg: string;
  };
  tablet: {
    webp: string;
    jpeg: string;
  };
  mobile: {
    webp: string;
    jpeg: string;
  };
}

export interface Banner {
  uuid: string;
  title: string;
  description?: string;
  isActive: boolean;
  priority: number;
  startDate?: string;
  endDate?: string;
  link?: string;
  images: BannerImageVariants;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateBannerDto {
  title: string;
  description?: string;
  isActive?: boolean;
  priority?: number;
  startDate?: string;
  endDate?: string;
  link?: string;
  image?: File; // Imagen general (si no se especifican las demás)
  desktopImage?: File;
  tabletImage?: File;
  mobileImage?: File;
}

export interface UpdateBannerDto {
  title?: string;
  description?: string;
  isActive?: boolean;
  priority?: number;
  startDate?: string;
  endDate?: string;
  link?: string;
  image?: File; // Imagen general (si no se especifican las demás)
  desktopImage?: File;
  tabletImage?: File;
  mobileImage?: File;
}

// Cart types
export interface CartItem {
  uuid: string;
  quantity: number;
  price: string;
  priceVes: string | null;
  subtotal: number;
  subtotalVes: number | null;
  product: Product;
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  uuid: string;
  userId: number;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  subtotalVes: number | null;
  createdAt: string;
  updatedAt: string;
}

// Local cart types (para localStorage)
export interface LocalCartItem {
  productUuid: string;
  quantity: number;
}

export interface LocalCart {
  items: LocalCartItem[];
}

// DTOs para el carrito
export interface AddToCartDto {
  productUuid: string;
  quantity: number;
}

export interface UpdateCartItemDto {
  quantity: number;
}

// Checkout types
export type DeliveryMethod = "pickup" | "delivery";

// Customer info (always required for guests)
export interface CustomerInfoDto {
  identificationType: IdentificationType;
  identificationNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

// Shipping address (only required for delivery)
export interface ShippingAddressDto {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  additionalInfo?: string;
  latitude?: number;
  longitude?: number;
}

// Deprecated: Use CustomerInfoDto and ShippingAddressDto instead
export interface ShippingAddress {
  identificationType?: IdentificationType;
  identificationNumber?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  additionalInfo?: string;
  latitude?: number;
  longitude?: number;
}

export interface Bank {
  code: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ZelleDetails {
  email: string;
  beneficiary: string;
}

export interface PagoMovilDetails {
  bank: string;
  bankCode: string;
  phone: string;
  cedula: string;
  referenceCode: string;
}

export interface TransferenciaDetails {
  bank: string;
  bankCode: string;
  accountNumber: string;
  rif: string;
  beneficiary: string;
  referenceCode: string;
}

export type AccountDetails =
  | ZelleDetails
  | PagoMovilDetails
  | TransferenciaDetails;

export interface CreatePaymentMethodDto {
  name: string;
  description: string;
  icon: string;
  accountDetails: AccountDetails;
}

export interface ZellePayment {
  senderName: string;
  senderBank: string;
  receipt: File | null;
}

export interface PagoMovilPayment {
  phoneNumber: string;
  cedula: string;
  bankCode: string;
  referenceCode: string;
  receipt: File | null;
}

export interface TransferenciaPayment {
  accountName: string;
  bankCode: string;
  referenceNumber: string;
  receipt: File | null;
}

export interface CheckoutData {
  // Método de entrega
  deliveryMethod: DeliveryMethod;
  // Identificación (para guests)
  identificationType?: IdentificationType;
  identificationNumber?: string;
  // Información de envío (opcional para pickup)
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  additionalInfo?: string;
  latitude?: number;
  longitude?: number;
  // Si el usuario quiere crear cuenta después
  createAccount?: boolean;
  password?: string;
  // Método de pago
  paymentMethod: PaymentMethodEnum;
  zellePayment?: ZellePayment;
  pagomovilPayment?: PagoMovilPayment;
  transferenciaPayment?: TransferenciaPayment;
}

// Order types
export type OrderStatus =
  | "pending"
  | "payment_review"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "completed"
  | "on-hold"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "pending" | "verified" | "rejected" | "refunded";

export interface OrderItem {
  uuid: string;
  productName: string;
  productSku: string;
  quantity: number;
  price: string;
  priceVes: string | null;
  subtotal: number;
  subtotalVes: number | null;
}

export interface PaymentMethodEntity {
  uuid?: string;
  type: string;
  name: string;
  code?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentInfo {
  method: PaymentMethodEnum | PaymentMethodEntity;
  status: PaymentStatus;
  /**
   * El backend ya no manda la URL del comprobante dentro de la orden: era una
   * dirección pública y permanente del bucket, con la captura del pago -nombre,
   * cédula, banco y número de cuenta del cliente- detrás. Ahora sólo dice si lo
   * hay, y el enlace se pide aparte a `GET /orders/:uuid/receipt`, que caduca.
   */
  hasReceipt?: boolean;
  senderName?: string;
  senderBank?: string;
  verifiedAt?: string;
  verifiedBy?: number;
  adminNotes?: string;
  // PagoMovil
  bank?: string | Bank;
  bankCode?: string;
  phoneNumber?: string;
  cedula?: string;
  referenceCode?: string;
  // Transferencia
  accountName?: string;
  transferBank?: Bank;
  referenceNumber?: string;
  accountNumber?: string;
  rif?: string;
  beneficiary?: string;
}

/**
 * Comprador sin cuenta. El backend lo trae como relación eager de la orden, así
 * que en el detalle viene embebido y no hace falta pedirlo aparte.
 */
export interface GuestCustomer {
  id: number;
  uuid: string;
  identificationType: IdentificationType;
  identificationNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  uuid: string;
  orderNumber: string;
  userId: number | null;
  /** Relación eager: presente cuando la compró un usuario registrado. */
  user?: User | null;
  guestEmail?: string | null;
  guestCustomerId?: number | null;
  /** Relación eager: presente cuando la compró un invitado. */
  guestCustomer?: GuestCustomer | null;
  status: OrderStatus;
  items: OrderItem[];
  deliveryMethod: DeliveryMethod;
  shippingAddress: ShippingAddress | null;
  paymentInfo: PaymentInfo;
  subtotal: number;
  subtotalVes: number | null;
  tax: number;
  taxVes: number | null;
  shipping: number;
  shippingVes: number | null;
  discountCode?: string | null;
  discountAmount?: number;
  discountAmountVes?: number | null;
  discount?: Discount | null;
  total: number;
  totalVes: number | null;
  exchangeRate: number | null;
  totalItems: number;
  notes?: string;
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  /** Fecha en que el ERP dio la orden por completada. */
  dateCompleted?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Un pedido tal como lo devuelve el seguimiento público
 * (`GET /orders/track/:orderNumber`).
 *
 * Esa respuesta se obtiene con sólo el número de pedido, sin sesión, así que
 * el backend recorta todo lo que identifique al cliente o sirva para
 * suplantarlo: no trae los datos del pago más allá del método y su estado, ni
 * la dirección, ni el perfil del comprador, ni las notas internas. Ver
 * `OrderTrackingDto` en el backend.
 */
export type TrackedOrder = Omit<Order, "paymentInfo"> & {
  paymentInfo: PaymentInfo | null;
};

export interface CreateOrderDto {
  deliveryMethod: DeliveryMethod;
  customerInfo?: CustomerInfoDto; // Required for guests
  shippingAddress?: ShippingAddressDto; // Required for delivery
  paymentMethod: PaymentMethodEnum;
  paymentDetails: Record<string, string>;
  discountCode?: string;
  notes?: string;
  createAccount?: boolean;
  password?: string;
  items?: Array<{
    productUuid: string;
    quantity: number;
  }>;
}

/**
 * Espejo exacto del DTO del backend. Ojo: allí el ValidationPipe corre con
 * `forbidNonWhitelisted`, así que cualquier campo de más devuelve 400 y tumba el
 * guardado entero. No agregar `trackingNumber` hasta que exista la columna.
 */
export interface UpdateOrderStatusDto {
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  adminNotes?: string;
}

export interface OrderSummary {
  uuid: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  totalItems: number;
  createdAt: string;
}

/**
 * Fila del listado de órdenes del panel.
 *
 * Más ancha que `OrderSummary` porque la tabla del admin muestra al comprador,
 * el estado del pago y el total en Bs.; `/orders/admin/filter` ya la devuelve
 * resuelta para que el panel no reúna al cliente fila por fila.
 */
export interface AdminOrderRow {
  uuid: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  deliveryMethod: DeliveryMethod;
  totalItems: number;
  total: number;
  totalVes: number | null;
  exchangeRate: number | null;
  paymentStatus: PaymentStatus | null;
  paymentMethod: PaymentMethodEnum | null;
  paymentReference: string | null;
  hasReceipt: boolean;
  customerName: string | null;
  customerIdentification: string | null;
  customerEmail: string | null;
  isGuest: boolean;
}

/**
 * Ventas verificadas de un mes calendario.
 *
 * Sólo pedidos con el pago revisado y no cancelados: la tienda cobra por
 * adelantado, así que un comprobante sin verificar todavía no es dinero. El
 * mes lo decide la fecha del pedido, no la de la revisión del comprobante.
 */
export interface MonthlySalesStats {
  /** Mes en formato YYYY-MM. */
  month: string;
  verifiedOrders: number;
  verifiedRevenue: number;
  /** Nulo si ninguna orden verificada del mes tiene monto en Bs. fijado. */
  verifiedRevenueVes: number | null;
  averageTicket: number;
  averageTicketVes: number | null;
}

/**
 * Lo que va del mes en curso, con su variación contra el anterior.
 *
 * Los importes son los del mes HASTA HOY. La variación no se calcula contra
 * el mes anterior entero sino contra su mismo tramo, porque comparar nueve
 * días contra treinta y uno hundiría el porcentaje los primeros días del mes
 * y lo dispararía el último sin que la venta hubiera cambiado.
 *
 * Las variaciones vienen en USD y en número de pedidos, no en bolívares: en
 * Bs. un "+40%" puede ser sólo la tasa BCV subiendo, no una venta más.
 * `null` significa que el tramo anterior fue cero y no hay porcentaje que
 * calcular — que no es lo mismo que "0% de cambio".
 */
export interface CurrentMonthSalesStats extends MonthlySalesStats {
  /** Días del mes ya transcurridos, hoy incluido. El día 9 vale 9. */
  daysElapsed: number;
  percentageChangeRevenue: number | null;
  percentageChangeOrders: number | null;
  percentageChangeAverageTicket: number | null;
}

/**
 * El tramo del mes anterior contra el que se compara el mes en curso.
 *
 * `daysCompared` NO es siempre el número de días que lleva el mes actual. El
 * 31 de marzo se comparan 31 días contra los 28 que tiene febrero, y el
 * rótulo tiene que decir 28: deducirlo de `daysElapsed` escribiría "los
 * primeros 31 días de febrero", un periodo que no existe. Lo calcula el
 * backend, que es quien recorta el tramo; repetir aquí esa regla es como
 * nació el desajuste de contrato que este bloque vino a arreglar.
 */
export interface PreviousMonthToDateStats extends MonthlySalesStats {
  /** Días del mes anterior efectivamente comparados. */
  daysCompared: number;
}

/** Cabecera del listado de órdenes: KPIs y conteos de los chips por estado. */
export interface AdminOrderStats {
  totalOrders: number;
  todayOrders: number;
  monthOrders: number;
  ordersByStatus: Record<string, number>;
  /** Órdenes con el pago sin verificar: el trabajo pendiente del panel. */
  paymentReviewCount: number;
  oldestPaymentReviewAt: string | null;
  verifiedOrders: number;
  verifiedRevenue: number;
  verifiedRevenueVes: number | null;
  averageTicket: number;
  averageTicketVes: number | null;
  /** Tasa BCV vigente hoy, no la fijada en ninguna orden. */
  exchangeRate: number | null;
  /** Bloque "Ventas e Ingresos del Mes" del panel. */
  currentMonth: CurrentMonthSalesStats;
  /** El mes anterior COMPLETO: con lo que cerró. */
  previousMonth: MonthlySalesStats;
  /** El mismo tramo del mes anterior, contra el que se comparan las tarjetas. */
  previousMonthToDate: PreviousMonthToDateStats;
}

// Discount types
export type DiscountType = "percentage" | "fixed";

export interface Discount {
  uuid: string;
  code: string;
  description?: string;
  type: DiscountType;
  value: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  startDate?: string;
  endDate?: string;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateDiscountDto {
  code: string;
  description?: string;
  type: DiscountType;
  value: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  startDate?: string;
  endDate?: string;
  maxUses?: number;
  isActive?: boolean;
}

export interface UpdateDiscountDto {
  code?: string;
  description?: string;
  type?: DiscountType;
  value?: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  startDate?: string;
  endDate?: string;
  maxUses?: number;
  isActive?: boolean;
}

export interface ValidateDiscountDto {
  code: string;
  orderTotal: number;
}

export interface ValidateDiscountResponse {
  valid: boolean;
  discount?: {
    uuid: string;
    code: string;
    description?: string;
    type: DiscountType;
    value: number;
    discountAmount: number;
    discountAmountVes?: number;
    finalTotal: number;
  };
  error?: string;
}

export interface DiscountStats {
  total: number;
  active: number;
  inactive: number;
  expired: number;
  maxedOut: number;
}

// Exchange Rate types
export interface ExchangeRate {
  date: string;
  rate: number;
  source: string;
  createdAt: string;
  updatedAt: string;
}

// Customer types
export type CustomerType = "registered" | "guest";

export interface CustomerResponseDto {
  uuid: string;
  type: CustomerType;
  name: string;
  email: string;
  phone: string | null;
  identification: string | null;
  totalOrders: number;
  totalSpent: number;
  totalSpentVes: number;
  firstOrderDate: string | null;
  lastOrderDate: string | null;
  createdAt: string;
}

export interface CustomerListResponseDto {
  data: CustomerResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomerDetailResponseDto {
  customer: {
    uuid: string;
    type: CustomerType;
    name: string;
    email: string;
    phone: string | null;
    identification: string | null;
    createdAt: string;
  };
  stats: {
    totalOrders: number;
    totalSpentUSD: number;
    totalSpentVES: number;
    averageOrderValue: number;
    firstOrderDate: string | null;
    lastOrderDate: string | null;
  };
  recentOrders: Array<{
    uuid: string;
    orderNumber: string;
    date: string;
    total: number;
    status: string;
  }>;
  addresses?: Array<{
    address: string;
    city: string;
    state: string;
    postalCode: string;
    usedInOrders: number;
  }>;
}

// API Keys types
export enum ApiKeyPermission {
  READ = "read",
  WRITE = "write",
  READ_WRITE = "read_write",
}

export interface ApiKey {
  uuid: string;
  consumerKey: string;
  consumerSecret: string; // Siempre "***HIDDEN***" excepto al crear
  description: string;
  permissions: ApiKeyPermission;
  active: boolean;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiKeyDto {
  description: string;
  permissions: ApiKeyPermission;
}

export interface CreateApiKeyResponse {
  message: string;
  apiKey: {
    uuid: string;
    consumerKey: string;
    consumerSecret: string; // "***HIDDEN***"
    description: string;
    permissions: string;
    active: boolean;
  };
  consumerSecret: string; // ⚠️ Solo aquí se muestra en texto plano
  warning: string;
}

// User Management DTOs
export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  isActive?: boolean;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  isActive?: boolean;
}

export interface ChangeUserRoleDto {
  role: UserRole;
}

export interface ResetUserPasswordDto {
  newPassword: string;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  deleted: number;
  byRole: {
    admin: number;
    order_admin: number;
    customer: number;
  };
}

export interface UserListFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole | "all";
  isActive?: boolean | "all";
  includeDeleted?: boolean;
  sortBy?: "createdAt" | "firstName" | "email" | "role";
  sortOrder?: "ASC" | "DESC";
}

// API Logs types
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiLog {
  id: number;
  uuid: string;
  method: HttpMethod;
  path: string;
  query: Record<string, string> | null;
  requestBody: unknown | null;
  requestHeaders: Record<string, string> | null;
  statusCode: number;
  responseBody: unknown | null;
  responseTime: number;
  consumerKey: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  isError: boolean;
  errorMessage: string | null;
  errorStack: string | null;
  createdAt: string;
  apiKey: {
    uuid: string;
    description: string;
  } | null;
}

export interface ApiLogStats {
  totalRequests: number;
  totalErrors: number;
  errorRate: number;
  avgResponseTime: number;
  topPaths: Array<{
    path: string;
    count: string;
  }>;
}

export interface ApiLogFilters {
  page?: number;
  limit?: number;
  isError?: boolean;
  consumerKey?: string;
  statusCode?: number;
  path?: string;
  startDate?: string;
  endDate?: string;
}

export interface ApiLogCleanupResponse {
  message: string;
  deleted: number;
}

export interface ApiLogReplayResponse {
  statusCode: number;
  body: unknown;
  responseTime: number;
}

// Audit Log types

export interface AuditLog {
  id: number;
  userId: number;
  userEmail: string;
  userFullName: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId: string;
  details: Record<string, unknown>;
  ipAddress: string;
  createdAt: string;
}

export interface AuditLogFilters {
  resource?: AuditResource;
  action?: AuditAction;
  userId?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
}

/** Datos de contacto de la tienda física. Origen: GET /api/v1/store-info. */
export interface StoreInfo {
  name: string;
  address: string;
  city: string;
  phone: string;
  /** Cadena vacía si no se configuró STORE_EMAIL */
  email: string;
  hours: string;
  /** Cadena vacía si no se configuró STORE_MAP_URL */
  mapUrl: string;
}
