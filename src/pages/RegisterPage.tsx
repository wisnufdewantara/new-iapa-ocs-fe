import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/axios'
import { ThemeToggle } from '../components/ThemeToggle'
import { usePageTitle } from '../hooks/usePageTitle'
import { toastSuccess, toastError } from '../lib/toast'
import logo from '../assets/logo-iapa.png'

interface FormData {
  firstName: string
  lastName: string
  username: string
  email: string
  phone: string
  affiliation: string
  country: string
  password: string
  repeatPassword: string
  gender: 'Male' | 'Female'
}

const EMPTY: FormData = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  phone: '',
  affiliation: '',
  country: '',
  password: '',
  repeatPassword: '',
  gender: 'Male',
}

// Field, urutan, dan aturan validasi di halaman ini SENGAJA niru persis
// VRegisterForm.vue di ocs2 (IAPA-OCS2-FE) — termasuk pesan error dan
// filter input (nama/afiliasi/negara cuma huruf, telepon cuma angka).
const onlyAlphabet = (v: string) => v.replace(/[^A-Za-z\s]/g, '')
const onlyNumbers = (v: string) => v.replace(/\D/g, '')
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+={}[\]|\\:;"'<>,.?/-]{8,}$/

export function RegisterPage() {
  usePageTitle('Daftar')
  const [form, setForm] = useState<FormData>(EMPTY)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const requiredLabels: Record<keyof Omit<FormData, 'gender'>, string> = {
      firstName: 'First Name',
      lastName: 'Last Name',
      username: 'Username',
      email: 'Email',
      phone: 'Phone',
      affiliation: 'Affiliation',
      country: 'Country',
      password: 'Password',
      repeatPassword: 'Repeat Password',
    }
    const missing = (Object.keys(requiredLabels) as (keyof typeof requiredLabels)[]).filter((k) => !form[k])
    if (missing.length > 0) {
      setError(`Please fill in the following fields: ${missing.map((k) => requiredLabels[k]).join(', ')}`)
      return
    }
    if (!EMAIL_PATTERN.test(form.email)) {
      setError('Invalid email format. Please enter a valid email.')
      return
    }
    if (!PASSWORD_PATTERN.test(form.password)) {
      setError('Password must be at least 8 characters long and contain both letters and numbers.')
      return
    }
    if (form.password !== form.repeatPassword) {
      setError('Passwords do not match!')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/register', form)
      toastSuccess('Registrasi berhasil. Silakan login.')
      navigate('/login')
    } catch (err) {
      toastError(err, 'Gagal mendaftar. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-brand-dark">
      <header className="flex items-center justify-between p-4">
        <Link
          to="/"
          className="text-sm font-medium text-gray-500 hover:text-brand-navy dark:text-gray-400 dark:hover:text-brand-orange"
        >
          ← Beranda
        </Link>
        <ThemeToggle />
      </header>
      <div className="flex flex-1 items-center justify-center p-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-brand-dark-surface sm:p-8"
        >
          <Link to="/" className="mb-4 inline-block">
            <img src={logo} alt="IAPA" className="h-9 w-auto" />
          </Link>
          <h1 className="mb-6 text-xl font-bold text-gray-800 dark:text-gray-100">Sign Up</h1>

          {error && (
            <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First Name">
              <input
                value={form.firstName}
                onChange={(e) => set('firstName', onlyAlphabet(e.target.value))}
                placeholder="John"
                className={inputClass}
              />
            </Field>
            <Field label="Last Name">
              <input
                value={form.lastName}
                onChange={(e) => set('lastName', onlyAlphabet(e.target.value))}
                placeholder="Doe"
                className={inputClass}
              />
            </Field>
            <Field label="Username">
              <input
                value={form.username}
                onChange={(e) => set('username', e.target.value)}
                placeholder="john.doe"
                className={inputClass}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="johndoe@gmail.com"
                className={inputClass}
              />
            </Field>
            <Field label="Phone">
              <input
                value={form.phone}
                onChange={(e) => set('phone', onlyNumbers(e.target.value))}
                placeholder="0813XXXXXXXX"
                className={inputClass}
              />
            </Field>
            <Field label="Affiliation">
              <input
                value={form.affiliation}
                onChange={(e) => set('affiliation', onlyAlphabet(e.target.value))}
                placeholder="Universitas Gadjah Mada"
                className={inputClass}
              />
            </Field>
            <Field label="Country">
              <input
                value={form.country}
                onChange={(e) => set('country', onlyAlphabet(e.target.value))}
                placeholder="Indonesia"
                className={inputClass}
              />
            </Field>
            <Field label="Gender">
              <select value={form.gender} onChange={(e) => set('gender', e.target.value as 'Male' | 'Female')} className={inputClass}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </Field>
            <Field label="Password">
              <input
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="At least 8 characters with letters & numbers"
                className={inputClass}
              />
            </Field>
            <Field label="Repeat Password">
              <input
                type="password"
                value={form.repeatPassword}
                onChange={(e) => set('repeatPassword', e.target.value)}
                placeholder="Repeat your password"
                className={inputClass}
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-md bg-brand-navy py-2 text-sm font-semibold text-white hover:bg-brand-navy-dark disabled:opacity-50 dark:bg-brand-orange dark:hover:bg-brand-orange-dark"
          >
            {loading ? 'Memproses...' : 'Create Account'}
          </button>

          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Sudah punya akun?{' '}
            <Link to="/login" className="font-semibold text-brand-navy dark:text-brand-orange">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {children}
    </div>
  )
}
