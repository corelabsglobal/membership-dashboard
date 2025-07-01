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