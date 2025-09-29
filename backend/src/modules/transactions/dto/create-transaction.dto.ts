export type TransactionType = 'income' | 'expense';

export interface CreateTransactionDto {
  type: TransactionType;
  amount: number;
  description?: string;
  date?: string;
}

