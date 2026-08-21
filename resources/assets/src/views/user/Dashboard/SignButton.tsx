import React, { useState } from 'react'
import { t } from '@/scripts/i18n'
import * as scoreUtils from './scoreUtils'

interface Props {
  isLoading: boolean
  lastSign: Date
  canSignAfterZero: boolean
  signGap: number
  onClick: React.MouseEventHandler<HTMLButtonElement>
}

const SignButton: React.FC<Props> = (props) => {
  const { lastSign, signGap, canSignAfterZero } = props
  const remainingTime = scoreUtils.remainingTime(
    lastSign,
    signGap,
    canSignAfterZero,
  )
  const remainingTimeText = scoreUtils.remainingTimeText(remainingTime)
  const canSign = remainingTime <= 0

  const [ripples, setRipples] = useState<
    { x: number; y: number; id: number }[]
  >([])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!canSign || props.isLoading) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()
    setRipples((r) => [...r, { x, y, id }])
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 700)

    props.onClick(e)
  }

  return (
    <button
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0.7rem 2rem',
        borderRadius: '100px',
        border: 'none',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 600,
        fontSize: '0.95rem',
        cursor: canSign && !props.isLoading ? 'pointer' : 'not-allowed',
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        background: canSign
          ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
          : 'rgba(255,255,255,0.06)',
        color: canSign ? '#fff' : 'rgba(241,245,249,0.4)',
        boxShadow: canSign ? '0 4px 20px rgba(99,102,241,0.4)' : 'none',
        opacity: props.isLoading ? 0.7 : 1,
      }}
      disabled={!canSign || props.isLoading}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (!canSign || props.isLoading) return
        const el = e.currentTarget
        el.style.transform = 'translateY(-2px)'
        el.style.boxShadow = '0 8px 30px rgba(99,102,241,0.55)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.transform = ''
        el.style.boxShadow = canSign
          ? '0 4px 20px rgba(99,102,241,0.4)'
          : 'none'
      }}
    >
      {/* Ripple effects */}
      {ripples.map((rp) => (
        <span
          key={rp.id}
          style={{
            position: 'absolute',
            left: rp.x,
            top: rp.y,
            width: 0,
            height: 0,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.35)',
            transform: 'translate(-50%, -50%)',
            animation: 'rippleEffect 0.7s cubic-bezier(0.4,0,0.2,1) forwards',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Ripple keyframes injected once */}
      <style>{`
        @keyframes rippleEffect {
          to {
            width: 200px;
            height: 200px;
            opacity: 0;
          }
        }
      `}</style>

      {props.isLoading ? (
        <>
          <span
            style={{
              width: '16px',
              height: '16px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'signSpin 0.8s linear infinite',
              flexShrink: 0,
            }}
          />
          <style>{`@keyframes signSpin { to { transform: rotate(360deg); } }`}</style>
        </>
      ) : (
        <i
          className="far fa-calendar-check"
          aria-hidden="true"
          style={{ width: 'auto' }}
        />
      )}

      {canSign ? t('user.sign') : remainingTimeText}
    </button>
  )
}

export default React.memo(SignButton)
