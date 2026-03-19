import React, { useState, useRef, useEffect } from 'react'
import { hot } from 'react-hot-loader/root'
import useEmitMounted from '@/scripts/hooks/useEmitMounted'
import { t } from '@/scripts/i18n'
import * as fetch from '@/scripts/net'
import urls from '@/scripts/urls'
import Alert from '@/components/Alert'
import Captcha from '@/components/Captcha'
import EmailSuggestion from '@/components/EmailSuggestion'

type SuccessfulResponse = {
  code: 0
  message: string
  data: { redirectTo: string }
}
type FailedResponse = {
  code: number
  message: string
  data: { login_fails: number; locked?: boolean; locked_until?: number }
}
type Response = SuccessfulResponse | FailedResponse

function isSuccessfulResponse(
  response: Response,
): response is SuccessfulResponse {
  return response.code === 0
}

const Login: React.FC = () => {
  const [identification, setIdentification] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [hasTooManyFails, setHasTooManyFails] = useState(
    blessing.extra.tooManyFails as boolean
  )
  const [isLocked, setIsLocked] = useState(false)
  const [lockedMinutes, setLockedMinutes] = useState(0)
  const [isPending, setIsPending] = useState(false)
  const [warningMessage, setWarningMessage] = useState('')
  const ref = useRef<Captcha | null>(null)

  useEmitMounted()

  useEffect(() => {
    const lockedUntil = blessing.extra.locked_until as number | undefined
    if (lockedUntil) {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 60000)
      if (remaining > 0) {
        setIsLocked(true)
        setLockedMinutes(remaining)
        const interval = setInterval(() => {
          const newRemaining = Math.ceil((lockedUntil - Date.now()) / 60000)
          if (newRemaining <= 0) {
            setIsLocked(false)
            clearInterval(interval)
          } else {
            setLockedMinutes(newRemaining)
          }
        }, 60000)
      }
    }
  }, [])

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value)
  }

  const handleRememberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRemember(event.target.checked)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsPending(true)

    let captchaValue: string | undefined = undefined
    if (hasTooManyFails) {
      captchaValue = await ref.current!.execute()
      if (!captchaValue) {
        setIsPending(false)
        return
      }
    }

    const response = await fetch.post<Response>(urls.auth.login(), {
      identification,
      password,
      keep: remember,
      ...(captchaValue ? { captcha: captchaValue } : {}),
    })

    if (isSuccessfulResponse(response)) {
      window.location.href = response.data.redirectTo
    } else {
      setWarningMessage(response.message)
      setIsPending(false)
      ref.current?.reset()

      if (response.data.locked && response.data.locked_until) {
        setIsLocked(true)
        const remaining = Math.ceil(
          (response.data.locked_until - Date.now()) / 60000,
        )
        setLockedMinutes(remaining)
      } else if (response.data.login_fails >= 3 && !hasTooManyFails) {
        setHasTooManyFails(true)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <EmailSuggestion
        type="text"
        placeholder={t('auth.identification')}
        required
        autoFocus
        value={identification}
        onChange={setIdentification}
      />
      <div className="input-group mb-3">
        <input
          type="password"
          className="form-control"
          placeholder={t('auth.password_placeholder')}
          autoComplete="current-password"
          value={password}
          onChange={handlePasswordChange}
          required
        />
        <div className="input-group-append">
          <div className="input-group-text">
            <i className="fas fa-lock"></i>
          </div>
        </div>
      </div>

      {isLocked && (
        <Alert type="danger">
          {t('auth.login.locked', { minutes: lockedMinutes })}
        </Alert>
      )}

      {hasTooManyFails && !isLocked && <Captcha ref={ref} />}

      <Alert type="warning">{warningMessage}</Alert>

      <div className="d-flex justify-content-between mb-3">
        <label>
          <input
            type="checkbox"
            className="mr-1"
            checked={remember}
            onChange={handleRememberChange}
          />
          {t('auth.keep')}
        </label>
        <a href={`${blessing.base_url}/auth/forgot`}>{t('auth.forgot-link')}</a>
      </div>

      <button
        className="btn btn-primary btn-block"
        type="submit"
        disabled={isPending || isLocked}
      >
        {isPending ? (
          <>
            <i className="fas fa-spinner fa-spin mr-1"></i>
            {t('auth.loggingIn')}
          </>
        ) : (
          t('auth.login')
        )}
      </button>
    </form>
  )
}

export default hot(Login)
