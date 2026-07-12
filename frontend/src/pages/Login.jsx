import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Mail, Lock, Info, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import AuthLayout from '../components/AuthLayout'
import FormField from '../components/FormField'
import { getEmailError } from '../utils/validation'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api/client'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState(null)

  const successMessage = location.state?.signupSuccess
    ? 'Account created. Sign in with your new credentials.'
    : null

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    const next = {}
    const emailError = getEmailError(form.email)
    if (emailError) next.email = emailError
    if (!form.password) next.password = 'Password is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)
    if (!validate()) return
    setSubmitting(true)
    try {
      await login(form.email, form.password)
      const redirectTo = location.state?.from?.pathname ?? '/dashboard'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} noValidate className="p-8 pb-6 flex flex-col gap-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Sign in to your account</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Access your enterprise dashboard</p>
        </div>

        {successMessage && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            {successMessage}
          </div>
        )}

        {formError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {formError}
          </div>
        )}

        <FormField
          id="email"
          name="email"
          type="email"
          label="Corporate Email"
          icon={Mail}
          placeholder="name@company.com"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          autoComplete="email"
        />

        <FormField
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          label="Password"
          icon={Lock}
          placeholder="Enter your password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="current-password"
          rightSlot={
            <a href="#" className="text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
              Forgot password?
            </a>
          }
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-slate-400 hover:text-slate-600 transition-colors dark:text-slate-500 dark:hover:text-slate-300"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        <button
          type="submit"
          disabled={submitting}
          className="group mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          {submitting ? 'Signing in…' : 'Sign In'}
          {!submitting && (
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          )}
        </button>
      </form>

      <div className="relative px-8">
        <div className="border-t border-slate-200 dark:border-slate-800" />
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white px-3 text-xs font-medium text-slate-400 dark:bg-slate-900 dark:text-slate-500">
          or
        </span>
      </div>

      <div className="bg-blue-50/60 px-8 pt-6 pb-8 dark:bg-blue-950/20">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">New to AssetFlow?</h3>

        <div className="mt-4 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-100/70 px-4 py-3 dark:border-blue-900/60 dark:bg-blue-950/40">
          <Info size={18} className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-400" />
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Sign up creates an employee account. Admin roles are assigned later by your department lead.
          </p>
        </div>

        <Link
          to="/signup"
          className="mt-4 flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Create Account
        </Link>
      </div>
    </AuthLayout>
  )
}
