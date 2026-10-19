import { Prisma, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import type { LoginInput, RegisterInput, UpdateProfileInput } from "../validators/auth.validator.js";
import { AppError } from "../utils/AppError.js";
import { signToken } from "../utils/jwt.js";

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
  driverProfile: {
    select: {
      vehicleType: true,
      vehicleModel: true,
      vehicleNumber: true,
      isOnline: true,
      currentLat: true,
      currentLng: true,
      ratingAvg: true,
      ratingCount: true,
    },
  },
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

export const register = async (input: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  try {
    const user = await prisma.$transaction(async (transaction) => {
      const createdUser = await transaction.user.create({
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          passwordHash,
          role: input.role,
          ...(input.role === Role.DRIVER
            ? {
                driverProfile: {
                  create: {
                    vehicleType: input.vehicleType,
                    vehicleModel: input.vehicleModel,
                    vehicleNumber: input.vehicleNumber,
                  },
                },
              }
            : {}),
        },
        select: publicUserSelect,
      });

      return createdUser;
    });

    return {
      user,
      token: signToken({ id: user.id, email: user.email, role: user.role }),
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(409, "An account with this email already exists");
    }

    throw error;
  }
};

export const login = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      ...publicUserSelect,
      passwordHash: true,
    },
  });

  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new AppError(401, "Invalid email or password");
  }

  const { passwordHash: _passwordHash, ...publicUser } = user;

  return {
    user: publicUser,
    token: signToken({ id: user.id, email: user.email, role: user.role }),
  };
};

export const getMe = async (userId: string): Promise<PublicUser> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user;
};

export const updateProfile = async (userId: string, input: UpdateProfileInput): Promise<PublicUser> => {
  const hasVehicleChanges =
    input.vehicleType !== undefined ||
    input.vehicleModel !== undefined ||
    input.vehicleNumber !== undefined;

  return prisma.$transaction(async (transaction) => {
    const currentUser = await transaction.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        driverProfile: { select: { id: true } },
      },
    });

    if (!currentUser) {
      throw new AppError(404, "User not found");
    }

    if (hasVehicleChanges && currentUser.role !== Role.DRIVER) {
      throw new AppError(400, "Only drivers can update vehicle details");
    }

    if (hasVehicleChanges && !currentUser.driverProfile) {
      throw new AppError(409, "Driver profile is not available");
    }

    const { vehicleType, vehicleModel, vehicleNumber, ...userFields } = input;

    const user =
      Object.keys(userFields).length > 0
        ? await transaction.user.update({
            where: { id: userId },
            data: userFields,
            select: publicUserSelect,
          })
        : await transaction.user.findUniqueOrThrow({
            where: { id: userId },
            select: publicUserSelect,
          });

    if (hasVehicleChanges && currentUser.driverProfile) {
      await transaction.driverProfile.update({
        where: { userId },
        data: {
          ...(vehicleType !== undefined ? { vehicleType } : {}),
          ...(vehicleModel !== undefined ? { vehicleModel } : {}),
          ...(vehicleNumber !== undefined ? { vehicleNumber } : {}),
        },
      });

      return transaction.user.findUniqueOrThrow({
        where: { id: userId },
        select: publicUserSelect,
      });
    }

    return user;
  });
};
