// Hoja de cannabis estilizada — 5 folíolos, reutilizable en toda la app
export default function CannabisLeaf({ size = 24, color = '#00e676', opacity = 1, className, style }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <g transform="translate(50,65)" fill={color} opacity={opacity}>
        {/* Folíolo central */}
        <path d="M0 0 C-10-5,-8-20,0-38 C8-20,10-5,0 0Z" />
        {/* Folíolos superiores ±30° */}
        <path d="M0 0 C-9-5,-7-18,0-34 C7-18,9-5,0 0Z" transform="rotate(30)" />
        <path d="M0 0 C-9-5,-7-18,0-34 C7-18,9-5,0 0Z" transform="rotate(-30)" />
        {/* Folíolos inferiores ±62° */}
        <path d="M0 0 C-7-4,-6-14,0-26 C6-14,7-4,0 0Z" transform="rotate(62)" />
        <path d="M0 0 C-7-4,-6-14,0-26 C6-14,7-4,0 0Z" transform="rotate(-62)" />
        {/* Tallo */}
        <rect x="-1.5" y="0" width="3" height="22" rx="1.5" />
      </g>
    </svg>
  )
}

// Paths raw para reusar en SVGs animados (coordenadas relativas a translate(50,65))
export const LEAF_PATHS = [
  { d: 'M0 0 C-10-5,-8-20,0-38 C8-20,10-5,0 0Z', transform: '' },
  { d: 'M0 0 C-9-5,-7-18,0-34 C7-18,9-5,0 0Z',   transform: 'rotate(30)' },
  { d: 'M0 0 C-9-5,-7-18,0-34 C7-18,9-5,0 0Z',   transform: 'rotate(-30)' },
  { d: 'M0 0 C-7-4,-6-14,0-26 C6-14,7-4,0 0Z',   transform: 'rotate(62)' },
  { d: 'M0 0 C-7-4,-6-14,0-26 C6-14,7-4,0 0Z',   transform: 'rotate(-62)' },
]
