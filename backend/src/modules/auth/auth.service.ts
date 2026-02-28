import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: loginDto.email, deletedAt: null },
      include: { organization: { select: { id: true, name: true, slug: true } } },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.organizationId);

    // Store refresh token hash
    const refreshHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshHash, lastLoginAt: new Date() },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        organization: user.organization,
        avatarUrl: user.avatarUrl,
      },
      ...tokens,
    };
  }

  async register(registerDto: RegisterDto) {
    const organization = await this.prisma.organization.findFirst({
      where: { slug: registerDto.organizationSlug, isActive: true },
    });
    if (!organization) throw new NotFoundException('Organization not found');

    const existingUser = await this.prisma.user.findFirst({
      where: { email: registerDto.email, organizationId: organization.id },
    });
    if (existingUser) throw new ConflictException('User already exists with this email');

    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        organizationId: organization.id,
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        passwordHash,
        role: registerDto.role || 'PROJECT_MANAGER',
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, organizationId: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.organizationId);
    return { user, ...tokens };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isActive: true },
    });
    if (!user?.refreshToken) throw new UnauthorizedException('Access denied');

    const tokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!tokenMatches) throw new UnauthorizedException('Access denied');

    return this.generateTokens(user.id, user.email, user.role, user.organizationId);
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    organizationId: string,
  ) {
    const payload = { sub: userId, email, role, organizationId };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.accessSecret'),
        expiresIn: this.configService.get('jwt.accessExpiry'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiry'),
      }),
    ]);
    return { accessToken, refreshToken };
  }
}
