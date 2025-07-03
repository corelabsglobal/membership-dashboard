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

export async function GET() {
  try {
    // 1. Fetch email templates first
    const { data: templates, error: templateError } = await supabase
      .from('email_templates')
      .select('template_name, content')
      .in('template_name', ['session_reminder', 'membership_expiry'])

    if (templateError) throw templateError

    const templateMap = templates.reduce((acc, template) => {
      acc[template.template_name] = template.content
      return acc
    }, {})

    // 2. Send session reminders
    const { data: lowSessionSubscriptions, error: sessionError } = await supabase
      .from('subscriptions')
      .select(`
        member_id, 
        remaining_sessions, 
        members(first_name, last_name, email)
      `)
      .gt('remaining_sessions', 0)
      .lte('remaining_sessions', 3)
      .eq('is_active', true)

    if (sessionError) throw sessionError

    const sessionReminderResults = await Promise.all(
      lowSessionSubscriptions.map(async (sub) => {
        const member = sub.members
        const emailContent = templateMap.session_reminder
          .replace(/{{member_name}}/g, `${member.first_name} ${member.last_name}`)
          .replace(/{{remaining_sessions}}/g, sub.remaining_sessions)

        try {
          await transporter.sendMail({
            from: `"Skate City" <${process.env.EMAIL_USER}>`,
            to: member.email,
            subject: 'Your Session Reminder',
            html: generateReminderTemplate(
              emailContent, 
              'session_reminder', 
              `${member.first_name} ${member.last_name}`,
              'Your Session Reminder',
              sub.remaining_sessions
            )
          })
          return { member_id: sub.member_id, status: 'success' }
        } catch (error) {
          return { member_id: sub.member_id, status: 'failed', error: error.message }
        }
      })
    )

    // 3. Send membership expiry reminders
    const today = new Date()
    const nextWeek = new Date()
    nextWeek.setDate(today.getDate() + 7)
    
    const { data: expiringSubscriptions, error: expiryError } = await supabase
      .from('subscriptions')
      .select(`
        member_id, 
        end_date, 
        members(first_name, last_name, email)
      `)
      .gte('end_date', today.toISOString())
      .lte('end_date', nextWeek.toISOString())
      .eq('is_active', true)

    if (expiryError) throw expiryError

    const expiryReminderResults = await Promise.all(
      expiringSubscriptions.map(async (sub) => {
        const member = sub.members
        const expiryDate = new Date(sub.end_date).toLocaleDateString()
        const emailContent = templateMap.membership_expiry
          .replace(/{{member_name}}/g, `${member.first_name} ${member.last_name}`)
          .replace(/{{expiry_date}}/g, expiryDate)

        try {
          await transporter.sendMail({
            from: `"Skate City" <${process.env.EMAIL_USER}>`,
            to: member.email,
            subject: 'Your Membership Expiry Reminder',
            html: generateReminderTemplate(
              emailContent,
              'membership_expiry',
              `${member.first_name} ${member.last_name}`,
              'Your Membership Expiry Reminder',
              null,
              expiryDate
            )
          })
          return { member_id: sub.member_id, status: 'success' }
        } catch (error) {
          return { member_id: sub.member_id, status: 'failed', error: error.message }
        }
      })
    )

    return NextResponse.json({
      success: true,
      sessionReminders: {
        total: lowSessionSubscriptions.length,
        results: sessionReminderResults
      },
      expiryReminders: {
        total: expiringSubscriptions.length,
        results: expiryReminderResults
      }
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    )
  }
}

function generateReminderTemplate(content, templateType, memberName, subject, remainingSessions = null, expiryDate = null) {
  {/*const templateColors = {
    session_reminder: { primary: '#10B981', secondary: '#34D399' },
    membership_expiry: { primary: '#F59E0B', secondary: '#FBBF24' }
  }*/}
  const templateColors = {
    session_reminder: { primary: '#1a1a2e', secondary: '#1a1a2e' },
    membership_expiry: { primary: '#1a1a2e', secondary: '#1a1a2e' }
  }

  const colors = templateColors[templateType] || templateColors.session_reminder

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Skate City</title>
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
      .stats-container {
        display: flex;
        justify-content: space-around;
        margin: 25px 0;
      }
      .stat-box {
        text-align: center;
        padding: 15px;
        border-radius: 8px;
        background-color: ${colors.secondary}20;
        color: ${colors.primary};
      }
      .stat-value {
        font-size: 24px;
        font-weight: 600;
        margin: 5px 0;
      }
      .stat-label {
        font-size: 14px;
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
        .stats-container {
          flex-direction: column;
          gap: 10px;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-header">
        <h1>${subject}</h1>
      </div>
      
      <div class="email-body">
        <div class="greeting">Hello ${memberName},</div>
        
        <div class="content">
          ${content.replace(/\n/g, '</p><p>')}
        </div>
        
        ${templateType === 'session_reminder' ? `
        <div class="stats-container">
          <div class="stat-box">
            <div class="stat-value">${remainingSessions}</div>
            <div class="stat-label">Sessions Remaining</div>
          </div>
        </div>
        <div class="highlight-box">
          <strong>Don't forget:</strong> Your skating sessions are waiting! Book your next session now to keep improving your skills.
        </div>
        <a href="https://skatecityclub.com/book-session" class="button">
          Book Your Session Now
        </a>
        ` : ''}
        
        ${templateType === 'membership_expiry' ? `
        <div class="stats-container">
          <div class="stat-box">
            <div class="stat-value">${expiryDate}</div>
            <div class="stat-label">Expiry Date</div>
          </div>
        </div>
        <div class="highlight-box">
          <strong>Renew today:</strong> Continue enjoying all the benefits of Skate City without interruption.
        </div>
        <a href="https://skatecityclub.com/renew" class="button">
          Renew Your Membership
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
        <p>© ${new Date().getFullYear()} Skate City. All rights reserved.</p>
        <p>
          Skate City, Afrikiko Leisure Center<br>
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