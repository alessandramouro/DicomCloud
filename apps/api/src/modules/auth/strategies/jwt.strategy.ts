import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtPayload } from '@dicomcloud/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.jwtSecret'),
      issuer: 'dicomcloud',
      audience: 'dicomcloud-api',
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const session = await this.prisma.userSession.findFirst({
      where: { userId: payload.sub, isRevoked: false },
    });

    if (!session) throw new UnauthorizedException('Session revoked or expired');

    // Update last used
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => null);

    return payload;
  }
}
