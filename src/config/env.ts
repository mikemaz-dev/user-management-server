export function getEnvVar(name: string): string {
	const value = process.env[name]
	if (value === undefined || value === '') {
		throw new Error(`Environment variable "${name}" is required but not set.`)
	}
	return value
}
