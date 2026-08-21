import React from 'react'

interface Props {
  name: string
  icon: string
  color: string
  used: number
  unused: number
  unit: string
}

// Color map from legacy colors to modern CSS custom properties
const colorMap: Record<string, { glow: string; bg: string; text: string }> = {
  teal: {
    glow: 'rgba(20, 184, 166, 0.25)',
    bg: 'rgba(20, 184, 166, 0.12)',
    text: '#2dd4bf',
  },
  maroon: {
    glow: 'rgba(99, 102, 241, 0.25)',
    bg: 'rgba(99, 102, 241, 0.12)',
    text: '#818cf8',
  },
  blue: {
    glow: 'rgba(59, 130, 246, 0.25)',
    bg: 'rgba(59, 130, 246, 0.12)',
    text: '#60a5fa',
  },
  green: {
    glow: 'rgba(34, 197, 94, 0.25)',
    bg: 'rgba(34, 197, 94, 0.12)',
    text: '#4ade80',
  },
}

const InfoBox: React.FC<Props> = (props) => {
  const total = ~~(props.used + props.unused)
  const percentage = total > 0 ? (props.used / total) * 100 : 0
  const palette = colorMap[props.color] ?? colorMap['blue']

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '14px',
        padding: '1.1rem 1.4rem',
        marginBottom: '1rem',
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'rgba(255,255,255,0.15)'
        el.style.transform = 'translateY(-2px)'
        el.style.boxShadow = `0 8px 30px rgba(0,0,0,0.3), 0 0 0 1px ${palette.glow}`
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'rgba(255,255,255,0.08)'
        el.style.transform = ''
        el.style.boxShadow = ''
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '46px',
          height: '46px',
          borderRadius: '12px',
          background: palette.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 0 16px ${palette.glow}`,
        }}
      >
        <i
          className={`fas fa-${props.icon}`}
          style={{ color: palette.text, fontSize: '1.15rem', width: 'auto' }}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'rgba(241,245,249,0.5)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '4px',
          }}
        >
          {props.name}
        </div>
        <div
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: 'rgba(241,245,249,0.9)',
            marginBottom: '8px',
          }}
        >
          <span style={{ color: palette.text }}>{props.used}</span>
          <span
            style={{
              color: 'rgba(241,245,249,0.35)',
              fontWeight: 400,
              fontSize: '0.85rem',
            }}
          >
            {' '}
            / {total} {props.unit}
          </span>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: '4px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '100px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(percentage, 100)}%`,
              background: `linear-gradient(90deg, ${
                palette.text
              }, ${palette.glow.replace('0.25', '0.6')})`,
              borderRadius: '100px',
              transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default React.memo(InfoBox)
