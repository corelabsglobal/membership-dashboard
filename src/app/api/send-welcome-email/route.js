import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request) {
  try {
    const { memberName, email, planName, startDate, endDate } = await request.json()

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">Skate City</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #1a1a2e;">Welcome to Skate City, ${memberName}!</h2>
          
          <p>We're excited to have you as a new member of our skating community!</p>
          
          ${planName ? `
            <p>Your membership details:</p>
            <ul>
              <li><strong>Plan:</strong> ${planName}</li>
              <li><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</li>
              <li><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString()}</li>
            </ul>
          ` : `
            <p>You're registered as a member without a specific plan. Feel free to purchase a plan anytime to enjoy our facilities!</p>
          `}
          
          <p>If you have any questions about your membership, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>The Skate City Team</p>
        </div>
        
        <div style="background-color: #1a1a2e; padding: 15px; text-align: center; color: #fff; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Skate City. All rights reserved.</p>
          <p>Skate City, Afrikiko Leisure Centre, 055 310 3992</p>
        </div>
      </div>
    `

    await transporter.sendMail({
      from: `"Skate City" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: planName ? `Welcome to Skate City - Your ${planName} Membership` : `Welcome to Skate City`,
      html: emailHtml,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return NextResponse.json({ error: 'Failed to send welcome email' }, { status: 500 })
  }
}