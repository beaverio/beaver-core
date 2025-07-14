import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfig = (config: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: config.get('DATABASE_URL'),
  autoLoadEntities: true,
  synchronize: false
});
