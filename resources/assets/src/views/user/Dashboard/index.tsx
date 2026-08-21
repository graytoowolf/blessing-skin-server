import React, { useState, useEffect, useCallback } from 'react'
import { hot } from 'react-hot-loader/root'
import useEmitMounted from '@/scripts/hooks/useEmitMounted'
import { t } from '@/scripts/i18n'
import * as fetch from '@/scripts/net'
import { toast } from '@/scripts/notify'
import useTween from '@/scripts/hooks/useTween'
import urls from '@/scripts/urls'
import InfoBox from './InfoBox'
import SignButton from './SignButton'
import * as scoreUtils from './scoreUtils'

type ScoreInfo = {
  signAfterZero: boolean
  signGapTime: number
  rate: { players: number; storage: number }
  usage: { players: number; storage: number }
  user: { score: number; lastSignAt: string }
}

type SignReturn = {
  score: number
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [players, setPlayers] = useState(0)
  const [storage, setStorage] = useState(0)
  const [score, setScore] = useState(0)
  const [tweenedScore, setTweenedScore] = useTween(0)
  const [playersRate, setPlayersRate] = useState(1)
  const [storageRate, setStorageRate] = useState(1)
  const [lastSign, setLastSign] = useState(new Date())
  const [canSignAfterZero, setCanSignAfterZero] = useState(false)
  const [signGap, setSignGap] = useState(24)

  useEmitMounted()

  useEffect(() => {
    const fetchInfo = async () => {
      setLoading(true)
      const data = await fetch.get<ScoreInfo>(urls.user.score())
      setPlayers(data.usage.players)
      setStorage(data.usage.storage)
      setTweenedScore(data.user.score)
      setScore(data.user.score)
      setPlayersRate(data.rate.players)
      setStorageRate(data.rate.storage)
      setLastSign(new Date(data.user.lastSignAt))
      setCanSignAfterZero(data.signAfterZero)
      setSignGap(data.signGapTime)
      setLoading(false)
    }
    fetchInfo()
  }, [])

  const handleSign = useCallback(async () => {
    setLoading(true)
    const { code, message, data } = await fetch.post<
      fetch.ResponseBody<SignReturn>
    >(urls.user.sign())

    if (code === 0) {
      toast.success(message)
      setLastSign(new Date())
      setTweenedScore(data.score)
      setScore(data.score)
    } else if (code === 1) {
      const remainingTime = scoreUtils.remainingTime(
        lastSign,
        signGap,
        canSignAfterZero,
      )
      toast.warning(scoreUtils.remainingTimeText(remainingTime))
    } else {
      toast.error(message)
    }
    setLoading(false)
  }, [lastSign, signGap, canSignAfterZero])

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        overflow: 'hidden',
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1.4rem 1.8rem',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background:
            'linear-gradient(to right, rgba(99,102,241,0.06), rgba(6,182,212,0.03))',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '0.85rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(241,245,249,0.5)',
          }}
        >
          <i
            className="fas fa-chart-line mr-2"
            style={{ color: '#818cf8', width: 'auto' }}
          />
          {t('user.used.title')}
        </h3>
      </div>

      {/* Body */}
      <div style={{ padding: '1.8rem' }}>
        <div className="row align-items-center">
          {/* Left — usage stats */}
          <div className="col-md-7">
            <InfoBox
              color="teal"
              icon="gamepad"
              name={t('user.used.players')}
              used={players}
              unused={score / playersRate}
              unit=""
            />
            {storage > 1024 ? (
              <InfoBox
                color="maroon"
                icon="hdd"
                name={t('user.used.storage')}
                used={~~(storage / 1024)}
                unused={~~(score / storageRate / 1024)}
                unit="MB"
              />
            ) : (
              <InfoBox
                color="maroon"
                icon="hdd"
                name={t('user.used.storage')}
                used={storage}
                unused={score / storageRate}
                unit="KB"
              />
            )}
          </div>

          {/* Right — score display */}
          <div className="col-md-5">
            <div
              style={{
                background: 'rgba(99,102,241,0.07)',
                border: '1px solid rgba(99,102,241,0.15)',
                borderRadius: '16px',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Glow blob behind score */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '180px',
                  height: '180px',
                  background:
                    'radial-gradient(circle, rgba(99,102,241,0.18), transparent 70%)',
                  pointerEvents: 'none',
                }}
              />

              {/* Label */}
              <p
                style={{
                  margin: '0 0 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(241,245,249,0.45)',
                  position: 'relative',
                }}
              >
                {t('user.cur-score')}
              </p>

              {/* Tweened score */}
              <p
                data-toggle="modal"
                data-target="#modal-score-instruction"
                title={t('user.score-notice')}
                style={{
                  margin: '0 0 0.75rem',
                  fontFamily: '"Orbitron", "Minecraft", monospace',
                  fontSize: '3.2rem',
                  fontWeight: 900,
                  lineHeight: 1,
                  cursor: 'help',
                  background: 'linear-gradient(135deg, #818cf8, #06b6d4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  position: 'relative',
                }}
              >
                {~~tweenedScore}
              </p>

              {/* Notice */}
              <p
                style={{
                  margin: 0,
                  fontSize: '0.78rem',
                  color: 'rgba(241,245,249,0.35)',
                  lineHeight: 1.5,
                  position: 'relative',
                }}
              >
                {t('user.score-notice')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer — sign button */}
      <div
        style={{
          padding: '1.2rem 1.8rem',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          background: 'rgba(0,0,0,0.1)',
        }}
      >
        <SignButton
          isLoading={loading}
          lastSign={lastSign}
          canSignAfterZero={canSignAfterZero}
          signGap={signGap}
          onClick={handleSign}
        />
        {loading && (
          <span
            style={{
              fontSize: '0.82rem',
              color: 'rgba(241,245,249,0.4)',
              fontStyle: 'italic',
            }}
          >
            {t('general.wait')}
          </span>
        )}
      </div>
    </div>
  )
}

export default hot(Dashboard)
