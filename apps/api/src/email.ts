import nodemailer from 'nodemailer'
import { config } from './config'
import { passwordResetEmail } from './emails/password-reset'

const transport = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false,
})

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string,
): Promise<void> {
  const resetLink = `${config.idpUrl}/reset-password?token=${token}`
  const { subject, html } = passwordResetEmail(name, resetLink)
  await transport.sendMail({ from: config.smtp.from, to, subject, html })
}
