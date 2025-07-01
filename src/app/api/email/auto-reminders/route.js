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
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                ${emailContent.replace(/\n/g, '<br>')}
                <br><br>
                <p style="font-size: 12px; color: #666;">
                  If you have any questions, please reply to this email.
                </p>
              </div>
            `
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
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                ${emailContent.replace(/\n/g, '<br>')}
                <br><br>
                <p style="font-size: 12px; color: #666;">
                  If you have any questions, please reply to this email.
                </p>
              </div>
            `
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