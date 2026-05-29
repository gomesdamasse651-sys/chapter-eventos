interface LogoProps {
  size?: number;
}

export default function Logo({ size = 20 }: LogoProps) {
  const gap = Math.round(size * 0.15);
  const sq = Math.round((size - gap) / 2);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      style={{ filter: "drop-shadow(0 0 6px rgba(139, 92, 246, 0.5))" }}
    >
      <rect x="0" y="0" width={sq} height={sq} fill="rgba(139, 92, 246, 0.9)" />
      <rect x={sq + gap} y="0" width={sq} height={sq} fill="rgba(109, 40, 217, 0.2)" />
      <rect x="0" y={sq + gap} width={sq} height={sq} fill="rgba(109, 40, 217, 0.2)" />
      <rect x={sq + gap} y={sq + gap} width={sq} height={sq} fill="rgba(139, 92, 246, 0.5)" />
    </svg>
  );
}
