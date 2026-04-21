import bcrypt from 'bcryptjs';
import { config } from '../config';

export const hashPassword = (plain: string): Promise<string> =>
  bcrypt.hash(plain, config.bcrypt.rounds);

export const comparePassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);
