# Plan de Pruebas — construir-fe

## Stack recomendado

| Capa | Herramienta | Por qué |
|------|-------------|---------|
| Unitaria / integración | **Vitest** | Más rápido que Jest, soporte nativo ESM, compatible con el ecosistema Vite/Next.js 15 |
| Componentes React | **React Testing Library** | El estándar para testear comportamiento (no implementación) de componentes |
| E2E (ya configurado) | **Playwright** | Ya existe configuración en `playwright.config.ts`. Más rápido y confiable que Selenium en aplicaciones modernas |

> **¿Por qué NO Selenium?**  
> Selenium fue diseñado para controlar navegadores reales de forma genérica. Para aplicaciones React/Next.js es lento, frágil ante re-renders y no tiene soporte de primera clase para módulos ES. Playwright cubre el mismo caso de uso con mejor DX, auto-waiting y soporte nativo para TypeScript.

---

## Prioridades de implementación

```
Alta prioridad   → Flujos críticos de negocio (checkout, auth, carrito)
Media prioridad  → Admin CRUD (productos, categorías, órdenes)
Baja prioridad   → Componentes UI puros, páginas estáticas
```

---

## 1. Pruebas Unitarias — Servicios (`src/services/`)

### 1.1 `authService`
| ID | Caso de prueba | Tipo |
|----|----------------|------|
| U-AUTH-01 | `login()` envía POST a `/auth/login` con las credenciales correctas | Unit |
| U-AUTH-02 | `login()` retorna el token y el usuario cuando el backend responde 200 | Unit |
| U-AUTH-03 | `login()` lanza un error cuando el backend responde 401 | Unit |
| U-AUTH-04 | `register()` envía POST a `/users/register` con todos los campos | Unit |
| U-AUTH-05 | `getProfile()` envía el token de autorización en el header | Unit |

### 1.2 `cartService` y `localCartService`
| ID | Caso de prueba | Tipo |
|----|----------------|------|
| U-CART-01 | `localCartService.addItem()` agrega un item al carrito local | Unit |
| U-CART-02 | `localCartService.addItem()` incrementa la cantidad si el item ya existe | Unit |
| U-CART-03 | `localCartService.removeItem()` elimina el item del carrito | Unit |
| U-CART-04 | `localCartService.clearCart()` vacía el carrito y borra del localStorage | Unit |
| U-CART-05 | `localCartService.getTotalItems()` retorna la suma de cantidades | Unit |
| U-CART-06 | `calculateCartTotals()` calcula subtotal y total correctamente | Unit |
| U-CART-07 | `calculateCartTotals()` maneja carrito vacío sin errores | Unit |
| U-CART-08 | `cartService.syncLocalCart()` envía los items locales al servidor | Unit |

### 1.3 `categoriesService`
| ID | Caso de prueba | Tipo |
|----|----------------|------|
| U-CAT-01 | `searchPaginated()` construye el query string correctamente con search + page + limit | Unit |
| U-CAT-02 | `searchPaginated()` sin params usa defaults (page=1, limit=20) | Unit |
| U-CAT-03 | `create()` envía FormData cuando se adjunta imagen | Unit |
| U-CAT-04 | `create()` envía JSON cuando no hay imagen | Unit |
| U-CAT-05 | `update()` incluye la imagen en FormData si se provee | Unit |
| U-CAT-06 | `delete()` envía DELETE al endpoint correcto | Unit |
| U-CAT-07 | `assignParent()` envía PATCH con el parentUuid | Unit |

### 1.4 `productsService`
| ID | Caso de prueba | Tipo |
|----|----------------|------|
| U-PROD-01 | `getPaginated()` construye los query params correctamente | Unit |
| U-PROD-02 | `bulkPublish()` envía el array de UUIDs y el flag published | Unit |
| U-PROD-03 | `bulkFeature()` envía el array de UUIDs y el flag featured | Unit |
| U-PROD-04 | `uploadImage()` envía FormData con el archivo y los metadatos | Unit |
| U-PROD-05 | `update()` no incluye `price` ni `inventory` en el payload | Unit |

### 1.5 `exchangeRateService`
| ID | Caso de prueba | Tipo |
|----|----------------|------|
| U-XR-01 | `getCurrentRate()` usa el valor en caché si no han pasado 5 minutos | Unit |
| U-XR-02 | `getCurrentRate()` hace fetch cuando el caché está vencido | Unit |
| U-XR-03 | `convertUsdToVes()` calcula la conversión correctamente | Unit |
| U-XR-04 | `convertVesToUsd()` calcula la conversión inversa correctamente | Unit |
| U-XR-05 | `clearCache()` fuerza un nuevo fetch en la próxima llamada | Unit |

