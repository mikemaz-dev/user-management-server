import { PrismaClient } from '@prisma/client'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import * as dotenv from 'dotenv'
import express, { Request, Response } from 'express'
import cors from 'cors'
import { userRouter } from './controllers/user.controller'
import { authRouter } from './controllers/auth.controller'

dotenv.config()

export const prisma = new PrismaClient()
const app = express()

async function main() {
	app.use(bodyParser.json())
	app.use(cookieParser())

	app.use(
		'/api',
		cors({
			origin: 'https://user-management-client-sage.vercel.app',
			credentials: true,
			exposedHeaders: 'set-cookie',
			methods: ['GET','POST','PUT','DELETE','OPTIONS'],
   		allowedHeaders: ['Content-Type', 'Authorization'],
		}),
	)

	app.options('*', cors({
		origin: 'https://user-management-client-sage.vercel.app',
		credentials: true,
		methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
		allowedHeaders: 'Content-Type, Authorization',
	}))
	
	app.use('/api', authRouter),
	app.use('/api/users', userRouter),

	app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` })
  })

	const PORT = process.env.PORT || 4200
	app.listen(PORT, () => {
		console.log(`Server is running on port ${PORT}`)
	})
}

main()
	.then(async () => {
		await prisma.$connect()
	})
	.catch(async e => {
		console.log(e)
		await prisma.$disconnect()
		process.exit(1)
	})
