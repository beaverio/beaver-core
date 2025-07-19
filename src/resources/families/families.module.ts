import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { FamiliesController } from './families.controller';
import { Family } from './entities/family.entity';
import { FamiliesRepository } from './repositories/families.repository';
import { FamiliesService } from './services/families.service';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Family]),
    CommonModule,
    forwardRef(() => MembershipsModule),
  ],
  controllers: [FamiliesController],
  providers: [
    {
      provide: 'IFamiliesRepository',
      useClass: FamiliesRepository,
    },
    {
      provide: 'IFamiliesService',
      useClass: FamiliesService,
    },
  ],
  exports: ['IFamiliesRepository'],
})
export class FamiliesModule {}