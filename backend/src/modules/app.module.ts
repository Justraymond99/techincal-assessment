import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import dotenv from 'dotenv';
import { TransactionsModule } from './transactions/transactions.module.js';
import { CapitalModule } from './capital/capital.module.js';

dotenv.config();

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/finances'),
    TransactionsModule,
    CapitalModule,
  ],
})
export class AppModule {}

