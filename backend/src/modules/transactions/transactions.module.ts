import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionsService } from './transactions.service.js';
import { TransactionsController } from './transactions.controller.js';
import { Transaction, TransactionSchema } from './transactions.schema.js';
import { CapitalModule } from '../capital/capital.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }]),
    CapitalModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}

