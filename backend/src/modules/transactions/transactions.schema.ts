import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TransactionDocument = HydratedDocument<Transaction>;

export type TransactionType = 'income' | 'expense';

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ required: true, enum: ['income', 'expense'] })
  type!: TransactionType;

  @Prop({ required: true, min: 0 })
  amount!: number;

  @Prop()
  description?: string;

  @Prop()
  date?: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

