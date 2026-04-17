interface UseProductCardVariantOptions {
  variant: 'default' | 'compact';
  inventory: number;
}

interface UseProductCardVariantReturn {
  classes: {
    imageHeight: string;
    padding: string;
    nameSize: string;
    priceSize: string;
    categorySize: string;
    minHeight: string;
    spacingY: string;
  };
  isLowStock: boolean;
  isOutOfStock: boolean;
}

export function useProductCardVariant({
  variant,
  inventory,
}: UseProductCardVariantOptions): UseProductCardVariantReturn {
  const isCompact = variant === 'compact';
  const isLowStock = inventory > 0 && inventory <= 5;
  const isOutOfStock = inventory === 0;

  const classes = {
    imageHeight: isCompact ? 'h-36 sm:h-44' : 'h-48 sm:h-56',
    padding: isCompact ? 'p-2 sm:p-3' : 'p-3',
    nameSize: isCompact ? 'text-xs sm:text-sm font-medium' : 'text-xs sm:text-sm font-semibold',
    priceSize: isCompact ? 'text-base sm:text-lg' : 'text-lg sm:text-xl',
    categorySize: 'text-xs',
    minHeight: isCompact ? 'min-h-[32px] sm:min-h-[36px]' : 'min-h-[32px] sm:min-h-[36px]',
    spacingY: isCompact ? 'space-y-1' : 'space-y-2',
  };

  return {
    classes,
    isLowStock,
    isOutOfStock,
  };
}
