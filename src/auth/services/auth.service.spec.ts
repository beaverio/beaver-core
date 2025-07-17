import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserService = {
    getUser: jest.fn(),
    getUsers: jest.fn(),
    createUser: jest.fn(),
    updateUserInternal: jest.fn(),
  };

  const mockSessionService = {
    storeSession: jest.fn(),
    isSessionValid: jest.fn(),
    revokeSession: jest.fn(),
    revokeAllUserSessions: jest.fn(),
    getActiveSessionCount: jest.fn(),
  };

  const mockRefreshTokenRepository = {
    create: jest.fn(),
    findByUserIdAndTokenHash: jest.fn(),
    findByUserId: jest.fn(),
    deleteByUserIdAndTokenHash: jest.fn(),
    deleteAllByUserId: jest.fn(),
    deleteExpired: jest.fn(),
  };

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('test-value'),
    get: jest.fn().mockReturnValue('test'),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('test-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: 'IUserService',
          useValue: mockUserService,
        },
        {
          provide: 'ISessionService',
          useValue: mockSessionService,
        },
        {
          provide: 'IRefreshTokenRepository',
          useValue: mockRefreshTokenRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
