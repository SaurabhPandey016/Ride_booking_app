export type UserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

export const users: UserRecord[] = [];

export const findUserByEmail = (email: string) =>
  users.find((user) => user.email.toLowerCase() === email.trim().toLowerCase());

export const insertUser = (user: UserRecord) => {
  users.push(user);
  return user;
};
