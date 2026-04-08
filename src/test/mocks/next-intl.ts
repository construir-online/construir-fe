// Mock global de next-intl para todos los tests unitarios/componentes
// Retorna la key de traducción tal cual — suficiente para verificar comportamiento
export const useTranslations = () => (key: string) => key;
export const useLocale = () => 'es';
export const useMessages = () => ({});
export const NextIntlClientProvider = ({ children }: { children: React.ReactNode }) => children;
