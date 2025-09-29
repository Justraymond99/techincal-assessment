import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CapitalService } from './capital.service.js';
import { CapitalController } from './capital.controller.js';
import { Capital, CapitalSchema } from './capital.schema.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: Capital.name, schema: CapitalSchema }])],
  controllers: [CapitalController],
  providers: [CapitalService],
  exports: [CapitalService],
})
export class CapitalModule {}

