"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

export function PosInterface() {
  const [customer, setCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    shoeSize: ''
  })
  const [selectedItems, setSelectedItems] = useState([])
  const [duration, setDuration] = useState(60)
  const [rate, setRate] = useState(200)
  const [availableItems, setAvailableItems] = useState([])
  const [shoeSizes, setShoeSizes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [receiptData, setReceiptData] = useState(null)

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [{ data: inventory }, { data: sizes }] = await Promise.all([
        supabase.from('skate_inventory').select('*').eq('is_available', true),
        supabase.from('shoe_sizes').select('*')
      ])
      setAvailableItems(inventory || [])
      setShoeSizes(sizes || [])
    } catch (error) {
      toast.error("Error loading data")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle item selection
  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId) 
        : [...prev, itemId]
    )
  }

  // Print receipt
  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${receiptData.transactionId}</title>
          <style>
            @page { size: 80mm 100mm; margin: 0; }
            body { 
              padding: 10px; 
              font-family: Arial, sans-serif;
              width: 80mm;
            }
            .header { text-align: center; margin-bottom: 10px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .item-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .total-row { font-weight: bold; margin-top: 10px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #555; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>FitClub</h2>
            <p>123 Skating Ave, City</p>
            <p>Tel: (123) 456-7890</p>
          </div>
          
          <div class="divider"></div>
          
          <div class="item-row">
            <span>Date:</span>
            <span>${format(receiptData.date, 'PPpp')}</span>
          </div>
          <div class="item-row">
            <span>Transaction:</span>
            <span>${receiptData.transactionId}</span>
          </div>
          
          <div class="divider"></div>
          
          <h3>Customer:</h3>
          <p>${receiptData.customer.name}</p>
          ${receiptData.customer.email ? `<p>${receiptData.customer.email}</p>` : ''}
          ${receiptData.customer.phone ? `<p>${receiptData.customer.phone}</p>` : ''}
          
          ${receiptData.items.length > 0 ? `
            <div class="divider"></div>
            <h3>Equipment Rented:</h3>
            ${receiptData.items.map(item => `
              <div class="item-row">
                <span>${item.name} (Size: ${item.size})</span>
                <span>₵0.00</span>
              </div>
            `).join('')}
          ` : ''}
          
          <div class="divider"></div>
          
          <h3>Session Details:</h3>
          <div class="item-row">
            <span>Duration:</span>
            <span>${receiptData.duration} minutes</span>
          </div>
          <div class="item-row">
            <span>Rate:</span>
            <span>₵${receiptData.rate}/hour</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="item-row total-row">
            <span>TOTAL:</span>
            <span>₵${receiptData.amount.toFixed(2)}</span>
          </div>
          
          <div class="footer">
            <p>Thank you for skating with us!</p>
            <p>Please come again</p>
          </div>
          
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 200);
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
    setReceiptData(null)
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // 1. Create or find customer
      let customerId
      if (customer.email || customer.phone) {
        const { data: existingCustomer } = await supabase
          .from('walkin_customers')
          .select('id')
          .or(`email.eq.${customer.email},phone.eq.${customer.phone}`)
          .maybeSingle()
        
        if (existingCustomer) {
          customerId = existingCustomer.id
        } else {
          const { data: newCustomer } = await supabase
            .from('walkin_customers')
            .insert([{
              first_name: customer.firstName,
              last_name: customer.lastName,
              email: customer.email,
              phone: customer.phone,
              shoe_size_id: customer.shoeSize
            }])
            .select()
            .single()
          customerId = newCustomer?.id
        }
      }

      // 2. Calculate amount
      const amount = (duration / 60) * rate
      const transactionId = `POS-${Date.now()}`

      // 3. Create payment
      const { data: payment } = await supabase
        .from('payments')
        .insert([{
          amount,
          payment_method: 'cash',
          transaction_id: transactionId
        }])
        .select()
        .single()

      // 4. Create POS session
      await supabase
        .from('pos_sessions')
        .insert([{
          customer_id: customerId,
          duration_minutes: duration,
          amount_paid: amount,
          payment_id: payment.id
        }])

      // 5. Update inventory availability for selected items
      if (selectedItems.length > 0) {
        await supabase
          .from('skate_inventory')
          .update({ is_available: false })
          .in('id', selectedItems)
      }

      // Generate receipt data
      setReceiptData({
        transactionId,
        customer: {
          name: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          phone: customer.phone
        },
        items: availableItems.filter(item => selectedItems.includes(item.id)),
        duration,
        rate,
        amount,
        date: new Date()
      })

      if (customer.email) {
        console.log('Attempting to send email to:', customer.email)
        const emailResponse = await fetch('/api/send-walkin-receipt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerName: `${customer.firstName} ${customer.lastName}`,
            email: customer.email,
            transactionId,
            items: availableItems.filter(item => selectedItems.includes(item.id)),
            duration,
            rate,
            amount,
            date: new Date()
          }),
        })

        const emailResult = await emailResponse.json()
        console.log('Email API response:', emailResult)

        if (!emailResponse.ok) {
          throw new Error('Failed to send receipt email')
        }
      }

      toast.success("Session created successfully")
      loadData()
    } catch (error) {
      toast.error("Error processing session")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>New Walk-In Session</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={customer.firstName}
                  onChange={(e) => setCustomer({...customer, firstName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={customer.lastName}
                  onChange={(e) => setCustomer({...customer, lastName: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={customer.email}
                  onChange={(e) => setCustomer({...customer, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={customer.phone}
                  onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shoeSize">Shoe Size</Label>
              <Select
                value={customer.shoeSize}
                onValueChange={(value) => setCustomer({...customer, shoeSize: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shoe size" />
                </SelectTrigger>
                <SelectContent>
                  {shoeSizes.map((size) => (
                    <SelectItem key={size.id} value={size.id}>
                      {size.size} - {size.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Select Equipment (Optional)</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                {availableItems.length > 0 ? (
                  availableItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                      <Checkbox
                        id={`item-${item.id}`}
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => toggleItemSelection(item.id)}
                      />
                      <Label htmlFor={`item-${item.id}`} className="flex-1 cursor-pointer">
                        <div className="flex justify-between items-center">
                          <span>{item.name} (Size: {item.size})</span>
                          <Badge variant="outline" className="ml-2">
                            Qty: {item.quantity}
                          </Badge>
                        </div>
                      </Label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 p-2">No available equipment</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  step="15"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate">Hourly Rate (₵)</Label>
                <Input
                  id="rate"
                  type="number"
                  min="1"
                  step="0.5"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="pt-4">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>₵{((duration / 60) * rate).toFixed(2)}</span>
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Processing...' : 'Create Session & Process Payment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Receipt Modal */}
      {receiptData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <div className="p-4">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold">FitClub</h2>
                <p className="text-sm text-gray-500">123 Skating Ave, City</p>
                <p className="text-sm text-gray-500">Tel: (123) 456-7890</p>
              </div>
              
              <div className="border-t border-b py-2 my-2">
                <p className="text-sm">
                  <span className="font-medium">Date:</span> {format(receiptData.date, 'PPpp')}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Transaction:</span> {receiptData.transactionId}
                </p>
              </div>

              <div className="mb-4">
                <h3 className="font-medium mb-1">Customer:</h3>
                <p>{receiptData.customer.name}</p>
                {receiptData.customer.email && <p>{receiptData.customer.email}</p>}
                {receiptData.customer.phone && <p>{receiptData.customer.phone}</p>}
              </div>

              {receiptData.items.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium mb-1">Equipment Rented:</h3>
                  <ul className="space-y-1">
                    {receiptData.items.map(item => (
                      <li key={item.id} className="flex justify-between">
                        <span>{item.name} (Size: {item.size})</span>
                        <span>₵0.00</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mb-4">
                <h3 className="font-medium mb-1">Session Details:</h3>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span>{receiptData.duration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Rate:</span>
                  <span>₵{receiptData.rate}/hour</span>
                </div>
              </div>

              <div className="border-t pt-2">
                <div className="flex justify-between font-bold">
                  <span>TOTAL:</span>
                  <span>₵{receiptData.amount.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center mt-6 text-xs text-gray-500">
                <p>Thank you for skating with us!</p>
                <p>Please come again</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setReceiptData(null)}>
                Close
              </Button>
              <Button onClick={handlePrintReceipt}>
                Print Receipt
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}