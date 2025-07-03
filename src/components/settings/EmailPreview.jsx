'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function EmailPreview({ templateType, content, subject, memberName = "John Doe", remainingSessions = 2, expiryDate = "2023-12-31" }) {
  const [open, setOpen] = useState(false)

  const generatePreviewHtml = () => {
    {/*const templateColors = {
      welcome: { primary: '#4F46E5', secondary: '#6366F1' },
      session_reminder: { primary: '#10B981', secondary: '#34D399' },
      membership_expiry: { primary: '#F59E0B', secondary: '#FBBF24' },
      promo: { primary: '#EC4899', secondary: '#F472B6' }
    }*/}
    const templateColors = {
      welcome: { primary: '#1a1a2e', secondary: '#1a1a2e' },
      session_reminder: { primary: '#1a1a2e', secondary: '#1a1a2e' },
      membership_expiry: { primary: '#1a1a2e', secondary: '#1a1a2e' },
      promo: { primary: '#1a1a2e', secondary: '#1a1a2e' }
    }
    

    const colors = templateColors[templateType] || templateColors.welcome
    const processedContent = content
      .replace(/{{member_name}}/g, memberName)
      .replace(/{{remaining_sessions}}/g, remainingSessions)
      .replace(/{{expiry_date}}/g, expiryDate)

    return `
    <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
      <div style="background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary}); padding: 30px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 600;">${subject}</h1>
      </div>
      
      <div style="padding: 30px;">
        <div style="font-size: 18px; margin-bottom: 20px; color: #111827;">Hello ${memberName},</div>
        
        <div style="line-height: 1.6; margin-bottom: 25px;">
          ${processedContent.replace(/\n/g, '</p><p>')}
        </div>
        
        ${templateType === 'session_reminder' ? `
        <div style="display: flex; justify-content: space-around; margin: 25px 0;">
          <div style="text-align: center; padding: 15px; border-radius: 8px; background-color: ${colors.secondary}20; color: ${colors.primary};">
            <div style="font-size: 24px; font-weight: 600; margin: 5px 0;">${remainingSessions}</div>
            <div style="font-size: 14px;">Sessions Remaining</div>
          </div>
        </div>
        <div style="background-color: #f3f4f6; border-left: 4px solid ${colors.primary}; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <strong>Don't forget:</strong> Your skating sessions are waiting! Book your next session now to keep improving your skills.
        </div>
        <a href="https://skatecityclub.com/book-session" style="display: inline-block; padding: 12px 24px; background-color: ${colors.primary}; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 500; margin: 15px 0; text-align: center;">
          Book Your Session Now
        </a>
        ` : ''}
        
        ${templateType === 'membership_expiry' ? `
        <div style="display: flex; justify-content: space-around; margin: 25px 0;">
          <div style="text-align: center; padding: 15px; border-radius: 8px; background-color: ${colors.secondary}20; color: ${colors.primary};">
            <div style="font-size: 24px; font-weight: 600; margin: 5px 0;">${expiryDate}</div>
            <div style="font-size: 14px;">Expiry Date</div>
          </div>
        </div>
        <div style="background-color: #f3f4f6; border-left: 4px solid ${colors.primary}; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <strong>Renew today:</strong> Continue enjoying all the benefits of Skate City Club without interruption.
        </div>
        <a href="https://skatecityclub.com/renew" style="display: inline-block; padding: 12px 24px; background-color: ${colors.primary}; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 500; margin: 15px 0; text-align: center;">
          Renew Your Membership
        </a>
        ` : ''}
        
        <svg width="80" style="opacity: 0.8; margin: 20px auto; display: block;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${colors.primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 18V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v4"></path>
          <circle cx="4" cy="18" r="2"></circle>
          <path d="M10 18H4"></path>
          <circle cx="12" cy="18" r="2"></circle>
          <path d="M10 18h2"></path>
        </svg>
      </div>
    </div>
    `
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Preview Email
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Email Preview</DialogTitle>
        </DialogHeader>
        <div dangerouslySetInnerHTML={{ __html: generatePreviewHtml() }} />
      </DialogContent>
    </Dialog>
  )
}