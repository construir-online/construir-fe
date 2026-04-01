interface CarouselDotsProps {
  total: number;
  currentIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}

export default function CarouselDots({
  total,
  currentIndex,
  onSelect,
  className = '',
}: CarouselDotsProps) {
  return (
    <div className={`absolute bottom-4 sm:bottom-24 left-1/2 -translate-x-1/2 z-10 flex gap-2 ${className}`}>
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className={`h-3 rounded-full transition-all ${
            index === currentIndex
              ? 'bg-white w-8'
              : 'bg-white/50 w-3 hover:bg-white/75'
          }`}
          aria-label={`Ir a banner ${index + 1}`}
          aria-current={index === currentIndex}
        />
      ))}
    </div>
  );
}
