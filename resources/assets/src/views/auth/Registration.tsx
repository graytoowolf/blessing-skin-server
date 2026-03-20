import React, { useState, useRef } from 'react'
import { hot } from 'react-hot-loader/root'
import useBlessingExtra from '@/scripts/hooks/useBlessingExtra'
import useEmitMounted from '@/scripts/hooks/useEmitMounted'
import { t } from '@/scripts/i18n'
import * as fetch from '@/scripts/net'
import { toast } from '@/scripts/notify'
import urls from '@/scripts/urls'
import Alert from '@/components/Alert'
import Captcha from '@/components/Captcha'
import EmailSuggestion from '@/components/EmailSuggestion'

interface PasswordRequirement {
  test: (password: string) => boolean
  label: string
}

const passwordRequirements: PasswordRequirement[] = [
  { test: (p) => p.length >= 8, label: 'auth.password.length' },
]

const getPasswordStrength = (password: string): number => {
  return passwordRequirements.filter((req) => req.test(password)).length
}

const PasswordStrengthIndicator: React.FC<{ password: string }> = ({
  password,
}) => {
  const strength = getPasswordStrength(password)
  const percentage = (strength / passwordRequirements.length) * 100

  const getColor = () => {
    if (percentage <= 20) return 'bg-danger'
    if (percentage <= 40) return 'bg-danger'
    if (percentage <= 60) return 'bg-warning'
    if (percentage <= 80) return 'bg-info'
    return 'bg-success'
  }

  return (
    <div className="mt-1 mb-3">
      <div className="progress" style={{ height: '4px' }}>
        <div
          className={`progress-bar ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-1" style={{ fontSize: '0.75rem' }}>
        {passwordRequirements.map((req, index) => (
          <div
            key={index}
            className={req.test(password) ? 'text-success' : 'text-muted'}
          >
            <i
              className={`fas fa-${req.test(password) ? 'check' : 'times'} mr-1`}
            />
            {t(req.label)}
          </div>
        ))}
      </div>
    </div>
  )
}

const Registration: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [nickName, setNickName] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [warningMessage, setWarningMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const requirePlayer = useBlessingExtra<boolean>('player')
  const confirmationRef = useRef<HTMLInputElement | null>(null)
  const captchaRef = useRef<Captcha | null>(null)

  useEmitMounted()

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value)
  }

  const handleConfirmationChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setConfirmation(event.target.value)
  }

  const handleNickNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNickName(event.target.value)
  }

  const handlePlayerNameChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setPlayerName(event.target.value)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setWarningMessage('')

    if (password !== confirmation) {
      setWarningMessage(t('auth.invalidConfirmPwd'))
      confirmationRef.current!.focus()
      return
    }

    setIsPending(true)
    const { code, message } = await fetch.post<fetch.ResponseBody>(
      urls.auth.register(),
      Object.assign(
        { email, password, captcha: await captchaRef.current!.execute() },
        requirePlayer ? { player_name: playerName } : { nickname: nickName },
      ),
    )
    if (code === 0) {
      toast.success(message)
      setTimeout(() => {
        window.location.href = `${blessing.base_url}/user`
      }, 3000)
    } else {
      setWarningMessage(message)
      captchaRef.current!.reset()
    }
    setIsPending(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <EmailSuggestion
        type="email"
        required
        autoFocus
        placeholder={t('auth.email')}
        value={email}
        onChange={setEmail}
      />
      <div className="input-group mb-3">
        <input
          type={showPassword ? 'text' : 'password'}
          required
          minLength={8}
          maxLength={32}
          className="form-control"
          placeholder={t('auth.password_placeholder')}
          autoComplete="new-password"
          value={password}
          onChange={handlePasswordChange}
        />
        <div className="input-group-append">
          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? t('auth.password.hidePassword') : t('auth.password.showPassword')}
          >
            <i className={`fas fa-${showPassword ? 'eye-slash' : 'eye'}`} />
          </button>
          <div className="input-group-text">
            <i className="fas fa-lock"></i>
          </div>
        </div>
      </div>
      <PasswordStrengthIndicator password={password} />
      <div className="input-group mb-3">
        <input
          type="password"
          required
          minLength={8}
          maxLength={32}
          className="form-control"
          placeholder={t('auth.repeat-pwd')}
          autoComplete="new-password"
          ref={confirmationRef}
          value={confirmation}
          onChange={handleConfirmationChange}
        />
        <div className="input-group-append">
          <div className="input-group-text">
            <i className="fas fa-sign-in-alt"></i>
          </div>
        </div>
      </div>
      {requirePlayer ? (
        <div className="input-group mb-3" title={t('auth.player-name-intro')}>
          <input
            type="text"
            required
            className="form-control"
            placeholder={t('auth.player-name')}
            value={playerName}
            onChange={handlePlayerNameChange}
          />
          <div className="input-group-append">
            <div className="input-group-text">
              <i className="fas fa-gamepad"></i>
            </div>
          </div>
        </div>
      ) : (
        <div className="input-group mb-3" title={t('auth.nickname-intro')}>
          <input
            type="text"
            required
            className="form-control"
            placeholder={t('auth.nickname')}
            value={nickName}
            onChange={handleNickNameChange}
          />
          <div className="input-group-append">
            <div className="input-group-text">
              <i className="fas fa-gamepad"></i>
            </div>
          </div>
        </div>
      )}
      <Captcha ref={captchaRef} />

      <Alert type="warning">{warningMessage}</Alert>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <a href={`${blessing.base_url}/auth/login`}>{t('auth.login-link')}</a>
        <button className="btn btn-primary" type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <i className="fas fa-spinner fa-spin mr-1"></i>
              {t('auth.registering')}
            </>
          ) : (
            t('auth.register.registerBtn')
          )}
        </button>
      </div>
    </form>
  )
}

export default hot(Registration)
