// Satu sumber kebenaran versi newocs, ditampilkan di footer Sidebar —
// pola sama kayak IAPA Store (v{number}-{YYMMDD}), tapi masih Beta
// (belum ada rilis semver formal) jadi labelnya lebih santai dulu.
// Naikkan 'number' pas ada rilis besar, update 'date' ke tanggal itu.
export const APP_VERSION = {
  number: '0.1.0',
  date: '2026-09-21',
  get label() {
    const d = new Date(this.date)
    const yymmdd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0')
    return `Beta ${this.number}-${yymmdd}`
  },
}
