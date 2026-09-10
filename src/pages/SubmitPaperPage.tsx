import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/axios'
import { usePageTitle } from '../hooks/usePageTitle'
import { useActiveConferences } from '../hooks/useActiveConferences'
import { toastSuccess, toastError } from '../lib/toast'

interface ConferenceSubTheme {
  sub_theme: string | null
}

interface ActiveConference {
  conference_id: string
  conference_name: string
  conference_sub_theme: ConferenceSubTheme[]
}

interface MyPaper {
  paperId: string
  paperTitle: string
  conferenceStatus: string | null
  paperStatus: string
  documentUrl: string | null
}

interface Profile {
  firstName: string
  lastName: string
  email: string
  gender: 'Male' | 'Female'
  affiliation: string
  phone: string
}

interface AuthorForm {
  firstName: string
  lastName: string
  gender: 'male' | 'female' | 'other'
  affiliation: string
  email: string
  phoneNumber: string
  statusMember: boolean
}

const emptyAuthor: AuthorForm = {
  firstName: '',
  lastName: '',
  gender: 'male',
  affiliation: '',
  email: '',
  phoneNumber: '',
  statusMember: false,
}

const onlyAlphabet = (v: string) => v.replace(/[^A-Za-z\s]/g, '')
const onlyNumbers = (v: string) => v.replace(/\D/g, '')

// Dipakai kalau conference belum punya sub-tema sendiri di database —
// niru fallback list di UploadPaperView.vue lama, biar dropdown nggak
// kosong sama sekali.
const DEFAULT_SUB_THEMES = [
  'Digital Governance and Social Inclusion',
  'Crisis Management and Community Resilience',
  'Green Policy and Political Ecology',
  'Localizing SDGs: Bridging Global Goals with Local Action',
  'Populism, Identity Politics and Democratic Governance',
  'Global Supply Chain and Local Labor Welfare',
  'Gender, Youth and Power Dynamics in Public Space',
  'Smart City and Urban-Rural Connectivity',
  'Ethics, Accountability and Anti-Corruption Culture',
  'Mental Health and Public Well-being',
]

