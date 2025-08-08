"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'
import { Textarea } from '@/components/ui/textarea'

export function EditSessionDialog({ open, onOpenChange, session, onSuccess }) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [reason, setReason] = useState('')
  const [amount, setAmount] = useState(session.payments?.modified_amount || session.amount_paid)
  const [duration, setDuration] = useState(session.duration_minutes)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Start a transaction
      const { data: paymentUpdate, error: paymentError } = await supabase
        .from('payments')
        .update({
          modified_amount: amount,
          modified_at: new Date().toISOString()
        })
        .eq('id', session.payment_id)
        .select()
        .single()

      if (paymentError) throw paymentError

      // Record the edit in session_edits table
      const changes = {
        amount_paid: { from: session.amount_paid, to: amount },
        duration_minutes: { from: session.duration_minutes, to: duration }
      }

      const { error: editError } = await supabase
        .from('session_edits')
        .insert({
          session_id: session.id,
          editor_id: (await supabase.auth.getUser()).data.user.id,
          edited_at: new Date().toISOString(),
          changes,
          reason
        })

      if (editError) throw editError

      // Update the session if duration changed
      if (duration !== session.duration_minutes) {
        const { error: sessionError } = await supabase
          .from('pos_sessions')
          .update({ duration_minutes: duration })
          .eq('id', session.id)

        if (sessionError) throw sessionError
      }

      toast({
        title: "Session updated successfully",
        description: "The changes have been recorded",
        variant: "default"
      })

      // Return the updated session data
      onSuccess({
        ...session,
        amount_paid: amount,
        duration_minutes: duration,
        payments: paymentUpdate,
        session_edits: [{ 
          editor_id: (await supabase.auth.getUser()).data.user.id,
          edited_at: new Date().toISOString(),
          changes
        }]
      })
    } catch (error) {
      toast({
        title: "Error updating session",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Original Amount</Label>
            <Input 
              value={session.amount_paid.toFixed(2)} 
              disabled 
              prefix="₵"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">New Amount (₵)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Change</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this change is needed..."
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || 
                (amount === (session.payments?.modified_amount || session.amount_paid) && 
                 duration === session.duration_minutes)
              }
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}