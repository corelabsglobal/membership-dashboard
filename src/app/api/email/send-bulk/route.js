import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

export async function POST(req) {
  try {
    const { templateType, memberIds, subject, content } = await req.json()

    // Fetch member details
    const { data: members, error } = await supabase
      .from('members')
      .select('id, first_name, last_name, email')
      .in('id', memberIds)

    if (error) throw error

    // For session reminders and expiry, fetch additional data
    let memberDetails = []
    if (templateType === 'session_reminder') {
      const { data: subscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select('member_id, remaining_sessions')
        .in('member_id', memberIds)
        .eq('is_active', true)

      if (subError) throw subError

      memberDetails = members.map(member => {
        const subscription = subscriptions.find(sub => sub.member_id === member.id)
        return {
          ...member,
          remaining_sessions: subscription?.remaining_sessions || 0
        }
      })
    } 
    else if (templateType === 'membership_expiry') {
      const { data: subscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select('member_id, end_date')
        .in('member_id', memberIds)
        .eq('is_active', true)

      if (subError) throw subError

      memberDetails = members.map(member => {
        const subscription = subscriptions.find(sub => sub.member_id === member.id)
        return {
          ...member,
          expiry_date: subscription?.end_date ? new Date(subscription.end_date).toLocaleDateString() : 'N/A'
        }
      })
    } else {
      memberDetails = members
    }

    // Send emails
    const sendEmailPromises = memberDetails.map(member => {
      let emailContent = content
        .replace(/{{member_name}}/g, `${member.first_name} ${member.last_name}`)
        .replace(/{{remaining_sessions}}/g, member.remaining_sessions || '')
        .replace(/{{expiry_date}}/g, member.expiry_date || '')

      return transporter.sendMail({
        from: `"Skate City" <${process.env.EMAIL_USER}>`,
        to: member.email,
        subject: subject,
        html: generateEmailTemplate(emailContent, templateType, `${member.first_name} ${member.last_name}`, subject)
      })
    })

    await Promise.all(sendEmailPromises)

    return NextResponse.json({ success: true, message: 'Emails sent successfully' })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    )
  }
}

function generateEmailTemplate(content, templateType, memberName, subject) {
  const templateColors = {
    welcome: { primary: '#4F46E5', secondary: '#6366F1' },
    session_reminder: { primary: '#10B981', secondary: '#34D399' },
    membership_expiry: { primary: '#F59E0B', secondary: '#FBBF24' },
    promo: { primary: '#EC4899', secondary: '#F472B6' }
  }

  const colors = templateColors[templateType] || templateColors.welcome

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Skate City Club</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
      
      body {
        font-family: 'Poppins', Arial, sans-serif;
        background-color: #f9fafb;
        margin: 0;
        padding: 0;
        color: #374151;
      }
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      }
      .email-header {
        background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
        padding: 30px 20px;
        text-align: center;
        color: white;
      }
      .email-header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
      }
      .email-logo {
        height: 50px;
        margin-bottom: 15px;
      }
      .email-body {
        padding: 30px;
      }
      .greeting {
        font-size: 18px;
        margin-bottom: 20px;
        color: #111827;
      }
      .content {
        line-height: 1.6;
        margin-bottom: 25px;
      }
      .content p {
        margin-bottom: 15px;
      }
      .highlight-box {
        background-color: #f3f4f6;
        border-left: 4px solid ${colors.primary};
        padding: 15px;
        margin: 20px 0;
        border-radius: 0 8px 8px 0;
      }
      .button {
        display: inline-block;
        padding: 12px 24px;
        background-color: ${colors.primary};
        color: white !important;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 500;
        margin: 15px 0;
        text-align: center;
      }
      .footer {
        padding: 20px;
        text-align: center;
        font-size: 12px;
        color: #6b7280;
        border-top: 1px solid #e5e7eb;
      }
      .social-icons {
        margin: 15px 0;
      }
      .social-icon {
        display: inline-block;
        margin: 0 10px;
      }
      .skate-icon {
        width: 80px;
        opacity: 0.8;
        margin: 20px auto;
        display: block;
      }
      @media only screen and (max-width: 600px) {
        .email-body {
          padding: 20px;
        }
        .email-header h1 {
          font-size: 20px;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-header">
        <!-- Replace with your actual logo URL -->
        <img src="https://example.com/logo.png" alt="Skate City Club" class="email-logo">
        <h1>${subject}</h1>
      </div>
      
      <div class="email-body">
        <div class="greeting">Hello ${memberName},</div>
        
        <div class="content">
          ${content.replace(/\n/g, '</p><p>')}
        </div>
        
        ${templateType === 'session_reminder' ? `
        <div class="highlight-box">
          <strong>Don't forget:</strong> Your skating sessions are waiting! Book your next session now to keep improving your skills.
        </div>
        ` : ''}
        
        ${templateType === 'membership_expiry' ? `
        <div class="highlight-box">
          <strong>Renew today:</strong> Continue enjoying all the benefits of Skate City Club without interruption.
        </div>
        ` : ''}
        
        ${templateType === 'promo' ? `
        <a href="https://skatecityclub.com/special-offer" class="button">
          Claim Your Special Offer
        </a>
        ` : ''}
        
        <svg class="skate-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${colors.primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 18V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v4"></path>
          <circle cx="4" cy="18" r="2"></circle>
          <path d="M10 18H4"></path>
          <circle cx="12" cy="18" r="2"></circle>
          <path d="M10 18h2"></path>
        </svg>
      </div>
      
      <div class="footer">
        <div class="social-icons">
          <a href="https://facebook.com/skatecityclub" class="social-icon">
            <img src="https://cdn-icons-png.flaticon.com/512/124/124010.png" width="24" alt="Facebook">
          </a>
          <a href="https://instagram.com/skatecityclub" class="social-icon">
            <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" width="24" alt="Instagram">
          </a>
          <a href="https://twitter.com/skatecityclub" class="social-icon">
            <img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" width="24" alt="Twitter">
          </a>
        </div>
        <p>© ${new Date().getFullYear()} Skate City Club. All rights reserved.</p>
        <p>
          123 Skate Avenue, Cityville<br>
          <a href="mailto:info@skatecityclub.com" style="color: ${colors.primary};">info@skatecityclub.com</a> | 
          <a href="https://skatecityclub.com" style="color: ${colors.primary};">www.skatecityclub.com</a>
        </p>
        <p style="font-size: 11px; color: #9ca3af;">
          If you no longer wish to receive these emails, you can 
          <a href="https://skatecityclub.com/unsubscribe" style="color: #9ca3af;">unsubscribe</a>.
        </p>
      </div>
    </div>
  </body>
  </html>
  `
}