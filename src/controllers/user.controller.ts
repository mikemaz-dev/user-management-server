import { AuthDto } from '@/dto/auth.dto'
import { authenticate, authorize } from '@/middlewares/auth.middleware'
import { UserService } from '@/services/user/user.service'
import { Role } from '@prisma/client'
import { Router } from 'express'

const router = Router()
const userService = new UserService()

router.post('/register', async (req, res) => {
	const dto: AuthDto = req.body
	try {
		const user = await userService.create(dto)
		res.json({
			message: 'User created. Please verify your email.',
			userId: user.id,
		})
	} catch (err) {
		res.status(400).json({ message: 'Failed to register user', error: err })
	}
})

router.get('/verify/:token', async (req, res) => {
	const { token } = req.params
	const user = await userService.verifyUser(token)
	if (!user) return res.status(400).json({ message: 'Invalid token' })
	res.json({ message: 'Email verified successfully', status: user.status })
})

router.get('/', authenticate, async (req, res) => {
	const filter: any = {}
	if (req.query.status) filter.status = req.query.status
	if (req.query.role) filter.role = req.query.role
	const users = await userService.getUsers(filter)
	res.json(users)
})

router.patch('/:id/status', authenticate, async (req, res) => {
	const { id } = req.params
	const { status } = req.body
	const updated = await userService.updateStatus(id as string, status)
	res.json(updated)
})

router.delete(
	'/:id',
	authenticate,
	authorize([Role.ADMIN]),
	async (req, res) => {
		const { id } = req.params
		try {
			await userService.deleteUser(id as string)
			res.json({ message: 'User deleted' })
		} catch (err: any) {
			res.status(400).json({ message: err.message || 'Failed to delete user' })
		}
	},
)

router.delete(
	'/unverified/all',
	authenticate,
	authorize([Role.ADMIN]),
	async (_, res) => {
		try {
			await userService.deleteUnverifiedUsers()
			res.json({ message: 'All unverified users deleted' })
		} catch (err: any) {
			res
				.status(400)
				.json({ message: err.message || 'Failed to delete unverified users' })
		}
	},
)
router.post('/last-seen', authenticate, async (req, res) => {
	await userService.updateLastSeen(req.user.id)
	res.json({ message: 'ok' })
})

export { router as userRouter }
