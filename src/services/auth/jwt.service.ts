import { getEnvVar } from '@/config/env'
import * as jwt from 'jsonwebtoken'

const JWT_SECRET = getEnvVar('JWT_SECRET')

export class JwtService {
	private readonly TOKEN_EXPIRATION_ACCESS = '1h'
	private readonly TOKEN_EXPIRATION_REFRESH = '7d'

	sign(payload: object, options: jwt.SignOptions) {
		if (!JWT_SECRET) {
			throw new Error('JWT_SECRET is not defined in environment variables')
		}
		return jwt.sign(payload, JWT_SECRET, options)
	}

	verify(token: string, options?: jwt.VerifyOptions) {
		try {
			if (!JWT_SECRET) {
				throw new Error('JWT_SECRET is not defined in environment variables')
			}
			return jwt.verify(token, JWT_SECRET, options)
		} catch (error) {
			return null
		}
	}

	signAccessToken(payload: object) {
		return this.sign(payload, { expiresIn: this.TOKEN_EXPIRATION_ACCESS })
	}
	signRefreshToken(payload: object) {
		return this.sign(payload, { expiresIn: this.TOKEN_EXPIRATION_REFRESH })
	}
}
