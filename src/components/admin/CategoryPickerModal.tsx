'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Tag, Loader2 } from 'lucide-react';
import { categoriesService } from '@/services/categories';

export interface CategoryItem {
  uuid: string;
  name: string;
}

interface CategoryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: CategoryItem[];
  onConfirm: (items: CategoryItem[]) => void;
}

export default function CategoryPickerModal({
  isOpen,
  onClose,
  selectedItems,
  onConfirm,
}: CategoryPickerModalProps) {
  const [draft, setDraft] = useState<CategoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCategories = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const res = await categoriesService.searchPaginated({ search: query || undefined, limit: 20 });
      setResults(res.data.map((c) => ({ uuid: c.uuid, name: c.customName ?? c.name })));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setDraft([...selectedItems]);
      setSearch('');
      fetchCategories('');
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen, selectedItems, fetchCategories]);

  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchCategories(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, isOpen, fetchCategories]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isSelected = (uuid: string) => draft.some((d) => d.uuid === uuid);

  const toggle = (item: CategoryItem) => {
    setDraft((prev) =>
      prev.some((d) => d.uuid === item.uuid)
        ? prev.filter((d) => d.uuid !== item.uuid)
        : [...prev, item]
    );
  };

  // Merge: selected items first, then remaining results (no duplicates)
  const selectedUuids = new Set(draft.map((d) => d.uuid));
  const selectedInResults = results.filter((r) => selectedUuids.has(r.uuid));
  const unselectedInResults = results.filter((r) => !selectedUuids.has(r.uuid));
  // Selected items not in current results (from previous searches)
  const selectedNotInResults = draft.filter((d) => !results.some((r) => r.uuid === d.uuid));

  const displayList: CategoryItem[] = [
    ...selectedNotInResults,
    ...selectedInResults,
    ...unselectedInResults,
  ];

  const handleConfirm = () => {
    onConfirm(draft);
    onClose();
  };

  const draftChanged =
    draft.length !== selectedItems.length ||
    draft.some((d) => !selectedItems.some((s) => s.uuid === d.uuid));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md animate-[modalSlide_0.3s_ease-out]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-semibold text-gray-900">Seleccionar categorías</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Buscador */}
          <div className="px-6 pt-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar categoría..."
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {draft.length > 0 && (
              <p className="mt-2 text-xs text-blue-600 font-medium">
                {draft.length} {draft.length === 1 ? 'seleccionada' : 'seleccionadas'}
              </p>
            )}
          </div>

          {/* Lista */}
          <div className="overflow-y-auto max-h-72 px-3 py-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              </div>
            ) : displayList.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No se encontraron categorías
              </p>
            ) : (
              displayList.map((item) => {
                const selected = isSelected(item.uuid);
                return (
                  <label
                    key={item.uuid}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                      selected ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggle(item)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${selected ? 'text-blue-800 font-medium' : 'text-gray-700'}`}>
                      {item.name}
                    </span>
                  </label>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!draftChanged}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Confirmar selección
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
