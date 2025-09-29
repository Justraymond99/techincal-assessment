import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from './transactions.schema.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import { CapitalService } from '../capital/capital.service.js';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>,
    private readonly capitalService: CapitalService,
  ) {}

  async findAll(): Promise<Transaction[]> {
    return this.transactionModel.find().sort({ createdAt: -1 }).lean();
  }

  async create(dto: CreateTransactionDto): Promise<Transaction> {
    const doc = await this.transactionModel.create({
      type: dto.type,
      amount: dto.amount,
      description: dto.description,
      date: dto.date ? new Date(dto.date) : undefined,
    });
    await this.capitalService.applyTransactionDelta(doc.type, doc.amount);
    return doc.toObject();
  }

  async update(id: string, dto: UpdateTransactionDto): Promise<Transaction> {
    const existing = await this.transactionModel.findById(id);
    if (!existing) throw new NotFoundException('Transaction not found');

    const oldType = existing.type;
    const oldAmount = existing.amount;

    if (dto.type !== undefined) existing.type = dto.type as any;
    if (dto.amount !== undefined) existing.amount = dto.amount;
    if (dto.description !== undefined) existing.description = dto.description;
    if (dto.date !== undefined) existing.date = dto.date ? new Date(dto.date) : undefined;

    const updated = await existing.save();

    await this.capitalService.reconcileEdit(oldType, oldAmount, updated.type, updated.amount);
    return updated.toObject();
  }

  async delete(id: string): Promise<void> {
    const existing = await this.transactionModel.findById(id);
    if (!existing) throw new NotFoundException('Transaction not found');
    await existing.deleteOne();
    await this.capitalService.applyTransactionDelta(existing.type, existing.amount, { reverse: true });
  }
}

