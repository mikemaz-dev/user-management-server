import { AuthDto } from '@/dto/auth.dto'
import { PrismaClient, Role, Status, User } from '@prisma/client'
import { hash } from 'argon2'
import { v4 as uuidv4 } from 'uuid'
import { EmailService } from '../email/email.service'

export class UserService {
	private prisma = new PrismaClient()
	private emailService = new EmailService()

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

		try {
			await this.emailService.sendVerificationEmail(
				user.email,
				verificationToken,
			)
		} catch (e) {
			console.error('EMAIL_SEND_FAILED', e)
		}

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

	async verifyUser(userId: string) {
		return this.prisma.user.update({
			where: { id: userId },
			data: {
				status: 'ACTIVE',
				verifiedAt: new Date(),
			},
		})
	}

	async updateLastSeen(userId: string) {
		return this.prisma.user.update({
			where: { id: userId },
			data: { lastSeen: new Date() },
		})
	}
}
