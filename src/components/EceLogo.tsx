export default function EceLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 104" className={className} role="img" aria-label="Elite Consolidated Engineers">
      <g fontFamily="Georgia, 'Times New Roman', serif" fontWeight="700" fontSize="46" textAnchor="middle">
        <rect x="70" y="2" width="33" height="50" fill="#7b7a7f" />
        <rect x="104" y="2" width="33" height="50" fill="#ffffff" />
        <rect x="138" y="2" width="33" height="50" fill="#7b7a7f" />
        <text x="86.5" y="44" fill="#ffffff">E</text>
        <text x="120.5" y="44" fill="#003164">C</text>
        <text x="154.5" y="44" fill="#ffffff">E</text>
      </g>
      <text x="120" y="80" fill="#ffffff" fontSize="25" textAnchor="middle" letterSpacing="0.5">
        elite consolidated
      </text>
      <text x="124" y="100" fill="#ffffff" fillOpacity="0.85" fontSize="11" textAnchor="middle" letterSpacing="8">
        ENGINEERS
      </text>
    </svg>
  )
}
