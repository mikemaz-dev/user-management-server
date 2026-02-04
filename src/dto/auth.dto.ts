export class AuthDto {
	email: string
	password: string
	name?: string
	status?: 'UN_VERIFIED' | 'ACTIVE' | 'BLOCKED' = 'UN_VERIFIED'
}