'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CreditCard, PlusCircle } from 'lucide-react'

interface BalanceData {
  balance: string
  pricing: {
    pricePerTonRub: number
  }
}

export default function CreditsPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [creditsToBuy, setCreditsToBuy] = useState(100)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!user) return

    async function fetchBalance() {
      try {
        setLoading(true)
        const res = await fetch('/api/credits/balance')
        if (res.ok) {
          const json = await res.json()
          setBalance(json.data)
        }
      } catch (err) {
        console.error('Ошибка загрузки баланса:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBalance()
  }, [user])

  const handlePurchase = async () => {
    if (!user) return
    setProcessing(true)
    try {
      const res = await fetch(`/api/payments/create?organizationId=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CREDITS',
          creditsAmount: creditsToBuy,
        }),
      })

      if (res.ok) {
        const json = await res.json()
        const url = json.payment?.confirmationUrl
        if (url) {
          window.location.href = url
          return
        }
      }
      alert('Не удалось создать платёж')
    } catch (err) {
      console.error('Ошибка создания платежа:', err)
      alert('Ошибка создания платежа')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Кредиты
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <p>Загрузка...</p>
          ) : (
            <div className="space-y-4">
              <p>
                Текущий баланс: <strong>{balance?.balance || '0'}</strong> т CO₂
              </p>
              <div className="flex items-end gap-4">
                <Input
                  type="number"
                  min={1}
                  label="Количество тонн"
                  value={creditsToBuy}
                  onChange={(e) => setCreditsToBuy(parseInt(e.target.value, 10))}
                />
                <Button onClick={handlePurchase} disabled={processing} className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Купить
                </Button>
              </div>
              {balance && (
                <p className="text-sm text-muted-foreground">
                  Цена: {creditsToBuy * (balance.pricing.pricePerTonRub || 5)} ₽
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

