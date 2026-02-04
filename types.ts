
export interface Transaction {
  rowId?: number;
  date: string;
  amount: number;
  name: string;
  category?: string;
}

export interface DailyTotal {
  date: string;
  total: number;
}

export type ViewType = 'dashboard' | 'transactions' | 'expenses' | 'settings';