### 1.6 `discountsService`
| ID | Caso de prueba | Tipo |
|----|----------------|------|
| U-DISC-01 | `validate()` envía el código y retorna descuento aplicable | Unit |
| U-DISC-02 | `validate()` lanza error cuando el código es inválido/expirado | Unit |

### 1.7 `ordersService`
| ID | Caso de prueba | Tipo |
|----|----------------|------|
| U-ORD-01 | `createOrder()` envía todos los campos requeridos del DTO | Unit |
| U-ORD-02 | `uploadReceipt()` envía FormData con el archivo del comprobante | Unit |
| U-ORD-03 | `filterOrders()` construye los query params de filtro correctamente | Unit |
| U-ORD-04 | `exportToCSV()` retorna un Blob con content-type correcto | Unit |

---

## 2. Pruebas de Componentes — React Testing Library

### 2.1 Contextos
| ID | Caso de prueba | Componente |
|----|----------------|------------|
| C-CTX-01 | `useAuth()` — `login()` guarda token y usuario en localStorage | AuthContext |
| C-CTX-02 | `useAuth()` — `logout()` limpia localStorage y resetea el estado | AuthContext |
| C-CTX-03 | `useAuth()` — `hasPermission()` retorna true/false según el rol | AuthContext |
| C-CTX-04 | `useAuth()` — carga el usuario desde localStorage al montar | AuthContext |
| C-CTX-05 | `useCart()` — `addToCart()` llama al servicio correcto según autenticación | CartContext |
| C-CTX-06 | `useCart()` — `getTotalItems()` retorna 0 cuando el carrito está vacío | CartContext |
| C-CTX-07 | `useCart()` — sincroniza el carrito local al hacer login | CartContext |
| C-CTX-08 | `useToast()` — `success()` agrega un toast con tipo correcto | ToastContext |
| C-CTX-09 | `useToast()` — los toasts desaparecen automáticamente después del timeout | ToastContext |

### 2.2 `ProductCard`
| ID | Caso de prueba |
|----|----------------|
| C-PC-01 | Muestra `customName` si existe, si no muestra `name` |
| C-PC-02 | Muestra precio en USD y en VES |
| C-PC-03 | Muestra badge "Sin stock" cuando `inventory === 0` |
| C-PC-04 | El botón "Agregar" está deshabilitado cuando no hay stock |
| C-PC-05 | Click en "Agregar" llama a `addToCart()` con el UUID y cantidad 1 |
| C-PC-06 | Muestra el skeleton de carga mientras carga la imagen |

### 2.3 `CartDrawer`
| ID | Caso de prueba |
|----|----------------|
| C-CD-01 | Muestra "Carrito vacío" cuando no hay items |
| C-CD-02 | Renderiza la lista de items del carrito |
| C-CD-03 | Click en "+" llama `updateQuantity()` con cantidad incrementada |
| C-CD-04 | Click en "−" llama `updateQuantity()` con cantidad decrementada |
| C-CD-05 | Click en eliminar item llama `removeFromCart()` |
| C-CD-06 | Click en "Vaciar carrito" llama `clearCart()` |
| C-CD-07 | Muestra el total en USD y VES |

### 2.4 `ConfirmModal`
| ID | Caso de prueba |
|----|----------------|
| C-CM-01 | Renderiza el título y mensaje recibidos por props |
| C-CM-02 | Click en "Confirmar" llama al callback `onConfirm` |
| C-CM-03 | Click en "Cancelar" llama al callback `onCancel` |
| C-CM-04 | No renderiza nada cuando `isOpen={false}` |

### 2.5 `CategoryPickerModal`
| ID | Caso de prueba |
|----|----------------|
| C-CPM-01 | Llama a `searchPaginated` al abrirse |
| C-CPM-02 | Debouncea la búsqueda (no llama en cada tecla) |
| C-CPM-03 | Muestra las categorías pre-seleccionadas aunque no estén en los resultados |
| C-CPM-04 | Click en "Confirmar" llama `onConfirm` con los items seleccionados |
| C-CPM-05 | Permite deseleccionar una categoría ya seleccionada |

### 2.6 `CategoriesTable`
| ID | Caso de prueba |
|----|----------------|
| C-CT-01 | Muestra ícono `FolderTree` para categorías padre |
| C-CT-02 | Muestra ícono `CornerDownRight` para subcategorías |
| C-CT-03 | Muestra ícono `Tag` para categorías independientes |
| C-CT-04 | Muestra el slug como subtexto gris bajo el nombre |
| C-CT-05 | Muestra `customName` si existe, si no muestra `name` |
| C-CT-06 | Click en la estrella llama `onToggleFeatured` con el UUID y valor actual |
| C-CT-07 | Click en eliminar abre el `ConfirmModal` |
| C-CT-08 | Confirmar eliminación llama `onDelete` con el UUID correcto |
| C-CT-09 | Muestra mensaje "Sin categorías" cuando el array está vacío |

