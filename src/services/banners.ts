import { apiClient } from '@/lib/api';
import type { Banner, CreateBannerDto, UpdateBannerDto } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const BANNERS_ENDPOINT = '/banners';

/**
 * Todo este archivo se armaba sus `fetch` a mano con
 * `Authorization: Bearer ${localStorage.getItem('token')}`. Con la sesión en
 * una cookie `httpOnly` no hay token que leer: cada una de estas llamadas se
 * habría ido sin credenciales y la pantalla de banners del panel dejaba de
 * cargar y de guardar. Ahora pasan por `apiClient`, que adjunta la cookie.
 */
export async function getBanners(): Promise<Banner[]> {
  return apiClient.get<Banner[]>(BANNERS_ENDPOINT);
}

export async function getActiveBanners(): Promise<Banner[]> {
  const response = await fetch(`${API_URL}${BANNERS_ENDPOINT}/active`);

  if (!response.ok) {
    throw new Error('Error al obtener banners activos');
  }

  return response.json();
}

export async function getBannerByUuid(uuid: string): Promise<Banner> {
  return apiClient.get<Banner>(`${BANNERS_ENDPOINT}/${uuid}`);
}

export async function createBanner(data: CreateBannerDto): Promise<Banner> {
  const formData = new FormData();

  formData.append('title', data.title);
  if (data.description) formData.append('description', data.description);
  formData.append('isActive', data.isActive ? 'true' : 'false');
  formData.append('priority', data.priority?.toString() || '0');
  if (data.startDate) formData.append('startDate', new Date(data.startDate).toISOString());
  if (data.endDate) formData.append('endDate', new Date(data.endDate).toISOString());
  if (data.link) formData.append('link', data.link);

  // Si se proporciona una imagen general
  if (data.image) {
    formData.append('image', data.image);
  }

  // Si se proporcionan imágenes individuales
  if (data.desktopImage) formData.append('desktopImage', data.desktopImage);
  if (data.tabletImage) formData.append('tabletImage', data.tabletImage);
  if (data.mobileImage) formData.append('mobileImage', data.mobileImage);

  return apiClient.post<Banner>(BANNERS_ENDPOINT, formData);
}

export async function updateBanner(uuid: string, data: UpdateBannerDto): Promise<Banner> {
  const formData = new FormData();

  if (data.title) formData.append('title', data.title);
  if (data.description) formData.append('description', data.description);
  if (data.isActive !== undefined) formData.append('isActive', data.isActive ? 'true' : 'false');
  if (data.priority !== undefined) formData.append('priority', data.priority.toString());
  if (data.startDate) formData.append('startDate', new Date(data.startDate).toISOString());
  if (data.endDate) formData.append('endDate', new Date(data.endDate).toISOString());
  if (data.link) formData.append('link', data.link);

  // Si se proporciona una imagen general
  if (data.image) formData.append('image', data.image);

  // Si se proporcionan imágenes individuales
  if (data.desktopImage) formData.append('desktopImage', data.desktopImage);
  if (data.tabletImage) formData.append('tabletImage', data.tabletImage);
  if (data.mobileImage) formData.append('mobileImage', data.mobileImage);

  return apiClient.patch<Banner>(`${BANNERS_ENDPOINT}/${uuid}`, formData);
}

export async function deleteBanner(uuid: string): Promise<void> {
  await apiClient.delete<void>(`${BANNERS_ENDPOINT}/${uuid}`);
}
