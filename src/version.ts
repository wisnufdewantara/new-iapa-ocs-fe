// Satu sumber kebenaran versi newocs, ditampilkan di footer Sidebar &
// halaman Changelog — pola sama kayak IAPA Store (v{number}-{YYMMDD}).
// Sejak 1.0.0 (2026-10-18) OCS baru resmi keluar dari Beta, jadi label
// "Beta" dibuang. Naikkan 'number' pas ada rilis (semver: patch buat
// perbaikan, minor buat fitur baru), update 'date' ke tanggal rilisnya.
export const APP_VERSION = {
  number: '1.2.0',
  date: '2026-10-19',
  get label() {
    const d = new Date(this.date)
    const yymmdd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0')
    return `v${this.number}-${yymmdd}`
  },
}
