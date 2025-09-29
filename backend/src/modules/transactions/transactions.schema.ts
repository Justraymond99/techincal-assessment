import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TransactionDocument = HydratedDocument<Transaction>;

export type TransactionType = 'income' | 'expense';

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ required: true, type: String, enum: ['income', 'expense'] })
  type!: TransactionType;

  @Prop({ required: true, type: Number, min: 0 })
  amount!: number;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: Date })
  date?: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

