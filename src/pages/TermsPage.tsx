import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '../components/ThemeToggle'
import { usePageTitle } from '../hooks/usePageTitle'
import logo from '../assets/logo-iapa.png'

type Lang = 'id' | 'en'

interface Section {
  title: string
  points: string[]
}

// Versi bertanggal — kalau isinya diubah, naikkan EFFECTIVE_DATE juga.
// Akun yang terdaftar sebelum 2026-10-09 dianggap menyetujui versi ini
// (users.terms_accepted_at di-backfill saat fitur ini rilis).
const EFFECTIVE_DATE = { id: '9 Oktober 2026', en: '9 October 2026' }

const CONTACT = { email: 'sekretariat@iapa.or.id', wa: '+62 811-3552-686', waLink: 'https://wa.me/628113552686' }

const CONTENT: Record<Lang, { title: string; intro: string; sections: Section[] }> = {
  id: {
    title: 'Syarat dan Ketentuan Penggunaan',
    intro:
      'Syarat dan Ketentuan ini mengatur penggunaan Open Conference System (OCS) Indonesian Association for Public Administration (IAPA). Mohon dibaca dengan saksama.',
    sections: [
      {
        title: 'Ketentuan Umum',
        points: [
          'Sistem ini dikelola oleh Indonesian Association for Public Administration (IAPA) untuk pendaftaran akun, pengiriman paper, pendaftaran peserta, pembayaran, dan administrasi konferensi yang diselenggarakan IAPA bersama mitra penyelenggaranya.',
          'Dengan membuat akun, mengirim paper, mendaftar sebagai peserta, atau melakukan pembayaran, Anda menyatakan telah membaca, memahami, dan menyetujui Syarat dan Ketentuan ini.',
          'Apabila Anda tidak menyetujui Syarat dan Ketentuan ini, mohon untuk tidak menggunakan sistem ini.',
        ],
      },
      {
        title: 'Akun Pengguna',
        points: [
          'Data akun (nama, email, afiliasi, nomor telepon) wajib benar, terkini, dan milik Anda sendiri. Nama pada akun digunakan pada LoA, invoice, kwitansi, dan sertifikat.',
          'Satu orang hanya boleh memiliki satu akun. Dilarang membuat akun atas nama orang lain atau menggunakan identitas maupun email milik orang lain.',
          'Anda bertanggung jawab menjaga kerahasiaan kata sandi dan atas seluruh aktivitas yang dilakukan melalui akun Anda. Jika lupa kata sandi, gunakan fitur Lupa Password — jangan membuat akun baru.',
          'Penyelenggara berhak menonaktifkan, menggabungkan, atau mengoreksi akun yang terbukti ganda, palsu, atau disalahgunakan.',
        ],
      },
      {
        title: 'Pengiriman Paper',
        points: [
          'Paper yang dikirim harus merupakan karya asli penulis, belum pernah dipublikasikan, dan tidak sedang dalam proses publikasi di tempat lain, kecuali dinyatakan lain oleh penyelenggara.',
          'Pengirim (submitter) menjamin bahwa seluruh penulis yang dicantumkan telah menyetujui pengiriman paper dan pencantuman namanya.',
          'Penyelenggara berhak memeriksa tingkat kemiripan (plagiarisme) dan menolak atau membatalkan paper yang melanggar etika akademik, termasuk setelah paper dinyatakan diterima.',
          'Keputusan reviewer dan penyelenggara mengenai penerimaan paper bersifat final.',
          'Hak cipta tetap berada pada penulis. Dengan mengirim paper, penulis memberikan izin kepada IAPA untuk menampilkan, mendokumentasikan, dan menerbitkan paper dalam prosiding atau jurnal mitra sesuai ketentuan publikasi masing-masing konferensi.',
        ],
      },
      {
        title: 'Pendaftaran dan Pembayaran',
        points: [
          'Besaran biaya ditetapkan oleh penyelenggara dan tercantum pada invoice di sistem. Tarif anggota IAPA hanya berlaku bagi anggota aktif yang keanggotaannya dapat diverifikasi.',
          'Pembayaran dilakukan sesuai nominal pada invoice (termasuk kode unik, bila ada), kemudian bukti transfer diunggah melalui sistem. Pendaftaran dinyatakan sah setelah pembayaran diverifikasi oleh penyelenggara.',
          'Biaya transfer dan biaya administrasi bank menjadi tanggungan pembayar.',
        ],
      },
      {
        title: 'Kebijakan Pembatalan dan Pengembalian Dana (Non-Refundable)',
        points: [
          'Seluruh pembayaran yang telah diterima bersifat final dan TIDAK DAPAT DIKEMBALIKAN (non-refundable) dalam kondisi apa pun.',
          'Ketentuan ini berlaku termasuk namun tidak terbatas pada: pembatalan atau pengunduran diri peserta maupun penulis; ketidakhadiran; penarikan paper oleh penulis; penolakan atau pembatalan paper karena pelanggaran etika setelah pembayaran; penolakan visa atau kendala perjalanan; sakit, bencana, atau keadaan kahar (force majeure); serta perubahan jadwal, tempat, atau format kegiatan (luring/daring), termasuk penundaan.',
          'Dengan melakukan pembayaran, Anda menyatakan telah memahami dan menyetujui kebijakan non-refundable ini.',
        ],
      },
      {
        title: 'Perubahan Kegiatan',
        points: [
          'Penyelenggara berhak mengubah jadwal, tempat, format, pembicara, dan susunan acara apabila diperlukan. Informasi perubahan disampaikan melalui sistem dan/atau email. Perubahan tersebut tidak menimbulkan hak atas pengembalian dana.',
        ],
      },
      {
        title: 'LoA, Invoice, Kwitansi, dan Sertifikat',
        points: [
          'Dokumen diterbitkan berdasarkan data akun serta status pembayaran dan kehadiran. Pastikan data Anda benar sebelum dokumen diterbitkan; permintaan koreksi setelah terbit dapat diajukan kepada sekretariat.',
          'Keaslian sertifikat dapat diverifikasi melalui kode QR yang tercantum. Pemalsuan atau penyalahgunaan dokumen dapat diproses sesuai ketentuan hukum yang berlaku.',
        ],
      },
      {
        title: 'Pelindungan Data Pribadi',
        points: [
          'Data pribadi dikumpulkan dan diproses untuk keperluan administrasi konferensi, yaitu pengelolaan akun, pengiriman dan review paper, pembayaran, penerbitan dokumen, serta komunikasi terkait kegiatan, dengan mengacu pada Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi.',
          'Data dapat dibagikan secara terbatas kepada mitra penyelenggara, reviewer, dan penerbit prosiding sepanjang diperlukan untuk penyelenggaraan kegiatan. Data tidak diperjualbelikan kepada pihak ketiga.',
          'Email notifikasi dari sistem dapat memuat penanda baca (read tracking) untuk memantau keterkiriman email.',
          'Anda dapat mengajukan permintaan akses, koreksi, atau penghapusan data kepada sekretariat. Data tertentu, seperti catatan pembayaran, dapat tetap disimpan selama diperlukan untuk kepentingan administrasi dan keuangan.',
        ],
      },
      {
        title: 'Dokumentasi Kegiatan',
        points: [
          'Kegiatan konferensi dapat difoto dan/atau direkam. Dengan menghadiri kegiatan, peserta menyetujui penggunaan dokumentasi tersebut untuk publikasi dan laporan kegiatan IAPA.',
        ],
      },
      {
        title: 'Larangan Penyalahgunaan',
        points: [
          'Pengguna dilarang mengakses sistem tanpa hak, mengunggah file berbahaya, memalsukan bukti pembayaran, atau mengganggu jalannya layanan. Pelanggaran dapat mengakibatkan penonaktifan akun dan pembatalan pendaftaran tanpa pengembalian dana.',
        ],
      },
      {
        title: 'Batasan Tanggung Jawab',
        points: [
          'Sistem disediakan sebagaimana adanya. Penyelenggara berupaya menjaga ketersediaan layanan, namun tidak menjamin layanan bebas dari gangguan.',
          'Penyelenggara tidak bertanggung jawab atas kerugian tidak langsung yang timbul akibat gangguan sistem, keterlambatan pengiriman email, atau kesalahan data yang diisi oleh pengguna.',
        ],
      },
      {
        title: 'Perubahan Syarat dan Ketentuan',
        points: [
          'Syarat dan Ketentuan ini dapat diperbarui sewaktu-waktu. Versi terbaru berlaku sejak dipublikasikan di halaman ini, dan penggunaan sistem secara berkelanjutan dianggap sebagai persetujuan atas perubahan tersebut.',
        ],
      },
      {
        title: 'Hukum yang Berlaku dan Kontak',
        points: [
          'Syarat dan Ketentuan ini tunduk pada hukum Republik Indonesia. Setiap perselisihan akan diupayakan penyelesaiannya terlebih dahulu secara musyawarah.',
        ],
      },
    ],
  },
  en: {
    title: 'Terms and Conditions of Use',
    intro:
      'These Terms and Conditions govern the use of the Open Conference System (OCS) of the Indonesian Association for Public Administration (IAPA). Please read them carefully.',
    sections: [
      {
        title: 'General',
        points: [
          'This system is operated by the Indonesian Association for Public Administration (IAPA) for account registration, paper submission, participant registration, payment, and administration of conferences organised by IAPA and its co-organisers.',
          'By creating an account, submitting a paper, registering as a participant, or making a payment, you confirm that you have read, understood, and agreed to these Terms and Conditions.',
          'If you do not agree to these Terms and Conditions, please do not use this system.',
        ],
      },
      {
        title: 'User Accounts',
        points: [
          'Account details (name, email, affiliation, phone number) must be accurate, up to date, and your own. The name on your account is used on Letters of Acceptance, invoices, receipts, and certificates.',
          'Each person may hold only one account. Creating an account in another person’s name, or using someone else’s identity or email address, is not permitted.',
          'You are responsible for keeping your password confidential and for all activity carried out through your account. If you forget your password, use the Forgot Password feature — do not create a new account.',
          'The organiser may deactivate, merge, or correct accounts found to be duplicate, false, or misused.',
        ],
      },
      {
        title: 'Paper Submission',
        points: [
          'Submitted papers must be the authors’ original work, not previously published, and not under consideration elsewhere, unless stated otherwise by the organiser.',
          'The submitter guarantees that all listed authors have agreed to the submission and to the inclusion of their names.',
          'The organiser may check papers for similarity (plagiarism) and may reject or withdraw papers that breach academic ethics, including after acceptance.',
          'Decisions of the reviewers and the organiser on paper acceptance are final.',
          'Copyright remains with the authors. By submitting a paper, authors grant IAPA permission to present, document, and publish the paper in proceedings or partner journals in accordance with each conference’s publication terms.',
        ],
      },
      {
        title: 'Registration and Payment',
        points: [
          'Fees are set by the organiser and shown on the invoice in the system. IAPA member rates apply only to active members whose membership can be verified.',
          'Payment must match the invoice amount (including any unique code), and proof of transfer must be uploaded through the system. Registration is valid only once the payment has been verified by the organiser.',
          'Bank transfer and administration charges are borne by the payer.',
        ],
      },
      {
        title: 'Cancellation and Refund Policy (Non-Refundable)',
        points: [
          'All payments received are final and NON-REFUNDABLE under any circumstances.',
          'This applies including, but not limited to: cancellation or withdrawal by a participant or author; non-attendance; withdrawal of a paper by its author; rejection or withdrawal of a paper due to an ethics breach after payment; visa refusal or travel difficulties; illness, disaster, or force majeure; and changes to the schedule, venue, or format (in-person/online) of the event, including postponement.',
          'By making a payment, you confirm that you understand and accept this non-refundable policy.',
        ],
      },
      {
        title: 'Changes to the Event',
        points: [
          'The organiser may change the schedule, venue, format, speakers, and programme where necessary. Changes will be communicated through the system and/or by email. Such changes do not give rise to any right to a refund.',
        ],
      },
      {
        title: 'Letters of Acceptance, Invoices, Receipts, and Certificates',
        points: [
          'Documents are issued based on account details and payment and attendance status. Please make sure your details are correct before documents are issued; correction requests after issuance can be sent to the secretariat.',
          'Certificate authenticity can be verified through the QR code printed on it. Forgery or misuse of documents may be pursued under applicable law.',
        ],
      },
      {
        title: 'Personal Data Protection',
        points: [
          'Personal data is collected and processed for conference administration — managing accounts, paper submission and review, payment, document issuance, and event-related communication — with reference to Indonesian Law No. 27 of 2022 on Personal Data Protection.',
          'Data may be shared, to the extent necessary, with co-organisers, reviewers, and proceedings publishers. Data is never sold to third parties.',
          'Notification emails sent by the system may contain a read-tracking marker used to monitor email delivery.',
          'You may request access to, correction of, or deletion of your data by contacting the secretariat. Certain data, such as payment records, may be retained as long as required for administrative and financial purposes.',
        ],
      },
      {
        title: 'Event Documentation',
        points: [
          'Conference activities may be photographed and/or recorded. By attending, participants agree to the use of such documentation in IAPA publications and event reports.',
        ],
      },
      {
        title: 'Prohibited Use',
        points: [
          'Users must not access the system without authorisation, upload harmful files, falsify proof of payment, or disrupt the service. Violations may result in account deactivation and cancellation of registration without refund.',
        ],
      },
      {
        title: 'Limitation of Liability',
        points: [
          'The system is provided as is. The organiser strives to keep the service available but does not guarantee that it will be free from disruption.',
          'The organiser is not liable for indirect losses arising from system disruption, delayed email delivery, or incorrect data entered by users.',
        ],
      },
      {
        title: 'Changes to these Terms',
        points: [
          'These Terms and Conditions may be updated at any time. The latest version applies from its publication on this page, and continued use of the system constitutes acceptance of the changes.',
        ],
      },
      {
        title: 'Governing Law and Contact',
        points: [
          'These Terms and Conditions are governed by the laws of the Republic of Indonesia. Any dispute will first be resolved through amicable deliberation.',
        ],
      },
    ],
  },
}

