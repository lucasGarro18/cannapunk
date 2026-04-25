import { useState } from 'react'
import { RiStarFill, RiStarLine } from 'react-icons/ri'

export default function StarRating({ value = 0, onChange, size = 20, readonly = false }) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => {
        const filled = n <= display
        const Icon   = filled ? RiStarFill : RiStarLine
        return (
          <button
            key={n}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(n)}
            onMouseEnter={() => !readonly && setHovered(n)}
            onMouseLeave={() => !readonly && setHovered(0)}
            style={{ color: filled ? '#f59e0b' : '#3f3f46', cursor: readonly ? 'default' : 'pointer', lineHeight: 1 }}
          >
            <Icon size={size} />
          </button>
        )
      })}
    </div>
  )
}
