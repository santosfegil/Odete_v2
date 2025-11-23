interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
}

export default function CircularProgress({
  value,
  max,
  size = 280,
  strokeWidth = 16,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = (value / max) * 100;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (value > 500) return '#059669';
    if (value < 50) return '#dc2626';
    return '#d97706';
  };

  const color = getColor();

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-stone-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-stone-600 text-sm font-medium mb-1">Sobrou</p>
        <p className="text-stone-900 text-4xl font-bold">
          R$ {value.toLocaleString('pt-BR')}
        </p>
        <p className="text-stone-500 text-xs mt-2">de R$ {max.toLocaleString('pt-BR')}</p>
      </div>
    </div>
  );
}
