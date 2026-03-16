export type Category = 'genuine' | 'avoidable' | 'unnecessary' | 'pending';

export interface Expense {
  id: string;
  amount: number;
  reason: string;
  timestamp: number;
  category: Category;
  rawText?: string;
}

export interface DailySummary {
  date: string;
  total: number;
  categories: {
    genuine: number;
    avoidable: number;
    unnecessary: number;
  };
}
