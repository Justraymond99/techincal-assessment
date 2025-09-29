import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Capital, CapitalDocument } from './capital.schema.js';

@Injectable()
export class CapitalService {
  constructor(
    @InjectModel(Capital.name) private readonly capitalModel: Model<CapitalDocument>,
  ) {}

  async get(): Promise<number> {
    const doc = await this.ensureOne();
    return doc.value;
  }

  async applyTransactionDelta(type: 'income' | 'expense', amount: number, opts?: { reverse?: boolean }): Promise<void> {
    const isReverse = opts?.reverse === true;
    const sign = type === 'income' ? 1 : -1;
    const delta = (isReverse ? -1 : 1) * sign * amount;
    await this.capitalModel.updateOne({}, { $inc: { value: delta } }, { upsert: true });
  }

  async reconcileEdit(oldType: 'income' | 'expense', oldAmount: number, newType: 'income' | 'expense', newAmount: number): Promise<void> {
    // Reverse old, then apply new
    await this.applyTransactionDelta(oldType, oldAmount, { reverse: true });
    await this.applyTransactionDelta(newType, newAmount);
  }

  private async ensureOne(): Promise<CapitalDocument> {
    let doc = await this.capitalModel.findOne();
    if (!doc) {
      doc = await this.capitalModel.create({ value: 0 });
    }
    return doc;
  }
}

