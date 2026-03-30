interface ProductCardSkeletonProps {
  variant?: 'default' | 'compact';
}

export default function ProductCardSkeleton({ variant = 'default' }: ProductCardSkeletonProps) {
  const isCompact = variant === 'compact';

  const imageHeight = isCompact ? 'h-48 sm:h-56' : 'h-64';
  const padding = isCompact ? 'p-2 sm:p-3' : 'p-4';
  const spacingY = isCompact ? 'space-y-2' : 'space-y-3';

  return (
    <div className="block bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className={`bg-gray-200 dark:bg-slate-700 ${imageHeight}`} />

      {/* Content skeleton */}
      <div className={`${padding} ${spacingY}`}>
        {/* Category skeleton */}
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />

        {/* Name skeleton - 2 lines */}
        <div className="space-y-2">
          <div className={`${isCompact ? 'h-4' : 'h-5'} bg-gray-200 dark:bg-slate-700 rounded w-full`} />
          <div className={`${isCompact ? 'h-4' : 'h-5'} bg-gray-200 dark:bg-slate-700 rounded w-4/5`} />
        </div>

        {/* SKU skeleton - only for default variant */}
        {!isCompact && (
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4" />
        )}

        {/* Description skeleton - only for default variant */}
        {!isCompact && (
          <div className="space-y-2 hidden sm:block">
            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-full" />
            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
          </div>
        )}

        {/* Price skeleton */}
        {isCompact ? (
          <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
        ) : (
          <div className="space-y-1">
            <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-2/3" />
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
          </div>
        )}

        {/* Stock skeleton - only for default variant */}
        {!isCompact && (
          <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
        )}
      </div>
    </div>
  );
}
