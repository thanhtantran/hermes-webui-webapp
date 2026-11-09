import { randomBytes } from 'node:crypto';

const key = randomBytes(32).toString('base64');

console.log('# Copy this line into your .env file:');
console.log(`PASSWORD_ENC_KEY=${key}`);
