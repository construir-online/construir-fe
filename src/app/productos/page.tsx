"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, PackageSearch } from "lucide-react";
import { productsService } from "@/services/products";
import type { Product } from "@/types";
import { CategoryMenu } from "@/components/CategoryMenu";
import CategoryChips from "@/components/CategoryChips";
import SearchBar from "@/components/SearchBar";
import ProductCard from "@/components/product/ProductCard";
import ProductCardSkeleton from "@/components/product/ProductCardSkeleton";
import CartSummaryBar from "@/components/cart/CartSummaryBar";
import {
  SORT_OPTIONS,
  applyProductListChange,
  buildPageWindow,
  buildProductListHref,
  parseProductListParams,
  toApiParams,
  type ProductListState,
} from "@/lib/product-list-params";

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Todo el estado del listado se lee de la URL, no de `useState`. Así el botón
  // "atrás", recargar y compartir el enlace llevan siempre a la misma pantalla.
  const estado = parseProductListParams(searchParams);
  const { search, categoria, sortKey, page } = estado;

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /** Navega al listado con `cambio` aplicado, dejando entrada en el historial. */
  const irA = useCallback(
    (cambio: Partial<ProductListState>) => {
      router.push(buildProductListHref(applyProductListChange(estado, cambio)));
    },
    [router, estado],
  );

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await productsService.getPublicPaginated(
          toApiParams({ search, categoria, sortKey, page }),
        );
        // La respuesta de una búsqueda anterior no debe pisar a la actual
        // cuando el usuario cambia de página rápido.
        if (cancelado) return;
        setProducts(response.data);
        setTotal(response.total);
        setLastPage(Math.max(1, response.lastPage));
      } catch (err: unknown) {
        if (cancelado) return;
        setError(err instanceof Error ? err.message : "Error al cargar productos");
      } finally {
        if (!cancelado) setLoading(false);
      }
    };

    cargar();
    return () => {
      cancelado = true;
    };
  }, [search, categoria, sortKey, page]);

  // Al cambiar de página la lista se reemplaza entera: si no se sube, el
  // usuario aterriza a mitad de la página nueva sin ver que cambió.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const ventana = buildPageWindow(page, lastPage);

  return (
    <div className="min-h-screen bg-sand-50 pb-28 md:pb-0">
      {/* Cabecera propia: en móvil esta pantalla no muestra el navbar global */}
      <div className="sticky top-0 z-20 border-b border-sand-200 bg-white md:hidden">
        <div className="flex items-center gap-2.5 px-4 pb-3 pt-[calc(0.5rem+env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver"
            className="-ml-2.5 flex h-11 w-11 flex-none items-center justify-center rounded-lg text-ink hover:bg-sand-100"
          >
            <ArrowLeft className="h-[19px] w-[19px]" />
          </button>
          <div className="min-w-0 flex-1">
            <SearchBar />
          </div>
        </div>
        <div className="px-4 pb-3">
          <CategoryChips className="-mx-4 px-4" />
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Menú lateral de categorías */}
          <aside className="hidden w-full flex-shrink-0 md:block lg:w-64">
            <CategoryMenu />
          </aside>

          <div className="flex-1">
            {/* Recuento y orden */}
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <span className="text-[13px] font-bold text-sand-700">
                {loading
                  ? "Buscando…"
                  : `${total} ${total === 1 ? "producto" : "productos"}`}
              </span>
              <label className="flex items-center gap-1 text-[12.5px] font-bold text-brand-600">
                <span className="sr-only">Ordenar por</span>
                <select
                  value={sortKey}
                  onChange={(e) => irA({ sortKey: e.target.value })}
                  className="cursor-pointer appearance-none bg-transparent pr-1 text-right font-bold text-brand-600 focus:outline-none"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span aria-hidden="true">▾</span>
              </label>
            </div>

            {error && (
              <div className="mb-6 rounded-xl bg-danger-50 p-4">
                <p className="text-sm text-danger-700">{error}</p>
              </div>
            )}

            {loading && (
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            )}

            {!loading && !error && products.length === 0 && (
              <div className="rounded-2xl border border-sand-300 bg-white py-14 text-center">
                <PackageSearch
                  className="mx-auto mb-4 h-11 w-11 text-sand-500"
                  strokeWidth={1.6}
                />
                <p className="font-display text-lg font-bold text-ink">
                  No hay productos disponibles
                </p>
                {(categoria || search) && (
                  <p className="mt-2 text-sm text-sand-600">
                    Intenta ajustar tus filtros de búsqueda
                  </p>
                )}
              </div>
            )}

            {!loading && products.length > 0 && (
              <>
                <div className="mb-6 grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3">
                  {products.map((product, index) => (
                    <ProductCard
                      key={product.uuid}
                      product={product}
                      variant="default"
                      showAddToCart={true}
                      showBadges={true}
                      showDescription={false}
                      showStock={true}
                      priority={index < 6}
                    />
                  ))}
                </div>

                {/*
                  Paginado en vez de scroll infinito: el listado tenía un
                  IntersectionObserver que cargaba otra página cada vez que el
                  final de la lista entraba en pantalla, así que el pie de
                  página se alejaba justo cuando uno intentaba llegar a él y con
                  1089 productos publicados no había forma de alcanzarlo.
                */}
                {lastPage > 1 && (
                  <nav
                    aria-label="Paginación de productos"
                    className="flex flex-wrap items-center justify-center gap-1.5 py-2"
                  >
                    <PaginaLink
                      estado={estado}
                      pagina={page - 1}
                      deshabilitado={page <= 1}
                      etiqueta="Página anterior"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </PaginaLink>

                    {ventana.map((numero, indice) =>
                      numero === null ? (
                        <span
                          key={`hueco-${indice}`}
                          aria-hidden="true"
                          className="px-1 text-sm text-sand-600"
                        >
                          …
                        </span>
                      ) : (
                        <PaginaLink
                          key={numero}
                          estado={estado}
                          pagina={numero}
                          etiqueta={`Página ${numero}`}
                          activo={numero === page}
                        >
                          {numero}
                        </PaginaLink>
                      ),
                    )}

                    <PaginaLink
                      estado={estado}
                      pagina={page + 1}
                      deshabilitado={page >= lastPage}
                      etiqueta="Página siguiente"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </PaginaLink>
                  </nav>
                )}

                <p className="pb-2 pt-1 text-center text-xs text-sand-600">
                  Página {page} de {lastPage}
                </p>
              </>
            )}
          </div>
        </div>
      </main>

      <CartSummaryBar />
    </div>
  );
}

