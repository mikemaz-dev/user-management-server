import { SendSmtpEmail, TransactionalEmailsApi } from '@getbrevo/brevo'

export class EmailService {
	private api = new TransactionalEmailsApi()

	constructor() {
		if (!process.env.BREVO_API_KEY) {
			throw new Error('BREVO_API_KEY is not set')
		}

		;(this.api as any).authentications.apiKey.apiKey = process.env.BREVO_API_KEY
	}

	async sendVerificationEmail(to: string, token: string) {
		const verifyUrl = `${process.env.FRONTEND_URL}/verify/${token}`

		const email: SendSmtpEmail = {
			sender: {
				email: process.env.EMAIL_USER!,
				name: 'App',
			},
			to: [{ email: to }],
			subject: 'Verify email',
			textContent: `Verify your email:\n${verifyUrl}`,
		}

		await this.api.sendTransacEmail(email)
	}
}
