import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, ViewType } from './types';
import { GoogleSheetsService } from './services/googleSheets';
import TransactionForm from './components/TransactionForm';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import Settings from './components/Settings';
import StatCard from './components/StatCard';
import { 
  LayoutDashboard, 
  Receipt, 
  Settings as SettingsIcon, 
  RefreshCw,
  AlertCircle,
  Menu,
  Zap,
  Wallet,
  ArrowRightCircle,
  TrendingUp
} from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]); 
  const [expenses, setExpenses] = useState<Transaction[]>([]);         
  const [fetchedCategories, setFetchedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [salesData, expenseData, categoryData] = await Promise.all([
        GoogleSheetsService.fetchTransactions('Transcations'),
        GoogleSheetsService.fetchTransactions('Expenses'),
        GoogleSheetsService.fetchTransactions('Category').catch(() => []) 
      ]);

      setTransactions(salesData);
      setExpenses(expenseData);
      
      const categoriesFromSheet = categoryData
        .map(c => (c.category || c.date || c.name || '').toString().trim()) 
        .filter(c => 
          c !== '' && 
          !['DATE', 'NAME', 'CATEGORY', 'AMOUNT'].includes(c.toUpperCase())
        );
      
      setFetchedCategories(categoriesFromSheet);
    } catch (err: any) {
      setError(err.message || 'Could not fetch data. Check your permissions.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddData = async (newRecord: Transaction, sheet: 'Transcations' | 'Expenses') => {
    setIsSyncing(true);
    try {
      await GoogleSheetsService.addTransaction(newRecord, sheet);
      if (sheet === 'Transcations') {
        setTransactions(prev => [...prev, newRecord]);
      } else {
        setExpenses(prev => [...prev, newRecord]);
      }
      setTimeout(() => fetchData(), 2500); 
    } catch (err) {
      setError('Sync failed. Please check connection and Script version.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteData = async (transaction: Transaction, sheet: 'Transcations' | 'Expenses') => {
    if (transaction.rowId === undefined || transaction.rowId === null) {
      setError('Cannot delete: This record is missing a cloud identifier.');
      return;
    }
    
    try {
      if (sheet === 'Transcations') {
        setTransactions(prev => prev.filter(t => t.rowId !== transaction.rowId));
      } else {
        setExpenses(prev => prev.filter(e => e.rowId !== transaction.rowId));
      }
      await GoogleSheetsService.deleteTransaction(transaction.rowId, sheet);
      setTimeout(() => { fetchData(); }, 3000);
    } catch (err) {
      console.error('Delete operation error:', err);
      setError('Delete request failed. Check your internet or Script version.');
      fetchData();
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Sales Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Sales Log', icon: Receipt },
    { id: 'expenses', label: 'Expense Log', icon: Wallet },
    { id: 'settings', label: 'Cloud Active', icon: SettingsIcon },
  ];

  const expenseStats = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const total = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const todayTotal = expenses
      .filter(t => {
        if (!t.date) return false;
        const cleanStr = t.date.startsWith("'") ? t.date.slice(1) : t.date;
        let transDate = cleanStr.split('T')[0];
        if (cleanStr.includes('T')) {
          const d = new Date(cleanStr);
          if (!isNaN(d.getTime())) {
            transDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          }
        }
        return transDate === todayStr;
      })
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    return { total, todayTotal };
  }, [expenses]);

  const dynamicExpenseCategories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(fetchedCategories)) as string[];
    return uniqueCategories.length > 0 
      ? uniqueCategories.sort((a, b) => a.localeCompare(b))
      : ['General']; 
  }, [fetchedCategories]);

  return (
    <div className="min-h-screen bg-black flex text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 border-r border-zinc-900 transform transition-all duration-500 lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col p-8">
          <div className="mb-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-900/40">
                <Zap className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter text-zinc-100">Load Badhige</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Finance Tracker</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id as ViewType);
                  setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all group
                  ${view === item.id 
                    ? 'bg-indigo-600/10 text-indigo-500' 
                    : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200'}
                `}
              >
                <item.icon className={`w-5 h-5 transition-transform duration-300 ${view === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-8">
            <div className="flex items-center gap-3 px-5 py-4 bg-zinc-900/50 rounded-2xl border border-zinc-900">
              <div className={`w-2 h-2 rounded-full ${error ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'} ${!error && (isLoading || isSyncing) ? 'animate-pulse' : ''}`} />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                  {error ? 'Sync Error' : (isLoading || isSyncing) ? 'Syncing...' : 'Cloud Active'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-zinc-900 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button className="lg:hidden p-2 text-zinc-400 hover:bg-zinc-900 rounded-xl transition-colors" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-xl font-black text-zinc-100 tracking-tight capitalize">
                {view === 'transactions' ? 'Sales Log' : view === 'dashboard' ? 'Sales Dashboard' : view === 'expenses' ? 'Expense Log' : view === 'settings' ? 'Cloud Settings' : view}
              </h2>
              <p className="text-xs font-bold text-zinc-500">Finance & Analytics</p>
            </div>
          </div>
          <button onClick={fetchData} disabled={isLoading} className="p-3 text-zinc-400 hover:text-indigo-500 hover:bg-indigo-600/10 rounded-2xl transition-all border border-zinc-900 flex items-center gap-2 group">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-500' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            <span className="text-xs font-bold hidden sm:inline px-1">Refresh Data</span>
          </button>
        </header>

        <div className="flex-1 p-8 lg:p-12 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-10 pb-12">
            {error && (
              <div className="bg-rose-950/30 border border-rose-900/50 p-5 rounded-3xl flex items-center gap-4 text-rose-200 text-sm shadow-sm animate-in slide-in-from-top-4">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
                <div className="flex-1 font-bold">{error}</div>
              </div>
            )}

            {view === 'dashboard' && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                <div className="xl:col-span-4">
                  <TransactionForm 
                    onSuccess={(t) => handleAddData(t, 'Transcations')} 
                    isLoading={isSyncing} 
                    title="Quick Sales Entry"
                    placeholder="Transferred By..."
                    icon={<TrendingUp className="w-5 h-5 text-indigo-500" />}
                  />
                </div>
                <div className="xl:col-span-8">
                  <Dashboard transactions={transactions} expenses={expenses} />
                </div>
              </div>
            )}

            {view === 'transactions' && (
              <TransactionList 
                transactions={transactions} 
                title="Full Sales Log" 
                description="List of all sales recorded in the main transactions sheet"
                nameLabel="Transferred By"
                onDelete={(t) => handleDeleteData(t, 'Transcations')}
              />
            )}

            {view === 'expenses' && (
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StatCard 
                    label="Total Expenses" 
                    value={`${expenseStats.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} MVR`} 
                    icon={<Wallet className="w-6 h-6 text-rose-500" />}
                    color="bg-rose-500/10"
                  />
                  <StatCard 
                    label="Today's Total Spend" 
                    value={`${expenseStats.todayTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} MVR`} 
                    icon={<ArrowRightCircle className="w-6 h-6 text-orange-500" />}
                    color="bg-orange-500/10"
                  />
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                  <div className="xl:col-span-4">
                    <TransactionForm 
                      onSuccess={(t) => handleAddData(t, 'Expenses')} 
                      isLoading={isSyncing} 
                      title="Log New Expense"
                      placeholder="Expense description..."
                      icon={<Wallet className="w-5 h-5 text-rose-500" />}
                      options={dynamicExpenseCategories}
                    />
                  </div>
                  <div className="xl:col-span-8">
                    <TransactionList 
                      transactions={expenses} 
                      title="Full Expense History" 
                      description="Dedicated list of spending recorded in the Expenses sheet"
                      showCategory={true}
                      onDelete={(t) => handleDeleteData(t, 'Expenses')}
                    />
                  </div>
                </div>
              </div>
            )}

            {view === 'settings' && <Settings onSave={fetchData} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;