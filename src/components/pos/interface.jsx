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
import { Trash2 } from 'lucide-react'
import { countryCodes } from '../data/CountryCodes'
import { CountryCodeSelect } from '../data/CountryCodeSelect'

export function PosInterface() {
  const [primaryCustomer, setPrimaryCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    phoneCountryCode: '+233',
    shoeSize: ''
  })
  const [emailError, setEmailError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [additionalCustomers, setAdditionalCustomers] = useState([])
  const [selectedItems, setSelectedItems] = useState([])
  const [paymentPlans, setPaymentPlans] = useState([])
  const [customerPayments, setCustomerPayments] = useState([])
  const [availableItems, setAvailableItems] = useState([])
  const [shoeSizes, setShoeSizes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [receiptData, setReceiptData] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const validateEmail = (email) => {
    if (!email) return true
    
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const validatePhone = (phone) => {
    if (!phone) return true
    
    const digits = phone.replace(/\D/g, '')
    return digits.length >= 7
  }

  const handleEmailChange = (e) => {
    const email = e.target.value
    setPrimaryCustomer({...primaryCustomer, email})
    
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address')
    } else {
      setEmailError('')
    }
  }

  const handlePhoneChange = (e) => {
    const phone = e.target.value
    const cleanedValue = phone.replace(/[^\d+]/g, '')
    setPrimaryCustomer({...primaryCustomer, phone: cleanedValue})
    
    if (phone && !validatePhone(phone)) {
      setPhoneError('Please enter a valid phone number (at least 7 digits)')
    } else {
      setPhoneError('')
    }
  }

  const handleCountryCodeChange = (value) => {
    setPrimaryCustomer({...primaryCustomer, phoneCountryCode: value})
  }

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [{ data: inventory }, { data: sizes }, { data: plans }] = await Promise.all([
        supabase.from('skate_inventory').select('*').eq('is_available', true),
        supabase.from('shoe_sizes').select('*'),
        supabase.from('payment_plans').select('*').eq('is_active', true)
      ])
      setAvailableItems(inventory || [])
      setShoeSizes(sizes || [])
      setPaymentPlans(plans || [])
    } catch (error) {
      toast.error("Error loading data")
    } finally {
      setIsLoading(false)
    }
  }

  const addAdditionalCustomer = () => {
    setAdditionalCustomers([...additionalCustomers, { 
      name: '', 
      paymentPlanId: '',
      shoeSize: '' 
    }])
    setCustomerPayments([...customerPayments, { 
      paymentPlanId: '', 
      amount: 0 
    }])
  }

  const updateAdditionalCustomer = (index, field, value) => {
    const updatedCustomers = [...additionalCustomers]
    updatedCustomers[index] = { ...updatedCustomers[index], [field]: value }
    setAdditionalCustomers(updatedCustomers)

    if (field === 'paymentPlanId') {
      const selectedPlan = paymentPlans.find(plan => plan.id === value)
      const updatedPayments = [...customerPayments]
      updatedPayments[index + 1] = { 
        paymentPlanId: value, 
        amount: selectedPlan?.amount || 0 
      }
      setCustomerPayments(updatedPayments)
    }
  }

  const removeAdditionalCustomer = (index) => {
    setAdditionalCustomers(additionalCustomers.filter((_, i) => i !== index))
    setCustomerPayments(customerPayments.filter((_, i) => i !== index + 1))
  }

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handlePrimaryPaymentChange = (planId) => {
    const selectedPlan = paymentPlans.find(plan => plan.id === planId)
    const updatedPayments = [...customerPayments]
    updatedPayments[0] = { paymentPlanId: planId, amount: selectedPlan?.amount || 0 }
    setCustomerPayments(updatedPayments)
  }

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${receiptData.transactionId}</title>
          <style>
            @page { 
              size: 80mm auto; 
              margin: 0;
              margin-top: 5mm;
              margin-bottom: 5mm;
            }
            body { 
              width: 80mm;
              margin: 0 auto;
              padding: 0;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.2;
            }
            .header { 
              text-align: center; 
              margin-bottom: 5px;
              padding-bottom: 5px;
              border-bottom: 1px dashed #000;
            }
            .header h2 {
              margin: 0;
              font-size: 16px;
              font-weight: bold;
            }
            .header p {
              margin: 2px 0;
              font-size: 10px;
            }
            .divider { 
              border-top: 1px dashed #000; 
              margin: 5px 0; 
            }
            .section-title {
              font-weight: bold;
              margin: 5px 0;
            }
            .row { 
              display: flex; 
              justify-content: space-between;
              margin: 3px 0;
            }
            .row.indent {
              padding-left: 10px;
            }
            .total-row { 
              font-weight: bold; 
              margin-top: 8px;
              border-top: 1px solid #000;
              padding-top: 5px;
            }
            .footer { 
              text-align: center; 
              margin-top: 10px; 
              font-size: 10px; 
              border-top: 1px dashed #000;
              padding-top: 5px;
            }
            .text-center {
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>SKATE CITY</h2>
            <p>Afrikiko Leisure Center</p>
            <p>Tel: (233) 553-103-992</p>
          </div>
          
          <div class="row">
            <span>Date:</span>
            <span>${format(receiptData.date, 'MM/dd/yyyy hh:mm a')}</span>
          </div>
          <div class="row">
            <span>Receipt #:</span>
            <span>${receiptData.transactionId}</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="section-title">CUSTOMERS</div>
          ${receiptData.customers.map((cust, index) => `
            <div class="row">
              <span>${index === 0 ? 'Primary' : 'Additional'}:</span>
              <span>${cust.name}</span>
            </div>
            <div class="row indent">
              <span>Plan:</span>
              <span>${paymentPlans.find(plan => plan.id === cust.paymentPlanId)?.name || 'Custom'}</span>
            </div>
            <div class="row indent">
              <span>Amount:</span>
              <span>₵${cust.amount.toFixed(2)}</span>
            </div>
          `).join('')}
          
          ${receiptData.primaryShoeSize ? `
            <div class="divider"></div>
            <div class="section-title">SHOE SIZE</div>
            <div class="row">
              <span>Primary Customer:</span>
              <span>${receiptData.primaryShoeSize}</span>
            </div>
          ` : ''}

          ${receiptData.customers.slice(1).some(c => c.shoeSize) ? `
            <div class="divider"></div>
            <div class="section-title">ADDITIONAL CUSTOMER SHOE SIZES</div>
            ${receiptData.customers
              .slice(1)
              .filter(cust => cust.shoeSize)
              .map(cust => `
                <div class="row">
                  <span>${cust.name}:</span>
                  <span>${cust.shoeSize}</span>
                </div>
              `).join('')}
          ` : ''}

          <div class="divider"></div>
          <div class="section-title">SESSION DETAILS</div>
          <div class="row">
            <span>Duration:</span>
            <span>2 hours</span>
          </div>
          
          ${receiptData.items.length > 0 ? `
            <div class="divider"></div>
            <div class="section-title">EQUIPMENT RENTED</div>
            ${receiptData.items.map(item => `
              <div class="row">
                <span>${item.name}</span>
                <span>Size: ${item.size}</span>
              </div>
            `).join('')}
          ` : ''}
          
          <div class="divider"></div>
          
          <div class="row total-row">
            <span>TOTAL:</span>
            <span>₵${receiptData.totalAmount.toFixed(2)}</span>
          </div>
          
          <div class="footer">
            <div class="text-center">Thank you for skating with us!</div>
            <div>Please come again</div>
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (primaryCustomer.email && !validateEmail(primaryCustomer.email)) {
      setEmailError('Please enter a valid email address')
      return
    }
    
    if (primaryCustomer.phone && !validatePhone(primaryCustomer.phone)) {
      setPhoneError('Please enter a valid phone number (at least 7 digits)')
      return
    }
    
    setIsLoading(true)

    try {
      let customerId
      const fullPhoneNumber = primaryCustomer.phone 
        ? `${primaryCustomer.phoneCountryCode}${primaryCustomer.phone}`
        : ''
      
      if (primaryCustomer.email || fullPhoneNumber) {
        const { data: existingCustomer } = await supabase
          .from('walkin_customers')
          .select('id')
          .or(`email.eq.${primaryCustomer.email},phone.eq.${fullPhoneNumber}`)
          .maybeSingle()
        
        if (existingCustomer) {
          customerId = existingCustomer.id
        } else {
          const { data: newCustomer } = await supabase
            .from('walkin_customers')
            .insert([{
              first_name: primaryCustomer.firstName,
              last_name: primaryCustomer.lastName,
              email: primaryCustomer.email,
              phone: fullPhoneNumber,
              shoe_size_id: primaryCustomer.shoeSize
            }])
            .select()
            .single()
          customerId = newCustomer?.id
        }
      }

      const totalAmount = customerPayments.reduce((sum, payment) => sum + payment.amount, 0)
      const transactionId = `POS-${Date.now()}`

      const { data: payment } = await supabase
        .from('payments')
        .insert([{
          amount: totalAmount,
          payment_method: 'cash',
          transaction_id: transactionId
        }])
        .select()
        .single()

      await supabase
        .from('pos_sessions')
        .insert([{
          customer_id: customerId,
          amount_paid: totalAmount,
          payment_id: payment.id,
          duration_minutes: 120,
          additional_customers: additionalCustomers.map(cust => ({
            name: cust.name,
            payment_plan_id: cust.paymentPlanId,
            amount: customerPayments.find(p => p.paymentPlanId === cust.paymentPlanId)?.amount || 0
          }))
        }])

      if (selectedItems.length > 0) {
        await supabase
          .from('skate_inventory')
          .update({ is_available: false })
          .in('id', selectedItems)
      }

      const primarySize = shoeSizes.find(size => size.id === primaryCustomer.shoeSize)?.size || ''
      const additionalSizes = additionalCustomers.map(cust => ({
        name: cust.name,
        size: shoeSizes.find(size => size.id === cust.shoeSize)?.size || 'N/A'
      }))

      setReceiptData({
        transactionId,
        customers: [
          {
            name: `${primaryCustomer.firstName} ${primaryCustomer.lastName}`,
            paymentPlanId: customerPayments[0]?.paymentPlanId,
            amount: customerPayments[0]?.amount || 0
          },
          ...additionalCustomers.map((cust, index) => ({
            name: cust.name,
            paymentPlanId: cust.paymentPlanId,
            amount: customerPayments[index + 1]?.amount || 0,
            shoeSize: shoeSizes.find(size => size.id === cust.shoeSize)?.size || 'N/A'
          }))
        ],
        items: availableItems.filter(item => selectedItems.includes(item.id)),
        primaryShoeSize: primarySize,
        totalAmount,
        date: new Date()
      })

      if (primaryCustomer.email) {
        await fetch('/api/send-walkin-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: `${primaryCustomer.firstName} ${primaryCustomer.lastName}`,
            email: primaryCustomer.email,
            transactionId,
            customers: [
              { name: `${primaryCustomer.firstName} ${primaryCustomer.lastName}`, amount: customerPayments[0]?.amount || 0 },
              ...additionalCustomers.map((cust, index) => ({
                name: cust.name,
                amount: customerPayments[index + 1]?.amount || 0,
                shoeSize: shoeSizes.find(size => size.id === cust.shoeSize)?.size || 'N/A'
              }))
            ],
            items: availableItems.filter(item => selectedItems.includes(item.id)),
            totalAmount,
            duration: 120,
            rate: (customerPayments[0]?.amount || 0) / 2,
            date: new Date()
          })
        })
      }

      toast.success("Session created successfully")
      loadData()
      setPrimaryCustomer({ 
        firstName: '', 
        lastName: '', 
        email: '', 
        phone: '', 
        phoneCountryCode: '+233',
        shoeSize: '' 
      })
      setAdditionalCustomers([])
      setCustomerPayments([])
      setSelectedItems([])
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
            <div className="space-y-4">
              <h3 className="font-medium">Primary Customer</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={primaryCustomer.firstName}
                    onChange={(e) => setPrimaryCustomer({...primaryCustomer, firstName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={primaryCustomer.lastName}
                    onChange={(e) => setPrimaryCustomer({...primaryCustomer, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={primaryCustomer.email}
                    onChange={handleEmailChange}
                  />
                  {emailError && <p className="text-sm text-red-500">{emailError}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <div className="flex gap-2">
                    <CountryCodeSelect
                      value={primaryCustomer.phoneCountryCode}
                      onChange={handleCountryCodeChange}
                      countryCodes={countryCodes}
                    />
                    <Input
                      id="phone"
                      type="tel"
                      value={primaryCustomer.phone}
                      onChange={handlePhoneChange}
                      placeholder="1234567890"
                    />
                  </div>
                  {phoneError && <p className="text-sm text-red-500">{phoneError}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shoeSize">Shoe Size</Label>
                  <Select
                    value={primaryCustomer.shoeSize}
                    onValueChange={(value) => setPrimaryCustomer({...primaryCustomer, shoeSize: value})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select shoe size" />
                    </SelectTrigger>
                    <SelectContent>
                      {shoeSizes
                        .sort((a, b) => {
                          const sizeA = parseFloat(String(a.size).split(' ')[0]);
                          const sizeB = parseFloat(String(b.size).split(' ')[0]);
                          return sizeA - sizeB;
                        })
                        .map((size) => (
                          <SelectItem key={size.id} value={size.id}>
                            {size.size} - {size.description}
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentPlan">Payment Plan</Label>
                  <Select
                    onValueChange={handlePrimaryPaymentChange}
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select payment plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - ₵{plan.amount}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                <h3 className="font-medium">Additional Customers</h3>
                <Button type="button" variant="outline" onClick={addAdditionalCustomer} className="w-full md:w-auto">
                  Add Customer
                </Button>
              </div>
              {additionalCustomers.map((cust, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 bg-gray-50 rounded-md">
                  <div className="md:col-span-3 space-y-2">
                    <Label htmlFor={`additionalName-${index}`}>Name</Label>
                    <Input
                      id={`additionalName-${index}`}
                      value={cust.name}
                      onChange={(e) => updateAdditionalCustomer(index, 'name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <Label htmlFor={`additionalShoeSize-${index}`}>Shoe Size</Label>
                    <Select
                      value={cust.shoeSize}
                      onValueChange={(value) => updateAdditionalCustomer(index, 'shoeSize', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {shoeSizes
                          .sort((a, b) => {
                            const sizeA = parseFloat(String(a.size).split(' ')[0]);
                            const sizeB = parseFloat(String(b.size).split(' ')[0]);
                            return sizeA - sizeB;
                          })
                          .map((size) => (
                            <SelectItem key={size.id} value={size.id}>
                              {size.size} - {size.description}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-4 space-y-2">
                    <Label htmlFor={`additionalPlan-${index}`}>Payment Plan</Label>
                    <Select
                      value={cust.paymentPlanId}
                      onValueChange={(value) => updateAdditionalCustomer(index, 'paymentPlanId', value)}
                      required
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select payment plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentPlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - ₵{plan.amount}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 flex items-end justify-end md:justify-start">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAdditionalCustomer(index)}
                      className="text-red-600"
                    >
                      <Trash2 size={20} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 mt-6">
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
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                          <span>{item.name} (Size: {item.size})</span>
                          <Badge variant="outline" className="sm:ml-2">
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

            <div className="pt-4">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>₵{customerPayments.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2)}</span>
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={
                  isLoading || 
                  !customerPayments[0]?.paymentPlanId || 
                  (primaryCustomer.email && emailError) ||
                  (primaryCustomer.phone && phoneError)
                } 
                className="w-full"
              >
                {isLoading ? 'Processing...' : 'Create Session & Process Payment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {receiptData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="p-4">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold">Skate City</h2>
                <p className="text-sm text-gray-500">Afrikiko Leisure Center</p>
                <p className="text-sm text-gray-500">Tel: (233) 553-103-992</p>
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
                <h3 className="font-medium mb-1">Customers:</h3>
                {receiptData.customers.map((cust, index) => (
                  <p key={index} className="text-sm">
                    {cust.name} - {paymentPlans.find(plan => plan.id === cust.paymentPlanId)?.name || 'Custom'} (₵{cust.amount.toFixed(2)})
                  </p>
                ))}
              </div>

              <div className="mb-4">
                {receiptData.primaryShoeSize && (
                  <>
                    <h3 className="font-medium mb-1">Shoe Size:</h3>
                    <p className="text-sm">
                      Primary Customer: {receiptData.primaryShoeSize}
                    </p>
                    <ul className="space-y-1">
                      {receiptData.customers
                        .filter((_, index) => index > 0)
                        .map((cust, index) => (
                          <li key={index} className="text-sm">
                            {cust.name}: {cust.shoeSize || 'Not specified'}
                          </li>
                        ))
                      }
                    </ul>
                  </>
                )}
                <h3 className="font-medium mb-1 mt-2">Duration:</h3>
                <p className="text-sm">2 hours</p>
              </div>

              {receiptData.items.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium mb-1">Equipment Rented:</h3>
                  <ul className="space-y-1">
                    {receiptData.items.map(item => (
                      <li key={item.id} className="flex justify-between text-sm">
                        <span>{item.name} (Size: {item.size})</span>
                        <span>₵0.00</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t pt-2">
                <div className="flex justify-between font-bold">
                  <span>TOTAL:</span>
                  <span>₵{receiptData.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center mt-6 text-xs text-gray-500">
                <p>Thank you for skating with us!</p>
                <p>Please come again</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setReceiptData(null)} className="w-full sm:w-auto">
                Close
              </Button>
              <Button onClick={handlePrintReceipt} className="w-full sm:w-auto">
                Print Receipt
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}