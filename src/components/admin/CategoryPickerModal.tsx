'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Tag } from 'lucide-react';
import type { Category } from '@/types';

interface CategoryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedUuids: string[];
  onConfirm: (uuids: string[]) => void;
}

export default function CategoryPickerModal({
  isOpen,
  onClose,
  categories,
  selectedUuids,
  onConfirm,
}: CategoryPickerModalProps) {
  const [draft, setDraft] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDraft([...selectedUuids]);
      setSearch('');
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen, selectedUuids]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = [...categories]
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aSelected = draft.includes(a.uuid);
      const bSelected = draft.includes(b.uuid);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return a.name.localeCompare(b.name);
    });

  const toggle = (uuid: string) => {
    setDraft((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid]
    );
  };

  const handleConfirm = () => {
    onConfirm(draft);
    onClose();
  };

  const draftChanged =
    draft.length !== selectedUuids.length ||
    draft.some((id) => !selectedUuids.includes(id));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Modal */}
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
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No se encontraron categorías
              </p>
            ) : (
              filtered.map((category) => {
                const isSelected = draft.includes(category.uuid);
                return (
                  <label
                    key={category.uuid}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(category.uuid)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${isSelected ? 'text-blue-800 font-medium' : 'text-gray-700'}`}>
                      {category.name}
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
              disabled={!draftChanged && draft.length === selectedUuids.length}
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
