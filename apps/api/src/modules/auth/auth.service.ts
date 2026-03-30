import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Prisma, Role } from "@prisma/client";
import { hash, compare } from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException("Ya existe un usuario con ese email");
    }

    const passwordHash = await hash(dto.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: dto.organizationName,
          profile: {
            create: {
              currency: dto.currency ?? "EUR",
              country: dto.country ?? "ES",
              sector: dto.sector ?? "General",
              fiscalCalendarType: "STANDARD",
            },
          },
          settings: {
            create: {
              tensionThresholdAmount: new Prisma.Decimal(5000),
              tensionThresholdDays: 14,
              monteCarloRuns: 1000,
              defaultCurrency: dto.currency ?? "EUR",
            },
          },
        },
      });

      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          fullName: dto.fullName,
          passwordHash,
        },
      });

      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: Role.ADMIN,
        },
      });

      return { user, organization, membership };
    });

    return this.issueToken({
      userId: result.user.id,
      organizationId: result.organization.id,
      role: result.membership.role,
      email: result.user.email,
      fullName: result.user.fullName,
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { memberships: true },
    });

    if (!user) {
      throw new UnauthorizedException("Credenciales inválidas");
    }

    const validPassword = await compare(dto.password, user.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedException("Credenciales inválidas");
    }

    const membership = user.memberships[0];
    if (!membership) {
      throw new UnauthorizedException("El usuario no pertenece a ninguna organización");
    }

    return this.issueToken({
      userId: user.id,
      organizationId: membership.organizationId,
      role: membership.role,
      email: user.email,
      fullName: user.fullName,
    });
  }

  private issueToken(input: {
    userId: string;
    organizationId: string;
    role: Role;
    email: string;
    fullName: string;
  }) {
    const accessToken = this.jwtService.sign({
      sub: input.userId,
      organizationId: input.organizationId,
      role: input.role,
      email: input.email,
    });

    return {
      accessToken,
      user: {
        id: input.userId,
        email: input.email,
        fullName: input.fullName,
        organizationId: input.organizationId,
        role: input.role,
      },
    };
  }
}