export function TermsPage() {
  const [lang, setLang] = useState<Lang>('id')
  const t = CONTENT[lang]
  usePageTitle(t.title)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-dark">
      <header className="flex items-center justify-between p-4">
        <Link to="/" className="btn btn-ghost btn-sm">
          ← {lang === 'id' ? 'Beranda' : 'Home'}
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-gray-300 text-xs dark:border-white/15">
            {(['id', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 font-medium ${
                  lang === l
                    ? 'bg-brand-navy text-white dark:bg-brand-orange'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-brand-dark-surface sm:p-10">
          <img src={logo} alt="IAPA" className="mb-6 h-9 w-auto" />
          <h1 className="mb-1 text-2xl font-bold text-gray-800 dark:text-gray-100">{t.title}</h1>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            {lang === 'id' ? 'Berlaku sejak' : 'Effective'} {EFFECTIVE_DATE[lang]}
          </p>
          <p className="mb-8 text-gray-700 dark:text-gray-300">{t.intro}</p>

          <ol className="space-y-7">
            {t.sections.map((s, i) => {
              const isRefund = s.title.includes('Non-Refundable')
              return (
                <li
                  key={s.title}
                  className={
                    isRefund
                      ? 'rounded-md border border-brand-orange/40 bg-brand-orange/5 p-4 dark:border-brand-orange/30'
                      : ''
                  }
                >
                  <h2 className="mb-2 font-semibold text-gray-800 dark:text-gray-100">
                    {i + 1}. {s.title}
                  </h2>
                  <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                    {s.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </li>
              )
            })}
          </ol>

          <div className="mt-8 border-t border-gray-200 pt-6 text-sm text-gray-700 dark:border-white/10 dark:text-gray-300">
            <p className="mb-1 font-semibold">{lang === 'id' ? 'Sekretariat IAPA' : 'IAPA Secretariat'}</p>
            <p>
              Email:{' '}
              <a href={`mailto:${CONTACT.email}`} className="text-brand-navy hover:underline dark:text-brand-orange">
                {CONTACT.email}
              </a>
            </p>
            <p>
              WhatsApp:{' '}
              <a href={CONTACT.waLink} target="_blank" rel="noreferrer" className="text-brand-navy hover:underline dark:text-brand-orange">
                {CONTACT.wa}
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
