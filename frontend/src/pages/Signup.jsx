import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Info, ArrowRight, Eye, EyeOff, Check, X } from 'lucide-react'
import AuthLayout from '../components/AuthLayout'
import FormField from '../components/FormField'
import {
  sanitizeFullName,
  getFullNameError,
  getEmailError,
  getPasswordError,
  passwordRequirements,
  FULL_NAME_MAX_LENGTH,
} from '../utils/validation'

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'fullName') {
      setForm((prev) => ({ ...prev, fullName: sanitizeFullName(value) }))
      return
    }
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    const next = {}
    const fullNameError = getFullNameError(form.fullName)
    if (fullNameError) next.fullName = fullNameError

    const emailError = getEmailError(form.email)
    if (emailError) next.email = emailError

    const passwordError = getPasswordError(form.password)
    if (passwordError) next.password = passwordError

    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match'

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
      navigate('/login')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} noValidate className="p-8 pb-6 flex flex-col gap-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Create your account</h2>
          <p className="mt-1 text-sm text-slate-500">Set up employee access to AssetFlow</p>
        </div>

        <FormField
          id="fullName"
          name="fullName"
          type="text"
          label="Full Name"
          icon={User}
          placeholder="Jane Doe"
          value={form.fullName}
          onChange={handleChange}
          error={errors.fullName}
          autoComplete="name"
          maxLength={FULL_NAME_MAX_LENGTH}
        />

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

        <div>
          <FormField
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            label="Password"
            icon={Lock}
            placeholder="Create a strong password"
            value={form.password}
            onChange={handleChange}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            error={errors.password}
            autoComplete="new-password"
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
          {(passwordFocused || form.password) && (
            <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
              {passwordRequirements.map((rule) => {
                const met = rule.test(form.password)
                return (
                  <li
                    key={rule.key}
                    className={`flex items-center gap-1.5 text-xs ${met ? 'text-emerald-600' : 'text-slate-400'}`}
                  >
                    {met ? <Check size={13} /> : <X size={13} />}
                    {rule.label}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <FormField
          id="confirmPassword"
          name="confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          label="Confirm Password"
          icon={Lock}
          placeholder="Re-enter your password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          autoComplete="new-password"
          endAdornment={
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <Info size={18} className="mt-0.5 shrink-0 text-blue-700" />
          <p className="text-sm text-slate-700">
            Sign up creates an employee account. Admin roles are assigned later by your department lead.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="group mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 disabled:opacity-60"
        >
          {submitting ? 'Creating account…' : 'Create Account'}
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

      <div className="bg-blue-50/60 px-8 pt-6 pb-8 text-center">
        <h3 className="text-lg font-bold text-slate-900">Already have an account?</h3>
        <p className="mt-1 text-sm text-slate-500">Sign in to access your enterprise dashboard.</p>

        <Link
          to="/login"
          className="mt-4 flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
        >
          Sign In
        </Link>
      </div>
    </AuthLayout>
  )
}
