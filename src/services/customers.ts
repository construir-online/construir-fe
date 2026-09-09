import { apiClient } from '@/lib/api';
import type {
  CustomerListResponseDto,
  CustomerDetailResponseDto,
} from '@/types';

export interface GetCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'name' | 'email' | 'totalOrders' | 'totalSpent' | 'totalSpentVes' | 'firstOrderDate' | 'lastOrderDate' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Customer service for managing registered users and guest customers
 */
export const customersService = {
  /**
   * Get list of customers with pagination, search, and sorting
   */
  async getCustomers(params: GetCustomersParams = {}): Promise<CustomerListResponseDto> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const query = queryParams.toString();
    return apiClient.get<CustomerListResponseDto>(
      `/customers${query ? `?${query}` : ''}`
    );
  },

  /**
   * Get detailed information for a specific customer.
   * El `uuid` puede ser el de un usuario registrado o el de un invitado; el
   * backend resuelve contra ambas tablas.
   */
  async getCustomerDetail(uuid: string): Promise<CustomerDetailResponseDto> {
    return apiClient.get<CustomerDetailResponseDto>(`/customers/${uuid}`);
  },

  /**
   * Export customers to CSV
   */
  async exportCustomersCSV(): Promise<Blob> {
    return apiClient.getBlob('/customers/export/csv');
  },
};
