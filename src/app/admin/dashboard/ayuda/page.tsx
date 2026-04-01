'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FolderTree,
  Users,
  Image as ImageIcon,
  Tag,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Camera,
  ChevronRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Subflow {
  id: string;
  label: string;
  description: string;
  steps: { text: string }[];
  notes?: { text: string }[];
}

interface Section {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  subflows: Subflow[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const sections: Section[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin/dashboard',
    subflows: [
      {
        id: 'general',
        label: 'Vista general',
        description: 'Métricas clave del negocio en tiempo real.',
        steps: [
          { text: 'Al ingresar verás las tarjetas de KPIs: total de órdenes, ingresos del mes, clientes registrados y productos activos.' },
          { text: 'Cada tarjeta muestra la variación respecto al mes anterior (positivo en verde, negativo en rojo).' },
          { text: 'El gráfico central muestra la tendencia de ventas de los últimos 30 días.' },
        ],
      },
      {
        id: 'stock-bajo',
        label: 'Stock bajo',
        description: 'Identifica productos que necesitan reabastecimiento.',
        steps: [
          { text: 'La sección "Stock Bajo" lista productos con inventario crítico (por debajo del umbral configurado).' },
          { text: 'Haz clic en cualquier producto de la lista para ir directamente a su página de edición.' },
          { text: 'Actualiza el campo "Inventario" y guarda para reflejar el nuevo stock.' },
        ],
        notes: [
          { text: 'El umbral de stock bajo está fijo en 5 unidades.' },
        ],
      },
      {
        id: 'ordenes-recientes',
        label: 'Órdenes recientes',
        description: 'Vista rápida de los últimos pedidos.',
        steps: [
          { text: 'La tabla "Órdenes Recientes" muestra los últimos 5 pedidos con cliente, monto y estado.' },
          { text: 'Haz clic en una orden para ir al detalle completo.' },
          { text: 'Usa el enlace "Ver todas las órdenes" para ir al listado completo con filtros.' },
        ],
      },
    ],
  },
  {
    id: 'productos',
    label: 'Productos',
    icon: Package,
    href: '/admin/dashboard/productos',
    subflows: [
      {
        id: 'crear',
        label: 'Crear',
        description: 'Agrega un nuevo producto al catálogo.',
        steps: [
          { text: 'Ve a Productos → haz clic en "Nuevo Producto" (botón azul, esquina superior derecha).' },
          { text: 'Completa los campos obligatorios: nombre, precio USD, precio Bs. y categoría.' },
          { text: 'Agrega una descripción clara del producto.' },
          { text: 'Ingresa el stock inicial en el campo "Inventario".' },
          { text: 'Haz clic en "Guardar" para crear el producto en estado inactivo, o activa el toggle "Publicado" antes de guardar.' },
        ],
      },
      {
        id: 'editar',
        label: 'Editar',
        description: 'Modifica datos de un producto existente.',
        steps: [
          { text: 'En la tabla de Productos, haz clic en el ícono de lápiz (✏) de la fila del producto.' },
          { text: 'Modifica los campos que necesites: nombre, precios, descripción, categoría o stock.' },
          { text: 'Haz clic en "Guardar cambios" para confirmar.' },
        ],
      },
      {
        id: 'eliminar',
        label: 'Eliminar',
        description: 'Elimina un producto del catálogo de forma permanente.',
        steps: [
          { text: 'En la tabla, haz clic en el ícono de papelera (🗑) del producto.' },
          { text: 'Confirma la acción en el diálogo de confirmación.' },
        ],
        notes: [
          { text: 'Eliminar un producto es irreversible. Si solo quieres ocultarlo, desactívalo en lugar de eliminarlo.' },
        ],
      },
      {
        id: 'imagenes',
        label: 'Imágenes',
        description: 'Sube y gestiona las fotos del producto.',
        steps: [
          { text: 'Dentro del formulario de producto, ve a la sección "Imágenes".' },
          { text: 'Arrastra archivos o haz clic en el área de carga para seleccionar imágenes (JPG, PNG, WebP).' },
          { text: 'Haz clic en la estrella (⭐) de una imagen para marcarla como primaria — esa se mostrará en listados y búsquedas.' },
          { text: 'Elimina imágenes individuales con el botón × en cada miniatura.' },
        ],
        notes: [
          { text: 'Siempre marca al menos una imagen como primaria. Sin imagen primaria el producto mostrará un ícono genérico.' },
        ],
      },
      {
        id: 'publicar',
        label: 'Publicar / Destacar',
        description: 'Controla la visibilidad y la posición destacada del producto.',
        steps: [
          { text: '"Publicado": activa este toggle para que el producto sea visible en la tienda.' },
          { text: '"Destacado": activa este toggle para que aparezca en la sección de destacados de la página principal.' },
          { text: 'Puedes cambiar ambos estados desde la tabla de productos con el toggle inline, sin necesidad de abrir el formulario completo.' },
        ],
      },
      {
        id: 'masivas',
        label: 'Acciones masivas',
        description: 'Aplica cambios a múltiples productos a la vez.',
        steps: [
          { text: 'Marca la casilla de selección en las filas que quieres modificar (o la casilla del encabezado para seleccionar todos).' },
          { text: 'Aparece la barra de acciones masivas en la parte superior.' },
          { text: 'Elige la acción: "Publicar", "Despublicar" o "Eliminar".' },
          { text: 'Confirma la acción cuando el sistema lo solicite.' },
        ],
      },
    ],
  },
  {
    id: 'ordenes',
    label: 'Órdenes',
    icon: ShoppingCart,
    href: '/admin/dashboard/ordenes',
    subflows: [
      {
        id: 'lista',
        label: 'Ver lista',
        description: 'Revisa todos los pedidos recibidos.',
        steps: [
          { text: 'La tabla muestra todas las órdenes con número, cliente, monto total, fecha y estado.' },
          { text: 'Ordena columnas haciendo clic en el encabezado.' },
          { text: 'Usa la paginación en la parte inferior para navegar entre páginas.' },
        ],
      },
      {
        id: 'filtrar',
        label: 'Filtrar',
        description: 'Filtra pedidos por estado o rango de fechas.',
        steps: [
          { text: 'Usa el selector "Estado" para filtrar por: Pendiente, Procesando, Enviado, Completado o Cancelado.' },
          { text: 'Usa los campos de fecha "Desde" y "Hasta" para acotar el período.' },
          { text: 'Los filtros se aplican automáticamente al cambiar cualquier valor.' },
        ],
      },
      {
        id: 'detalle',
        label: 'Ver detalle',
        description: 'Consulta toda la información de un pedido.',
        steps: [
          { text: 'Haz clic en el número de orden o en el ícono de ojo (👁) para abrir el detalle.' },
          { text: 'Verás: productos comprados con cantidades y precios, datos del cliente, dirección de envío y método de pago.' },
          { text: 'El historial de estados muestra cuándo cambió cada estado.' },
        ],
      },
      {
        id: 'estado',
        label: 'Actualizar estado',
        description: 'Cambia el estado de un pedido.',
        steps: [
          { text: 'Dentro del detalle de la orden, localiza el selector "Estado actual".' },
          { text: 'Elige el nuevo estado en el menú desplegable.' },
          { text: 'Haz clic en "Actualizar" para guardar el cambio.' },
        ],
        notes: [
          { text: 'El rol "Gestor de Pedidos" puede actualizar estados pero no tiene acceso a otras secciones del panel.' },
        ],
      },
      {
        id: 'exportar',
        label: 'Exportar CSV',
        description: 'Descarga un reporte de órdenes en formato Excel/CSV.',
        steps: [
          { text: 'Aplica los filtros deseados (estado, fechas).' },
          { text: 'Haz clic en el botón "Exportar CSV" en la esquina superior derecha.' },
          { text: 'El archivo descargado incluye todas las órdenes que coinciden con los filtros activos.' },
        ],
      },
    ],
  },
  {
    id: 'categorias',
    label: 'Categorías',
    icon: FolderTree,
    href: '/admin/dashboard/categories',
    subflows: [
      {
        id: 'crear-padre',
        label: 'Crear categoría padre',
        description: 'Crea una categoría principal de primer nivel.',
        steps: [
          { text: 'Ve a Categorías → haz clic en "Nueva Categoría".' },
          { text: 'Ingresa el nombre (ej: "Herramientas").' },
          { text: 'El slug se genera automáticamente (ej: herramientas). Puedes editarlo si lo necesitas.' },
          { text: 'Deja el campo "Categoría padre" vacío.' },
          { text: 'Haz clic en "Guardar".' },
        ],
      },
      {
        id: 'crear-hijo',
        label: 'Crear subcategoría',
        description: 'Crea una categoría hijo anidada bajo otra.',
        steps: [
          { text: 'Ve a Categorías → "Nueva Categoría".' },
          { text: 'Ingresa nombre y slug para la subcategoría.' },
          { text: 'En el campo "Categoría padre", selecciona la categoría a la que pertenece.' },
          { text: 'Guarda. La subcategoría aparecerá anidada en el menú lateral de la tienda.' },
        ],
      },
      {
        id: 'editar',
        label: 'Editar',
        description: 'Modifica nombre, slug o categoría padre.',
        steps: [
          { text: 'En la tabla de categorías, haz clic en el ícono de lápiz de la fila.' },
          { text: 'Modifica los campos necesarios.' },
          { text: 'Guarda los cambios.' },
        ],
        notes: [
          { text: 'Cambiar el slug afecta las URLs de la tienda. Los bookmarks y links externos quedarán rotos.' },
        ],
      },
      {
        id: 'activar',
        label: 'Activar / Desactivar',
        description: 'Controla si la categoría es visible en la tienda.',
        steps: [
          { text: 'En la tabla, usa el toggle de la columna "Activa" para activar o desactivar la categoría.' },
          { text: 'Las categorías inactivas no aparecen en el menú lateral de la tienda ni en filtros de búsqueda.' },
        ],
        notes: [
          { text: 'No puedes eliminar una categoría con productos asignados. Primero reasigna o elimina los productos.' },
        ],
      },
    ],
  },
  {
    id: 'clientes',
    label: 'Clientes',
    icon: Users,
    href: '/admin/dashboard/clientes',
    subflows: [
      {
        id: 'lista',
        label: 'Ver lista',
        description: 'Consulta todos los clientes registrados.',
        steps: [
          { text: 'La tabla muestra nombre, email, teléfono y fecha de registro de cada cliente.' },
          { text: 'Usa la barra de búsqueda para encontrar un cliente por nombre o email.' },
          { text: 'Ordena la tabla por fecha de registro o nombre haciendo clic en el encabezado.' },
        ],
      },
      {
        id: 'historial',
        label: 'Ver historial',
        description: 'Consulta todas las compras de un cliente.',
        steps: [
          { text: 'Haz clic en el nombre del cliente o en el ícono de detalle.' },
          { text: 'Verás sus datos de contacto y el historial completo de órdenes.' },
          { text: 'Haz clic en cualquier orden del historial para ir al detalle de esa compra.' },
        ],
      },
    ],
  },
  {
    id: 'banners',
    label: 'Banners',
    icon: ImageIcon,
    href: '/admin/dashboard/banners',
    subflows: [
      {
        id: 'crear',
        label: 'Crear banner',
        description: 'Agrega una imagen al carousel de la página principal.',
        steps: [
          { text: 'Ve a Banners → "Nuevo Banner".' },
          { text: 'Sube la imagen (recomendado: 1200×400 px, JPG o PNG).' },
          { text: 'Agrega título y subtítulo opcionales (se muestran sobre la imagen).' },
          { text: 'En el campo "Enlace" escribe la URL a la que redirige al hacer clic (ej: /productos?categoria=herramientas).' },
          { text: 'Guarda. El banner se agrega al final del carousel.' },
        ],
      },
      {
        id: 'ordenar',
        label: 'Ordenar',
        description: 'Ajusta el orden de aparición en el carousel.',
        steps: [
          { text: 'En la lista de banners, usa los controles de orden (flechas ↑↓) para cambiar la posición de cada banner.' },
          { text: 'El banner con número de orden más bajo aparece primero en el carousel.' },
        ],
      },
      {
        id: 'activar',
        label: 'Activar / Desactivar',
        description: 'Controla qué banners son visibles sin necesidad de eliminarlos.',
        steps: [
          { text: 'Usa el toggle "Activo" en la fila del banner para activarlo o desactivarlo.' },
          { text: 'Los banners inactivos no aparecen en la tienda pero se conservan para uso futuro.' },
        ],
      },
    ],
  },
  {
    id: 'cupones',
    label: 'Cupones',
    icon: Tag,
    href: '/admin/dashboard/cupones',
    subflows: [
      {
        id: 'crear',
        label: 'Crear cupón',
        description: 'Define un nuevo código de descuento.',
        steps: [
          { text: 'Ve a Cupones → "Nuevo Cupón".' },
          { text: 'Ingresa el código (ej: DESCUENTO10). Los clientes lo escriben en el carrito.' },
          { text: 'Establece fechas de inicio y expiración.' },
          { text: 'Opcionalmente limita el número máximo de usos totales o por cliente.' },
          { text: 'Activa el toggle "Activo" y guarda.' },
        ],
        notes: [
          { text: 'Los cupones expirados se desactivan automáticamente en la tienda.' },
        ],
      },
      {
        id: 'tipos',
        label: 'Tipos de descuento',
        description: 'Porcentaje vs. monto fijo.',
        steps: [
          { text: 'Tipo "Porcentaje": descuenta un % del total del carrito (ej: 10% → $100 queda en $90).' },
          { text: 'Tipo "Monto fijo": descuenta una cantidad exacta en USD (ej: $5 → $100 queda en $95).' },
          { text: 'Selecciona el tipo al crear el cupón y define el valor correspondiente.' },
        ],
      },
    ],
  },
  {
    id: 'usuarios',
    label: 'Usuarios Admin',
    icon: ShieldCheck,
    href: '/admin/dashboard/usuarios',
    subflows: [
      {
        id: 'crear',
        label: 'Crear usuario',
        description: 'Agrega una nueva cuenta de acceso al panel.',
        steps: [
          { text: 'Ve a Usuarios → "Nuevo Usuario".' },
          { text: 'Completa nombre, apellido, email y contraseña temporal.' },
          { text: 'Asigna el rol (ver tab "Roles y permisos").' },
          { text: 'Guarda. El usuario puede iniciar sesión en /admin/login de inmediato.' },
        ],
      },
      {
        id: 'roles',
        label: 'Roles y permisos',
        description: 'Diferencias entre los roles disponibles.',
        steps: [
          { text: '"Admin" — acceso completo: productos, órdenes, categorías, clientes, banners, cupones, usuarios y ayuda.' },
          { text: '"Gestor de Pedidos" — acceso limitado: solo dashboard, órdenes y ayuda.' },
          { text: 'Para desactivar una cuenta, edita el usuario y cambia su estado a inactivo.' },
        ],
        notes: [
          { text: 'Solo los usuarios con rol "Admin" pueden crear o modificar otros usuarios.' },
        ],
      },
    ],
  },
];

// ─── ScreenshotSlot ───────────────────────────────────────────────────────────

function ScreenshotSlot({ sectionId, subflowId }: { sectionId: string; subflowId: string }) {
  const [hasError, setHasError] = useState(false);
  const filename = `${sectionId}-${subflowId}.png`;
  const src = `/screenshots/${filename}`;

  if (hasError) {
    return (
      <div className="w-full aspect-video rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 text-gray-400 mb-6">
        <Camera className="w-8 h-8" />
        <p className="text-sm text-center px-4">
          Captura no disponible.<br />
          <span className="font-mono text-xs bg-gray-100 px-1 rounded">npm run screenshots</span>
          {' '}para generarla.
        </p>
        <p className="text-xs text-gray-300 font-mono">public/screenshots/{filename}</p>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`Captura: ${sectionId} - ${subflowId}`}
      className="w-full aspect-video object-cover object-top rounded-lg border border-gray-200 shadow-sm mb-6"
      onError={() => setHasError(true)}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AyudaPage() {
  const [activeSectionId, setActiveSectionId] = useState<string>('dashboard');
  const [activeSubflowId, setActiveSubflowId] = useState<string>('general');

  const activeSection = sections.find(s => s.id === activeSectionId)!;

  const handleSectionChange = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId)!;
    setActiveSectionId(sectionId);
    setActiveSubflowId(section.subflows[0].id);
  };

  const activeSubflow = activeSection.subflows.find(sf => sf.id === activeSubflowId)
    ?? activeSection.subflows[0];

  const SectionIcon = activeSection.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Centro de Ayuda</h1>
        <p className="text-gray-500 mt-1">Guía de referencia para administradores del panel.</p>
      </div>

      {/* Level 1 — Section tabs */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="flex border-b border-gray-200 min-w-max">
          {sections.map((section) => {
            const TabIcon = section.icon;
            const isActive = section.id === activeSectionId;
            return (
              <button
                key={section.id}
                onClick={() => handleSectionChange(section.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-b-2 border-blue-600 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content card */}
      <div className="bg-white rounded-lg shadow p-6">
        {/* Section header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <SectionIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{activeSection.label}</h2>
              <p className="text-gray-500 text-sm mt-0.5">{activeSubflow.description}</p>
            </div>
          </div>
          <Link
            href={activeSection.href}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
          >
            Ir a {activeSection.label}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Level 2 — Subflow tabs */}
        <div className="flex flex-wrap gap-2 mb-6 pb-5 border-b border-gray-100">
          {activeSection.subflows.map((sf) => (
            <button
              key={sf.id}
              onClick={() => setActiveSubflowId(sf.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                sf.id === activeSubflowId
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>

        {/* Screenshot */}
        <ScreenshotSlot sectionId={activeSectionId} subflowId={activeSubflowId} />

        {/* Steps */}
        <div className="space-y-3">
          {activeSubflow.steps.map((step, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                {index + 1}
              </span>
              <p className="text-gray-700 text-sm leading-relaxed pt-0.5">{step.text}</p>
            </div>
          ))}
        </div>

        {/* Notes */}
        {activeSubflow.notes && activeSubflow.notes.length > 0 && (
          <div className="mt-5 space-y-3">
            {activeSubflow.notes.map((note, index) => (
              <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">{note.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Accesos rápidos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {sections.map((section) => {
            const LinkIcon = section.icon;
            return (
              <Link
                key={section.id}
                href={section.href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <LinkIcon className="w-4 h-4 text-gray-500" />
                <span className="truncate">{section.label}</span>
                <ChevronRight className="w-3 h-3 text-gray-400 ml-auto flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
