import crypto from 'crypto';

export const generateInviteCode = () =>
  crypto.randomBytes(4).toString('hex').toUpperCase();
