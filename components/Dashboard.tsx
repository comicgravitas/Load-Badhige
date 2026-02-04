import React, { useMemo } from 'react';
import { Transaction, DailyTotal } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Landmark, TrendingUp, Banknote, AlertCircle } from 'lucide-react';
import StatCard from './StatCard';

interface DashboardProps {
  transactions: Transaction[];
  expenses: Transaction[];
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Dashboard: React.FC<DashboardProps> = ({ transactions, expenses }) => {
  const getLocalDatePart = (dateInput: string) => {
    if (!dateInput) return '';
    const cleanStr = dateInput.startsWith("'") ? dateInput.slice(1) : dateInput;
    if (cleanStr.includes('T')) {
      const d = new Date(cleanStr);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
    return cleanStr.split('T')[0];
  };

  const formatForDisplay = (isoDate: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    const [y, m, d] = parts;
    const monthIndex = parseInt(m, 10) - 1;
    const mmm = MONTHS_SHORT[monthIndex] || m;
    return `${d.padStart(2, '0')}-${mmm}-${y.slice(-2)}`;
  };

  const stats = useMemo(() => {
    const totalSales = transactions.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const profit = totalSales - totalExpenses;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayTotal = transactions
      .filter(t => t.date && getLocalDatePart(t.date) === todayStr)
      .reduce((acc, curr) => acc + curr.amount, 0);
    const dailyMap = transactions.reduce((acc: Record<string, number>, curr) => {
      const dateKey = getLocalDatePart(curr.date);
      if (dateKey) {
        acc[dateKey] = (acc[dateKey] || 0) + curr.amount;
      }
      return acc;
    }, {} as Record<string, number>);
    const dailyData: DailyTotal[] = Object.entries(dailyMap)
      .map(([date, total]) => ({ date, total: total as number }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);
    return { totalSales, todayTotal, dailyData, totalExpenses, profit };
  }, [transactions, expenses]);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          label="Total Sales" 
          value={`${stats.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })} MVR`} 
          icon={<Landmark className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-500" />}
          color="bg-emerald-500/10"
        />
        <StatCard 
          label="Today's Sales" 
          value={`${stats.todayTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} MVR`} 
          icon={<TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-indigo-500" />}
          color="bg-indigo-500/10"
        />
        <StatCard 
          label="Profit / Loss" 
          value={`${stats.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })} MVR`} 
          icon={stats.profit >= 0 ? <Banknote className="w-5 h-5 lg:w-6 lg:h-6 text-violet-500" /> : <AlertCircle className="w-5 h-5 lg:w-6 lg:h-6 text-rose-500" />}
          color={stats.profit >= 0 ? "bg-violet-500/10" : "bg-rose-500/10"}
          trend={stats.profit >= 0 ? "Positive Net" : "Negative Net"}
        />
      </div>

      <div className="w-full">
        <div className="bg-zinc-950 p-8 rounded-3xl shadow-2xl border border-zinc-900">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-zinc-100 tracking-tight">Daily Sales Performance</h3>
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Last 14 days</div>
          </div>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#18181b" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#52525b', fontWeight: 600 }} 
                  dy={10}
                  tickFormatter={formatForDisplay}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#52525b', fontWeight: 600 }}
                />
                <Tooltip 
                  cursor={{ fill: '#09090b' }}
                  labelFormatter={formatForDisplay}
                  formatter={(value) => [`${Number(value).toFixed(2)} MVR`, 'Total Sales']}
                  contentStyle={{ 
                    backgroundColor: '#000000', 
                    borderRadius: '16px', 
                    border: '1px solid #27272a', 
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', 
                    padding: '12px',
                    color: '#fafafa'
                  }}
                  itemStyle={{ color: '#fafafa' }}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={32}>
                  {stats.dailyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.9} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;