import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request) {
  try {
    const { 
      customerName,
      email,
      transactionId,
      items,
      duration,
      rate,
      amount,
      date
    } = await request.json()

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })

    // Email template
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">Skate City</h1>
          <p style="color: #fff; margin: 5px 0 0;">123 Skate Avenue, Cityville, ST 12345</p>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #1a1a2e;">Thank you for skating with us, ${customerName}!</h2>
          <p>Here's your receipt for today's session:</p>
          
          <div style="background: white; border-radius: 8px; padding: 15px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-weight: bold;">Transaction ID:</span>
              <span>${transactionId}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-weight: bold;">Date:</span>
              <span>${new Date(date).toLocaleString()}</span>
            </div>
            
            ${items.length > 0 ? `
              <div style="margin: 15px 0;">
                <h3 style="border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px;">Equipment Rented</h3>
                ${items.map(item => `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>${item.name} (Size: ${item.size})</span>
                    <span>₵0.00</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            <div style="margin: 15px 0;">
              <h3 style="border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px;">Session Details</h3>
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>Duration:</span>
                <span>${duration} minutes</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>Hourly Rate:</span>
                <span>₵${rate}</span>
              </div>
            </div>
            
            <div style="border-top: 2px solid #1a1a2e; padding-top: 10px; margin-top: 15px;">
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1em;">
                <span>TOTAL:</span>
                <span>₵${amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <p style="margin-top: 20px;">We hope you enjoyed your time at Skate City!</p>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="https://skatecity.com" style="display: inline-block; padding: 12px 25px; background-color: #1a1a2e; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Book Your Next Session
            </a>
          </div>
          
          <p>If you have any questions about your visit, please reply to this email.</p>
          
          <p>Best regards,<br>The Skate City Team</p>
        </div>
        
        <div style="background-color: #1a1a2e; padding: 15px; text-align: center; color: #fff; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Skate City. All rights reserved.</p>
          <p>123 Skate Avenue, Cityville, ST 12345 | (123) 456-7890</p>
        </div>
      </div>
    `

    // Send mail
    await transporter.sendMail({
      from: `"Skate City" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your Skate City Receipt - ${transactionId}`,
      html: emailHtml,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending receipt email:', error)
    return NextResponse.json({ 
      error: 'Failed to send receipt email',
      details: error.message 
    }, { status: 500 })
  }
}