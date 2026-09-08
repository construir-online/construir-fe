'use client';

import { useEffect, useState } from 'react';
import { customersService, type GetCustomersParams } from '@/services/customers';
import type { CustomerResponseDto } from '@/types';
import { Users, Search, Download, ChevronUp, ChevronDown } from 'lucide-react';
import { formatUSD, formatVES } from '@/lib/currency';
import Link from 'next/link';
import PhoneLink from "@/components/common/PhoneLink";

type SortField = GetCustomersParams['sortBy'];
type SortOrder = GetCustomersParams['sortOrder'];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<SortField>('lastOrderDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
  const limit = 20;

  useEffect(() => {
    loadCustomers();
  }, [page, sortBy, sortOrder]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customersService.getCustomers({
        page,
        limit,
        search: searchTerm || undefined,
        sortBy,
        sortOrder,
      });
      setCustomers(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadCustomers();
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const blob = await customersService.exportCustomersCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error al exportar CSV');
    } finally {
      setExporting(false);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'ASC' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-600" />
            Clientes
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Total de clientes con órdenes: {total}
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {exporting ? 'Exportando...' : 'Exportar CSV'}
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar por nombre, email, teléfono o identificación..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Buscar
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Tipo
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  Nombre <SortIcon field="name" />
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('email')}
                >
                  Email <SortIcon field="email" />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Contacto
                </th>
                <th
                  className="px-4 py-3 text-right text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('totalOrders')}
                >
                  Órdenes <SortIcon field="totalOrders" />
                </th>
                <th
                  className="px-4 py-3 text-right text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('totalSpentVes')}
                >
                  Total Gastado <SortIcon field="totalSpentVes" />
                </th>
                <th
                  className="px-4 py-3 text-right text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('lastOrderDate')}
                >
                  Última Compra <SortIcon field="lastOrderDate" />
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr key={`loading`}>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Cargando clientes...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No se encontraron clientes
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.uuid} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          customer.type === 'registered'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {customer.type === 'registered' ? 'Registrado' : 'Invitado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {customer.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {customer.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {customer.phone && (
                        <PhoneLink
                          phone={customer.phone}
                          className="block hover:text-success-700 hover:underline"
                        />
                      )}
                      {customer.identification && (
                        <div className="text-xs text-gray-500">
                          {customer.identification}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {customer.totalOrders}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      <div className="font-medium text-blue-600">
                        {formatVES(customer.totalSpentVes)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatUSD(customer.totalSpent)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {customer.lastOrderDate
                        ? new Date(customer.lastOrderDate).toLocaleDateString('es-VE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/dashboard/clientes/${customer.uuid}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Página {page} de {totalPages} ({total} clientes)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
