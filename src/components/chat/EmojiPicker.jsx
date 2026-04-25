import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

const GROUPS = [
  {
    tab: '😀',
    emojis: [
      '😀','😁','😂','🤣','😊','😇','🥰','😍','😘','😎',
      '🤓','😏','😅','😆','😋','😜','🤪','🤔','🤗','🤫',
      '😐','🙄','😒','😔','😢','😭','😤','😡','🤬','😴',
      '🥱','🤢','🤧','😷','🥳','🥸','🤩','🥹','😬','🫠',
    ],
  },
  {
    tab: '👍',
    emojis: [
      '👍','👎','👌','✌️','🤞','🤟','🤙','👈','👉','☝️',
      '👋','🤚','✋','🫶','🤝','🙌','👏','🙏','💪','✊',
      '❤️','🧡','💛','💚','💙','💜','🖤','💔','💝','💕',
      '❣️','💯','🔥','✨','⭐','🌟','💫','⚡','🎉','🎊',
    ],
  },
  {
    tab: '🎮',
    emojis: [
      '🎮','🎯','🏆','🥇','🎁','🎈','🎵','🎶','🚀','💡',
      '💰','💎','👑','🌈','☀️','🌙','❄️','🌊','🍕','🍔',
      '🍟','🌮','🍣','🍜','☕','🍺','🎂','🍰','🍫','🍭',
      '✅','❌','⚠️','🔑','🔒','📱','💻','📸','🎙️','📍',
    ],
  },
]

export default function EmojiPicker({ onSelect, onClose }) {
  const [tab, setTab]  = useState(0)
  const ref            = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.96 }}
      transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
      className="absolute bottom-full left-0 right-0 mb-2 mx-1 rounded-2xl overflow-hidden z-50 shadow-2xl"
      style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Tabs */}
      <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {GROUPS.map((g, i) => (
          <button key={i} onClick={() => setTab(i)}
                  className="flex-1 py-2.5 text-lg relative transition-colors"
                  style={{ background: tab === i ? 'rgba(0,230,118,0.07)' : 'transparent' }}>
            {g.tab}
            {tab === i && (
              <motion.div layoutId="emoji-tab" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                          style={{ background: '#00e676' }} />
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="p-2 grid grid-cols-8 gap-0.5 max-h-44 overflow-y-auto scrollbar-hide">
        {GROUPS[tab].emojis.map(emoji => (
          <button key={emoji} onClick={() => onSelect(emoji)}
                  className="text-xl py-1.5 rounded-xl transition-colors hover:bg-white/6 active:scale-90"
                  style={{ lineHeight: 1 }}>
            {emoji}
          </button>
        ))}
      </div>
    </motion.div>
  )
}
