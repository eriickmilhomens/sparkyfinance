interface SparkyLogoProps {
  size?: number;
  color?: string;
  className?: string;
}

const SparkyLogo = ({ size = 24, color = "#707070", className }: SparkyLogoProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
    {/* Ears */}
    <path d="M14 8L8 28H20L14 8Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M50 8L56 28H44L50 8Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    {/* Head */}
    <ellipse cx="32" cy="38" rx="22" ry="20" stroke={color} strokeWidth="2" />
    {/* Eyes */}
    <circle cx="24" cy="34" r="2.5" fill={color} />
    <circle cx="40" cy="34" r="2.5" fill={color} />
    {/* Nose */}
    <path d="M32 40L30 42H34L32 40Z" fill={color} />
    {/* Mouth */}
    <path d="M28 44C29 45.5 31 46 32 46C33 46 35 45.5 36 44" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    {/* Whiskers */}
    <line x1="6" y1="36" x2="18" y2="37" stroke={color} strokeWidth="1" strokeLinecap="round" />
    <line x1="6" y1="40" x2="18" y2="40" stroke={color} strokeWidth="1" strokeLinecap="round" />
    <line x1="46" y1="37" x2="58" y2="36" stroke={color} strokeWidth="1" strokeLinecap="round" />
    <line x1="46" y1="40" x2="58" y2="40" stroke={color} strokeWidth="1" strokeLinecap="round" />
  </svg>
);

export default SparkyLogo;
