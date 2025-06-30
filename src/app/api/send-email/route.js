import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request) {
  try {
    const { memberName, email, planName, remainingSessions, isUnlimited } = await request.json()

    // Create reusable transporter object
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })

    // Determine the appropriate message based on session count
    let sessionMessage = ''
    if (isUnlimited) {
      sessionMessage = `
        <p>You have an <strong>unlimited ${planName}</strong> membership.</p>
        <p>Enjoy unlimited access to our facilities!</p>
      `
    } else if (remainingSessions > 0) {
      sessionMessage = `
        <p>Your <strong>${planName}</strong> membership has <strong>${remainingSessions} session(s)</strong> remaining.</p>
        <p>Make the most of your remaining sessions!</p>
      `
    } else {
      sessionMessage = `
        <p>Your <strong>${planName}</strong> membership currently has <strong>0 sessions</strong> remaining.</p>
        <p>To continue enjoying our facilities, please renew your membership or contact Skate City to discuss your options.</p>
        <p style="text-align: center; margin-top: 20px;">
          <a href="https://skatecity.com/renew" style="background-color: #1a1a2e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Renew Your Membership
          </a>
        </p>
      `
    }

    // Email template
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">Skate City</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #1a1a2e;">Hello ${memberName},</h2>
          
          <p>Thank you for checking in at Skate City!</p>
          
          ${sessionMessage}
          
          <p>If you have any questions about your membership, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>The Skate City Team</p>
        </div>
        
        <div style="background-color: #1a1a2e; padding: 15px; text-align: center; color: #fff; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Skate City. All rights reserved.</p>
          <p>123 Skate City, Afrikiko Leisure Centre, 055 310 3992</p>
        </div>
      </div>
    `

    // Send mail
    await transporter.sendMail({
      from: `"Skate City" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: remainingSessions === 0 && !isUnlimited 
        ? `Important: Your Skate City Membership Needs Renewal` 
        : `Your Skate City Check-In Confirmation`,
      html: emailHtml,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}