import { usePageTitle } from '../hooks/usePageTitle'
import { MyPaymentCards } from '../components/MyPaymentCards'

export function PaymentPage() {
  usePageTitle('Pembayaran Saya')

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-100">Pembayaran Saya</h1>
      <MyPaymentCards />
    </div>
  )
}
