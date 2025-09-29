import { Controller, Get } from '@nestjs/common';
import { CapitalService } from './capital.service.js';

@Controller('capital')
export class CapitalController {
  constructor(private readonly service: CapitalService) {}

  @Get()
  async get() {
    const value = await this.service.get();
    return { capital: value };
  }
}

