import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Info, ArrowRight, Eye, EyeOff } from 'lucide-react'
import AuthLayout from '../components/AuthLayout'
import FormField from '../components/FormField'
import { getEmailError } from '../utils/validation'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
    if (!validate()) return
    setSubmitting(true)
    try {
      // TODO: wire up to auth API
      await new Promise((resolve) => setTimeout(resolve, 600))
      navigate('/dashboard')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} noValidate className="p-8 pb-6 flex flex-col gap-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Sign in to your account</h2>
          <p className="mt-1 text-sm text-slate-500">Access your enterprise dashboard</p>
        </div>

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
            <a href="#" className="text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline">
              Forgot password?
            </a>
          }
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
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
          className="group mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign In'}
          {!submitting && (
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          )}
        </button>
      </form>

      <div className="relative px-8">
        <div className="border-t border-slate-200" />
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white px-3 text-xs font-medium text-slate-400">
          or
        </span>
      </div>

      <div className="bg-blue-50/60 px-8 pt-6 pb-8">
        <h3 className="text-lg font-bold text-slate-900">New to AssetFlow?</h3>

        <div className="mt-4 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-100/70 px-4 py-3">
          <Info size={18} className="mt-0.5 shrink-0 text-blue-700" />
          <p className="text-sm text-slate-700">
            Sign up creates an employee account. Admin roles are assigned later by your department lead.
          </p>
        </div>

        <Link
          to="/signup"
          className="mt-4 flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
        >
          Create Account
        </Link>
      </div>
    </AuthLayout>
  )
}
