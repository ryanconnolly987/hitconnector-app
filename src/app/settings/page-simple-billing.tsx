'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth"
import { API_BASE_URL } from "@/lib/config"
import { CreditCard, Trash2 } from "lucide-react"

interface BillingTransaction {
  id: string
  studioName: string
  amount: number
  date: string
  createdAt: string
  description: string
  paymentMethodLast4: string
}

export default function SimpleBillingSection() {
  const { user } = useAuth()
  const [billingTransactions, setBillingTransactions] = useState<BillingTransaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)

  useEffect(() => {
    loadBillingTransactions()
  }, [user])

  const loadBillingTransactions = async () => {
    if (!user) return
    
    setLoadingTransactions(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/billing/transactions?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setBillingTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Error loading billing transactions:', error)
      setBillingTransactions([])
    } finally {
      setLoadingTransactions(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing & Payments</CardTitle>
        <CardDescription>
          Manage your payment methods and billing history
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6" />
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/27</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Edit</Button>
              <Button variant="outline" size="sm">Remove</Button>
            </div>
          </div>

          <Button variant="outline" className="w-full">
            <CreditCard className="h-4 w-4 mr-2" />
            Add Payment Method
          </Button>
        </div>

        <div>
          <h4 className="font-medium mb-3">Recent Transactions</h4>
          {loadingTransactions ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading transactions...
            </div>
          ) : billingTransactions.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No transactions found. Complete a booking to see your payment history.
            </div>
          ) : (
            <div className="space-y-2">
              {billingTransactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{transaction.studioName}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(transaction.createdAt)}</p>
                  </div>
                  <span className="font-medium">{formatCurrency(transaction.amount)}</span>
                </div>
              ))}
              {billingTransactions.length > 5 && (
                <Button variant="outline" className="w-full mt-2">
                  View All Transactions
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-3 text-red-600">Danger Zone</h4>
          <Card className="border-red-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h5 className="font-medium">Delete Account</h5>
                  <p className="text-sm text-muted-foreground mt-1">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
} 