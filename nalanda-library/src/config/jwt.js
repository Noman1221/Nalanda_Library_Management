export const jwtConfig = {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRE || '7d',
    encryptionKey: process.env.JWT_ENCRYPTION_KEY
};