/**
 * Un botón del paginador. Es un `<Link>` de verdad y no un `onClick` para que
 * se pueda abrir en otra pestaña, copiar el enlace, y ver a dónde lleva en la
 * barra de estado del navegador.
 */
function PaginaLink({
  estado,
  pagina,
  etiqueta,
  activo = false,
  deshabilitado = false,
  children,
}: {
  estado: ProductListState;
  pagina: number;
  etiqueta: string;
  activo?: boolean;
  deshabilitado?: boolean;
  children: React.ReactNode;
}) {
  const clases =
    "flex h-10 min-w-10 items-center justify-center rounded-xl border px-2.5 text-sm font-bold transition-colors";

  if (deshabilitado) {
    return (
      <span
        aria-hidden="true"
        className={`${clases} cursor-not-allowed border-sand-200 text-sand-400`}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={buildProductListHref({ ...estado, page: pagina })}
      aria-label={etiqueta}
      aria-current={activo ? "page" : undefined}
      className={`${clases} ${
        activo
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-sand-300 bg-white text-sand-700 hover:bg-sand-100"
      }`}
    >
      {children}
    </Link>
  );
}

export default function ProductsPage() {
  // `useSearchParams` obliga a un límite de Suspense para que la ruta se pueda
  // prerenderizar; sin él `next build` falla.
  return (
    <Suspense fallback={<div className="min-h-screen bg-sand-50" />}>
      <ProductsPageContent />
    </Suspense>
  );
}
