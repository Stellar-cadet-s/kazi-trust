export function Loader({ size = 'md', fullScreen = false }: { size?: 'sm' | 'md' | 'lg'; fullScreen?: boolean }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const loader = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        {/* Outer Ring - Stellar Purple */}
        <div className={`${sizes[size]} rounded-full border-4 border-transparent border-t-[#7B3FF2] border-r-[#00A8E8] animate-spin`} />
        
        {/* Inner Ring - Kenya Colors */}
        <div className={`absolute inset-2 rounded-full border-4 border-transparent border-b-[#BB0000] border-l-[#006B3F] animate-spin`} style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        
        {/* Center Dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#7B3FF2] to-[#00A8E8] animate-pulse" />
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-sm font-semibold bg-gradient-to-r from-[#7B3FF2] via-[#00A8E8] to-[#006B3F] bg-clip-text text-transparent">
          Kazi Trust
        </p>
        <p className="text-xs text-gray-500 mt-1">Loading...</p>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {loader}
      </div>
    );
  }

  return loader;
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-block w-5 h-5 border-2 border-transparent border-t-[#7B3FF2] border-r-[#00A8E8] rounded-full animate-spin ${className}`} />
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg ${className}`} />
  );
}
