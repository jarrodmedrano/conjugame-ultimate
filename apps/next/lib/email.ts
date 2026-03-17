import { Resend } from 'resend'

export async function sendVerificationEmail(to: string, url: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL
  if (!fromEmail) {
    throw new Error('RESEND_FROM_EMAIL environment variable is not set')
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const { error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject: 'Verify your Story Bible account',
    text: `Click the link below to verify your email address:\n\n${url}\n\nThis link expires in 1 hour.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Verify your email address</h2>
        <p>Thanks for signing up for Story Bible. Click the button below to verify your email address.</p>
        <a
          href="${url}"
          style="display: inline-block; padding: 12px 24px; background-color: #111827; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;"
        >
          Verify email
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          This link expires in 1 hour. If you did not create an account, you can safely ignore this email.
        </p>
        <p style="color: #6b7280; font-size: 12px;">
          Or copy this URL into your browser: ${url}
        </p>
      </div>
    `,
  })

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`)
  }
}
