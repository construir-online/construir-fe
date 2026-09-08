export default function CategoryCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-2">
      <div className="aspect-[4/3] rounded-2xl bg-sand-200" />
      {/* Misma altura reservada que el nombre real, para que no salte al cargar */}
      <div className="min-h-[2.1em] text-[11.5px] sm:text-sm">
        <div className="h-3 w-3/4 rounded bg-sand-200" />
      </div>
    </div>
  );
}
