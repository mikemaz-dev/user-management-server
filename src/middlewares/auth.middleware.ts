import { UserService } from '@/services/user/user.service'
import { NextFunction, Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import { Role, User } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()

declare global {
	namespace Express {
		interface Request {
			user?: User
		}
	}
}

const userService = new UserService()

export const authenticate = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const token = req.headers.authorization?.split(' ')[1]
	if (!token) {
		return res.status(401).json({ message: 'Unauthorized' })
	}

	const secret = process.env.JWT_SECRET
	if (!secret)
		return res.status(500).json({ message: 'JWT_SECRET not defined' })

	try {
		const decoded = jwt.verify(token, secret) as { id: string }
		const user = await userService.getById(decoded.id)
		if (!user) {
			return res.status(401).json({ message: 'User not found' })
		}

		if (user.status === 'BLOCKED') {
			return res.status(403).json({
				message: 'User is blocked',
			})
		}

		req.user = user
		next()
	} catch (err) {
		return res.status(401).json({ message: 'Invalid token' })
	}
}

export const authorize = (allowedRoles: Role[] = []) => {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!req.user) {
			return res.status(401).json({ message: 'Unauthorized' })
		}

		if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
			return res.status(403).json({ message: 'Forbidden' })
		}

		next()
	}
}
