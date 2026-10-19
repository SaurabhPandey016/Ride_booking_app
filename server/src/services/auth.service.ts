import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { AppError } from '../utils/AppError.js';
import { findUserByEmail, insertUser, users, type UserRecord } from '../models/user.model.js';
import { env } from '../config/env.js';

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};

const createToken = (user: Pick<UserRecord, 'id' | 'email'>) =>
  jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: '7d' });

export const registerUser = async (name: string, email: string, password: string) => {
  const existingUser = findUserByEmail(email);
  if (existingUser) {
    throw new AppError(409, 'User already exists');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user: UserRecord = {
    id: randomUUID(),
    name,
    email: email.trim(),
    passwordHash,
    createdAt: new Date(),
  };

  insertUser(user);

  const { passwordHash: _passwordHash, ...publicUser } = user;
  return {
    user: publicUser,
    token: createToken({ id: user.id, email: user.email }),
  };
};

export const loginUser = async (email: string, password: string) => {
  const user = findUserByEmail(email);
  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new AppError(401, 'Invalid email or password');
  }

  const { passwordHash: _passwordHash, ...publicUser } = user;
  return {
    user: publicUser,
    token: createToken({ id: user.id, email: user.email }),
  };
};

export const getUsers = (): PublicUser[] =>
  users.map(({ id, name, email, createdAt }) => ({ id, name, email, createdAt }));