### 2.7 `DiscountCodeInput`
| ID | Caso de prueba |
|----|----------------|
| C-DCI-01 | Muestra el input vacío por defecto |
| C-DCI-02 | Click en "Aplicar" llama `validate()` con el código ingresado |
| C-DCI-03 | Muestra el monto de descuento cuando el código es válido |
| C-DCI-04 | Muestra mensaje de error cuando el código es inválido |
| C-DCI-05 | El botón "Aplicar" está deshabilitado si el input está vacío |

### 2.8 `Toggle` (UI)
| ID | Caso de prueba |
|----|----------------|
| C-TG-01 | Renderiza con el estado `checked` inicial correcto |
| C-TG-02 | Click llama `onChange` con el valor invertido |
| C-TG-03 | Muestra el label y description recibidos por props |

---

## 3. Pruebas E2E — Playwright

> Los tests E2E prueban flujos completos desde el navegador. Usar `page.getByRole()` y `page.getByTestId()` en lugar de selectores por clase o texto exacto.

### 3.1 Autenticación
| ID | Flujo | Ruta |
|----|-------|------|
| E-AUTH-01 | Login exitoso con credenciales correctas → redirección según rol | `/login` |
| E-AUTH-02 | Login fallido muestra mensaje de error visible | `/login` |
| E-AUTH-03 | Admin autenticado puede acceder a `/admin/dashboard` | `/admin/dashboard` |
| E-AUTH-04 | Usuario sin rol admin es redirigido fuera del dashboard | `/admin/dashboard` |
| E-AUTH-05 | Logout limpia la sesión y redirige al login | cualquier página |
| E-AUTH-06 | Registro con invitación válida crea cuenta y hace login automático | `/register/invitation` |
| E-AUTH-07 | Token de invitación expirado muestra error claro | `/register/invitation` |

### 3.2 Carrito de compras
| ID | Flujo | Ruta |
|----|-------|------|
| E-CART-01 | Agregar producto al carrito muestra el badge actualizado en el header | `/productos` |
| E-CART-02 | Abrir el drawer muestra el producto agregado | `/productos` |
| E-CART-03 | Cambiar cantidad en el drawer actualiza el total | drawer |
| E-CART-04 | Eliminar item del drawer lo remueve de la lista | drawer |
| E-CART-05 | Vaciar carrito deja el badge en 0 | drawer |
| E-CART-06 | Producto sin stock no tiene botón "Agregar" activo | `/productos` |

### 3.3 Checkout (flujo completo)
| ID | Flujo | Ruta |
|----|-------|------|
| E-CHK-01 | Completar los 4 pasos y crear orden exitosamente | `/checkout` |
| E-CHK-02 | No puede avanzar al paso 2 sin completar los campos requeridos del paso 1 | `/checkout` |
| E-CHK-03 | Código de descuento válido reduce el total visible | `/checkout` → paso 4 |
| E-CHK-04 | Código de descuento inválido muestra error | `/checkout` → paso 4 |
| E-CHK-05 | Subir comprobante de pago avanza a pantalla de confirmación | `/checkout` |
| E-CHK-06 | Checkout vacío sin items redirige a `/productos` | `/checkout` |

### 3.4 Catálogo de productos
| ID | Flujo | Ruta |
|----|-------|------|
| E-PROD-01 | Búsqueda de producto filtra los resultados visibles | `/productos` |
| E-PROD-02 | Filtro por categoría muestra solo productos de esa categoría | `/productos` |
| E-PROD-03 | Paginación navega correctamente entre páginas | `/productos` |
| E-PROD-04 | Click en producto navega a la página de detalle | `/productos` |
| E-PROD-05 | Página de detalle muestra nombre, precio USD/VES e inventario | `/productos/[uuid]` |

### 3.5 Admin — Gestión de productos
| ID | Flujo | Ruta |
|----|-------|------|
| E-APROD-01 | Crear producto con todos los campos obligatorios | `/admin/dashboard/productos/nuevo` |
| E-APROD-02 | Crear producto sin nombre muestra error de validación | `/admin/dashboard/productos/nuevo` |
| E-APROD-03 | Editar producto actualiza los datos en la tabla | `/admin/dashboard/productos/[id]` |
| E-APROD-04 | Eliminar producto muestra modal de confirmación y lo remueve de la lista | `/admin/dashboard/productos` |
| E-APROD-05 | Buscar producto en la tabla filtra los resultados | `/admin/dashboard/productos` |
| E-APROD-06 | Publicación masiva marca los seleccionados como publicados | `/admin/dashboard/productos` |
| E-APROD-07 | Subir imagen de producto la muestra en la galería | `/admin/dashboard/productos/[id]` |

