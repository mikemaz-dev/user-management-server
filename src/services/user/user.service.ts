import { AuthDto } from '@/dto/auth.dto'
import { PrismaClient, Role, Status, User } from '@prisma/client'
import { hash } from 'argon2'
import { v4 as uuidv4 } from 'uuid'
import nodemailer from 'nodemailer'

export class UserService {
	private prisma = new PrismaClient()

	private transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS,
		},
	})

	async getUsers(filter?: Partial<{ status: Status; role: Role }>) {
		return this.prisma.user.findMany({
			where: filter,
			select: {
				id: true,
				name: true,
				email: true,
				status: true,
				lastSeen: true,
			},
			orderBy: {
				lastSeen: 'desc',
			},
		})
	}

	async getById(id: string) {
		return this.prisma.user.findUnique({
			where: {
				id,
			},
		})
	}

	async getByEmail(email: string) {
		return this.prisma.user.findUnique({
			where: {
				email,
			},
		})
	}

	async create(dto: AuthDto) {
		const hashedPassword = await hash(dto.password)
		const verificationToken = uuidv4()

		const user = await this.prisma.user.create({
			data: {
				...dto,
				password: hashedPassword,
				status: 'UN_VERIFIED',
				verificationToken,
				lastSeen: new Date(),
			},
		})

		await this.sendVerificationEmail(user)

		return user
	}

	async updateStatus(userId: string, status: Status) {
		if (!['ACTIVE', 'BLOCKED'].includes(status)) {
			throw new Error('Invalid status')
		}
		return this.prisma.user.update({
			where: { id: userId },
			data: { status },
		})
	}

	async update(id: string, data: Partial<User>) {
		return this.prisma.user.update({
			where: {
				id,
			},
			data,
		})
	}

	async deleteUser(userId: string) {
		return this.prisma.user.delete({ where: { id: userId } })
	}

	async deleteUnverifiedUsers() {
		return this.prisma.user.deleteMany({
			where: { status: Status.UN_VERIFIED },
		})
	}

	async verifyUser(token: string) {
		const user = await this.prisma.user.findUnique({
			where: { verificationToken: token },
		})

		if (!user) return null

		await this.prisma.user.update({
			where: { id: user.id },
			data: {
				status: 'ACTIVE',
				verificationToken: null,
			},
		})

		return user
	}

	async updateLastSeen(userId: string) {
		return this.prisma.user.update({
			where: { id: userId },
			data: { lastSeen: new Date() },
		})
	}

	private async sendVerificationEmail(user: User) {
		if (!user.verificationToken) return

		const verificationUrl = `${process.env.FRONTEND_URL}/verify/${user.verificationToken}`

		await this.transporter.sendMail({
			from: `"The App" <${process.env.EMAIL_USER}>`,
			to: user.email,
			subject: 'Verify your email',
			html: `
        <p>Hi ${user.name || 'user'},</p>
        <p>Please verify your account by clicking the link below:</p>
        <a href="${verificationUrl}">Verify Email</a>
      `,
		})
	}
}
