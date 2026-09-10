'use client';

import { MapPin, Navigation } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import LocationMethodSelector, { LocationMethod } from '@/components/checkout/LocationMethodSelector';
import MapPicker from '@/components/checkout/MapPicker';
import type { CheckoutData } from '@/types';

interface Step3LocationProps {
  register: UseFormRegister<CheckoutData>;
  errors: FieldErrors<CheckoutData>;
  locationMethod: LocationMethod;
  onLocationMethodChange: (method: LocationMethod) => void;
  latitude?: number;
  longitude?: number;
  onGetLocation: () => void;
  onMapLocationSelect: (lat: number, lng: number) => void;
}

export default function Step3Location({
  register,
  errors,
  locationMethod,
  onLocationMethodChange,
  latitude,
  longitude,
  onGetLocation,
  onMapLocationSelect
}: Step3LocationProps) {
  const t = useTranslations('checkout');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-ink">
          <MapPin className="w-5 h-5 text-brand-600" />
          {t('shippingAddress')}
        </h2>
        <p className="text-sm text-sand-700">
          {t('locationDescription', { defaultValue: 'Ingresa la dirección donde deseas recibir tu pedido' })}
        </p>
      </div>

      {/* Selector de Método de Ubicación */}
      <LocationMethodSelector
        value={locationMethod}
        onChange={onLocationMethodChange}
      />

      {/* Método Manual - Formulario completo */}
      {locationMethod === 'manual' && (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11.5px] font-bold text-sand-700">
              {t('address')} *
            </label>
            <input
              type="text"
              {...register('address', { required: locationMethod === 'manual' })}
              placeholder={t('addressPlaceholder', { defaultValue: 'Calle, casa o edificio, punto de referencia' })}
              className="min-h-11 w-full rounded-xl border border-sand-300 bg-sand-100 px-3.5 py-3 text-[13.5px] font-medium text-ink placeholder-sand-600 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25"
            />
            {errors.address && (
              <span className="text-danger-500 text-xs mt-1">
                {t('errors.fieldRequired', { defaultValue: 'Este campo es requerido' })}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[11.5px] font-bold text-sand-700">
                {t('city')} *
              </label>
              <input
                type="text"
                {...register('city', { required: locationMethod === 'manual' })}
                className="min-h-11 w-full rounded-xl border border-sand-300 bg-sand-100 px-3.5 py-3 text-[13.5px] font-medium text-ink placeholder-sand-600 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11.5px] font-bold text-sand-700">
                {t('state')} *
              </label>
              <input
                type="text"
                {...register('state', { required: locationMethod === 'manual' })}
                className="min-h-11 w-full rounded-xl border border-sand-300 bg-sand-100 px-3.5 py-3 text-[13.5px] font-medium text-ink placeholder-sand-600 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11.5px] font-bold text-sand-700">
                {t('zipCode')} *
              </label>
              <input
                type="text"
                {...register('zipCode', { required: locationMethod === 'manual' })}
                className="min-h-11 w-full rounded-xl border border-sand-300 bg-sand-100 px-3.5 py-3 text-[13.5px] font-medium text-ink placeholder-sand-600 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11.5px] font-bold text-sand-700">
                {t('country')} *
              </label>
              <input
                type="text"
                {...register('country')}
                className="min-h-11 w-full rounded-xl border border-sand-300 bg-sand-100 px-3.5 py-3 text-[13.5px] font-medium text-ink placeholder-sand-600 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11.5px] font-bold text-sand-700">
              {t('additionalInfo')} ({t('optional')})
            </label>
            <textarea
              {...register('additionalInfo')}
              rows={3}
              placeholder={t('additionalInfoPlaceholder')}
              className="min-h-11 w-full rounded-xl border border-sand-300 bg-sand-100 px-3.5 py-3 text-[13.5px] font-medium text-ink placeholder-sand-600 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25"
            />
          </div>
        </div>
      )}

      {/* Método Automático */}
      {locationMethod === 'auto' && (
        <div className="space-y-4">
          <div className="bg-brand-50 p-4 rounded-lg">
            <button
              type="button"
              onClick={onGetLocation}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Navigation className="w-5 h-5" />
              {t('getMyLocation')}
            </button>
            {latitude && longitude && (
              <div className="mt-3 text-sm text-success-700 bg-success-50 p-3 rounded-lg">
                ✓ {t('locationReceived')}: {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </div>
            )}
          </div>

          {/* Campo opcional de detalles */}
          {latitude && longitude && (
            <div>
              <label className="mb-1.5 block text-[11.5px] font-bold text-sand-700">
                {t('locationDetails', { defaultValue: 'Detalles adicionales de la dirección' })} ({t('optional')})
              </label>
              <textarea
                {...register('additionalInfo')}
                rows={3}
                placeholder={t('locationDetailsPlaceholder', { defaultValue: 'Ej: Casa color blanca, portón negro, cerca del supermercado...' })}
                className="min-h-11 w-full rounded-xl border border-sand-300 bg-sand-100 px-3.5 py-3 text-[13.5px] font-medium text-ink placeholder-sand-600 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25"
              />
            </div>
          )}
        </div>
      )}

      {/* Método Mapa */}
      {locationMethod === 'map' && (
        <div className="space-y-4">
          <MapPicker
            latitude={latitude}
            longitude={longitude}
            onLocationSelect={onMapLocationSelect}
          />

          {/* Campo opcional de detalles */}
          {latitude && longitude && (
            <div>
              <label className="mb-1.5 block text-[11.5px] font-bold text-sand-700">
                {t('locationDetails', { defaultValue: 'Detalles adicionales de la dirección' })} ({t('optional')})
              </label>
              <textarea
                {...register('additionalInfo')}
                rows={3}
                placeholder={t('locationDetailsPlaceholder', { defaultValue: 'Ej: Casa color blanca, portón negro, cerca del supermercado...' })}
                className="min-h-11 w-full rounded-xl border border-sand-300 bg-sand-100 px-3.5 py-3 text-[13.5px] font-medium text-ink placeholder-sand-600 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