### 3.6 Admin — Gestión de categorías
| ID | Flujo | Ruta |
|----|-------|------|
| E-ACAT-01 | Crear categoría con nombre y slug válidos | `/admin/dashboard/categories/new` |
| E-ACAT-02 | Slug se auto-genera desde el nombre | `/admin/dashboard/categories/new` |
| E-ACAT-03 | Crear categoría destacada sin imagen muestra error de validación | `/admin/dashboard/categories/new` |
| E-ACAT-04 | Marcar categoría como destacada sin imagen abre modal para subir imagen | `/admin/dashboard/categories` |
| E-ACAT-05 | Categoría con `externalCode` tiene el campo nombre bloqueado | `/admin/dashboard/categories/[uuid]` |
| E-ACAT-06 | Buscar categoría filtra los resultados en tiempo real | `/admin/dashboard/categories` |
| E-ACAT-07 | Paginación funciona cuando hay más de 15 categorías | `/admin/dashboard/categories` |
| E-ACAT-08 | Eliminar categoría muestra confirmación y la remueve | `/admin/dashboard/categories` |

### 3.7 Admin — Gestión de órdenes
| ID | Flujo | Ruta |
|----|-------|------|
| E-AORD-01 | Lista de órdenes carga con estadísticas | `/admin/dashboard/ordenes` |
| E-AORD-02 | Filtrar por estado muestra solo órdenes de ese estado | `/admin/dashboard/ordenes` |
| E-AORD-03 | Actualizar estado de una orden | `/admin/dashboard/ordenes/[uuid]` |
| E-AORD-04 | Ver comprobante de pago adjunto a la orden | `/admin/dashboard/ordenes/[uuid]` |
| E-AORD-05 | Exportar CSV descarga el archivo | `/admin/dashboard/ordenes` |

### 3.8 Admin — Usuarios e Invitaciones
| ID | Flujo | Ruta |
|----|-------|------|
| E-AUSR-01 | Crear usuario con rol específico | `/admin/dashboard/usuarios/nuevo` |
| E-AUSR-02 | Cambiar rol de usuario | `/admin/dashboard/usuarios/[uuid]` |
| E-AUSR-03 | Desactivar/activar usuario | `/admin/dashboard/usuarios/[uuid]` |
| E-AINV-01 | Enviar invitación a email | `/admin/dashboard/invitaciones` |
| E-AINV-02 | Revocar invitación pendiente | `/admin/dashboard/invitaciones` |
| E-AINV-03 | Filtrar invitaciones por estado | `/admin/dashboard/invitaciones` |

### 3.9 Admin — Cupones
| ID | Flujo | Ruta |
|----|-------|------|
| E-ACUP-01 | Crear cupón con porcentaje y fecha de expiración | `/admin/dashboard/cupones/new` |
| E-ACUP-02 | Cupón vencido no se puede aplicar en checkout | `/checkout` |
| E-ACUP-03 | Cupón con límite de usos no acepta más usos al agotarse | `/checkout` |

---

## 4. Resumen de cobertura objetivo

| Capa | Tests | Cobertura objetivo |
|------|-------|--------------------|
| Unitaria (servicios) | ~40 | 80% de los métodos críticos |
| Componentes | ~45 | Componentes con lógica de negocio |
| E2E | ~50 | Todos los flujos críticos de usuario |
| **Total** | **~135** | — |

---

## 5. Configuración inicial (comandos)

```bash
# Instalar dependencias de prueba
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# Instalar Playwright (ya configurado, solo instalar browsers si hace falta)
npx playwright install chromium
```

`vitest.config.ts` en la raíz:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

`src/test/setup.ts`:
```ts
import '@testing-library/jest-dom';
```

Agregar script en `package.json`:
```json
"scripts": {
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:e2e": "playwright test"
}
```

---

## 6. Estructura de carpetas sugerida

```
src/
├── services/
│   └── __tests__/
│       ├── auth.test.ts
│       ├── cart.test.ts
│       ├── categories.test.ts
│       ├── products.test.ts
│       └── exchangeRate.test.ts
├── context/
│   └── __tests__/
│       ├── AuthContext.test.tsx
│       └── CartContext.test.tsx
└── components/
    └── __tests__/
        ├── ProductCard.test.tsx
        ├── CartDrawer.test.tsx
        ├── CategoriesTable.test.tsx
        └── ConfirmModal.test.tsx
e2e/
├── auth.spec.ts
├── cart.spec.ts
├── checkout.spec.ts
├── productos.spec.ts
├── admin-productos.spec.ts
├── admin-categorias.spec.ts
├── admin-ordenes.spec.ts
├── admin-usuarios.spec.ts
├── cupones.spec.ts
├── invitations.spec.ts   ← ya existe
└── banner.spec.ts        ← ya existe
```