export function SubmitPaperPage() {
  usePageTitle('Submit Paper')
  const queryClient = useQueryClient()

  const [paperTitle, setPaperTitle] = useState('')
  const [abstractText, setAbstractText] = useState('')
  const [keywords, setKeywords] = useState('')
  const [subTheme, setSubTheme] = useState('')
  const [authors, setAuthors] = useState<AuthorForm[]>([{ ...emptyAuthor }])
  const [file, setFile] = useState<File | null>(null)
  const [conferenceId, setConferenceId] = useState('')

  // /active bisa balikin lebih dari 1 conference sekaligus (belum
  // "ended" bareng) — defaultnya pilih prioritas tertinggi (ongoing
  // duluan, urutan dari backend), tapi kalau ada lebih dari satu user
  // bisa ganti sendiri lewat picker di bawah, bukan otomatis kekunci ke
  // yang pertama.
  const { data: activeConferences } = useActiveConferences<ActiveConference>()

  useEffect(() => {
    if (activeConferences && activeConferences.length > 0 && !conferenceId) {
      setConferenceId(activeConferences[0].conference_id)
    }
  }, [activeConferences, conferenceId])

  const conference = activeConferences?.find((c) => c.conference_id === conferenceId)

  const { data: myPaper, isLoading: loadingMine } = useQuery({
    queryKey: ['papers', 'mine'],
    queryFn: async () => (await api.get<MyPaper | null>('/papers/mine')).data,
  })

  const { data: profile } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => (await api.get<Profile>('/auth/me')).data,
  })

  // Isi otomatis penulis pertama dari profil user yang lagi login, niru
  // VSubmitPaper.vue lama — cuma sekali pas profile-nya kebaca.
  useEffect(() => {
    if (!profile) return
    setAuthors((prev) => {
      if (prev.length !== 1 || prev[0].firstName || prev[0].email) return prev
      return [
        {
          firstName: profile.firstName,
          lastName: profile.lastName,
          gender: profile.gender === 'Female' ? 'female' : 'male',
          affiliation: profile.affiliation,
          email: profile.email,
          phoneNumber: profile.phone,
          statusMember: false,
        },
      ]
    })
  }, [profile])

  const submitMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData()
      formData.append('paperTitle', paperTitle)
      formData.append('abstractText', abstractText)
      formData.append('keywords', keywords)
      formData.append('subTheme', subTheme)
      formData.append('authors', JSON.stringify(authors))
      formData.append('conferenceId', conferenceId)
      if (file) formData.append('document', file)
      return api.post('/papers', formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['papers', 'mine'] })
      toastSuccess('Paper berhasil disubmit!')
    },
    onError: (err) => toastError(err, 'Gagal submit paper.'),
  })

  const updateAuthor = (index: number, patch: Partial<AuthorForm>) => {
    setAuthors((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)))
  }

  const conferenceSubThemes = conference?.conference_sub_theme.map((s) => s.sub_theme).filter(Boolean) as
    | string[]
    | undefined
  const subThemeOptions = conferenceSubThemes && conferenceSubThemes.length > 0 ? conferenceSubThemes : DEFAULT_SUB_THEMES

  if (loadingMine) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
  }

  if (myPaper) {
    return (
      <div>
        <h1 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-100">Submit Paper</h1>
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-brand-dark-surface">
          <p className="text-sm text-gray-600 dark:text-gray-300">Kamu sudah pernah submit paper:</p>
          <p className="mt-2 text-lg font-semibold text-gray-800 dark:text-gray-100">{myPaper.paperTitle}</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Status: {myPaper.conferenceStatus ?? '-'} / {myPaper.paperStatus}
          </p>
          {myPaper.documentUrl && (
            <a
              href={myPaper.documentUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm font-medium text-brand-navy hover:underline dark:text-brand-orange"
            >
              Lihat dokumen
            </a>
          )}
        </div>
      </div>
    )
  }

  if (!conference) {
    return (
      <div>
        <h1 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-100">Submit Paper</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Belum ada conference yang sedang aktif untuk submit paper saat ini.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-100">Submit Paper</h1>

      {activeConferences && activeConferences.length > 1 ? (
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Pilih Conference
          </label>
          <select
            value={conferenceId}
            onChange={(e) => {
              setConferenceId(e.target.value)
              setSubTheme('')
            }}
            className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
          >
            {activeConferences.map((c) => (
              <option key={c.conference_id} value={c.conference_id}>
                {c.conference_name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Untuk: {conference.conference_name}</p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          submitMutation.mutate()
        }}
        className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-brand-dark-surface"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Judul Paper</label>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
            value={paperTitle}
            onChange={(e) => setPaperTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Abstrak</label>
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
            rows={5}
            value={abstractText}
            onChange={(e) => setAbstractText(e.target.value)}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Keywords</label>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="pisahkan dengan koma"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Sub Tema</label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
              value={subTheme}
              onChange={(e) => setSubTheme(e.target.value)}
              required
            >
              <option value="">-- pilih sub tema --</option>
              {subThemeOptions?.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Dokumen Paper (PDF)</label>
          <input
            type="file"
            accept="application/pdf"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Penulis</h2>
            <button
              type="button"
              onClick={() => setAuthors((prev) => [...prev, { ...emptyAuthor }])}
              className="text-xs font-medium text-brand-navy hover:underline dark:text-brand-orange"
            >
              + Tambah Penulis
            </button>
          </div>

          <div className="space-y-4">
            {authors.map((author, i) => (
              <div key={i} className="rounded-md border border-gray-200 p-4 dark:border-white/10">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {i === 0 ? 'Presenter (kamu)' : `Penulis ${i + 1}`}
                  </span>
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => setAuthors((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-xs font-medium text-red-500 hover:underline"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                    placeholder="Nama depan"
                    value={author.firstName}
                    onChange={(e) => updateAuthor(i, { firstName: onlyAlphabet(e.target.value) })}
                    required
                  />
                  <input
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                    placeholder="Nama belakang"
                    value={author.lastName}
                    onChange={(e) => updateAuthor(i, { lastName: onlyAlphabet(e.target.value) })}
                    required
                  />
                  <select
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                    value={author.gender}
                    onChange={(e) => updateAuthor(i, { gender: e.target.value as AuthorForm['gender'] })}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                    placeholder="Afiliasi"
                    value={author.affiliation}
                    onChange={(e) => updateAuthor(i, { affiliation: e.target.value })}
                    required
                  />
                  <input
                    type="email"
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                    placeholder="Email"
                    value={author.email}
                    onChange={(e) => updateAuthor(i, { email: e.target.value })}
                    required
                  />
                  <input
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-brand-dark-surface dark:text-gray-100"
                    placeholder="No. telepon"
                    value={author.phoneNumber}
                    onChange={(e) => updateAuthor(i, { phoneNumber: onlyNumbers(e.target.value) })}
                    required
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitMutation.isPending}
          className="rounded-md bg-brand-navy px-5 py-2 text-sm font-semibold text-white hover:bg-brand-navy-dark disabled:opacity-50 dark:bg-brand-orange dark:hover:bg-brand-orange-dark"
        >
          {submitMutation.isPending ? 'Mengirim...' : 'Submit Paper'}
        </button>
      </form>

      <Link to="/dashboard" className="mt-4 inline-block text-sm text-gray-500 hover:underline dark:text-gray-400">
        ← Kembali ke Dashboard
      </Link>
    </div>
  )
}
