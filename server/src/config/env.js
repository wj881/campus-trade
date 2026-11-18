import dotenv from 'dotenv'

dotenv.config()

export const env = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'dev_only_secret_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h'
}
