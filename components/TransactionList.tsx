import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { 
  Table, 
  Calendar, 
  Tag, 
  Landmark, 
  Download, 
  Layers, 
  Trash2, 
  AlertTriangle, 
  Loader2, 
  Search, 
  X 
} from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  title?: string;
  description?: string;
  nameLabel?: string;
  showCategory?: boolean;
  onDelete?: (transaction: Transaction) => Promise<void>;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  title = "History", 
  description = "Detailed log of your records",
  nameLabel = "Description",
  showCategory = false,
  onDelete
}) => {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const formatDisplayDate = (dateInput: string) => {
    if (!dateInput) return 'N/A';
    const cleanStr = dateInput.startsWith("'") ? dateInput.slice(1) : dateInput;
    let dateObj: Date;
    if (cleanStr.includes('T')) {
      dateObj = new Date(cleanStr);
    } else {
      const parts = cleanStr.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else if (parts[2].length === 4 || parts[2].length === 2) {
          const year = parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2]);
          dateObj = new Date(year, parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else { dateObj = new Date(cleanStr); }
      } else { dateObj = new Date(cleanStr); }
    }
    
    if (isNaN(dateObj.getTime())) return cleanStr;
    
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mmm = MONTHS_SHORT[dateObj.getMonth()];
    const yy = String(dateObj.getFullYear()).slice(-2);
    return `${dd}-${mmm}-${yy}`;
  };

  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions;
    const lowerSearch = searchTerm.toLowerCase();
    return transactions.filter(t => {
      const formattedDate = formatDisplayDate(t.date).toLowerCase();
      const nameMatch = t.name.toLowerCase().includes(lowerSearch);
      const categoryMatch = showCategory && t.category?.toLowerCase().includes(lowerSearch);
      const dateMatch = formattedDate.includes(lowerSearch);
      return nameMatch || categoryMatch || dateMatch;
    });
  }, [transactions, searchTerm, showCategory]);

  const handleDeleteClick = async (t: Transaction) => {
    if (t.rowId === undefined || t.rowId === null || !onDelete) return;
    if (confirmDeleteId !== t.rowId) {
      setConfirmDeleteId(t.rowId);
      return;
    }
    try {
      setDeletingId(t.rowId);
      await onDelete(t);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleExportCSV = () => {
    const dataToExport = filteredTransactions.length > 0 ? filteredTransactions : transactions;
    if (dataToExport.length === 0) return;
    
    const headers = ['Date', ...(showCategory ? ['Category'] : []), nameLabel, 'Amount (MVR)'];
    const rows = dataToExport.slice().reverse().map(t => [
      formatDisplayDate(t.date),
      ...(showCategory ? [t.category || 'N/A'] : []),
      `"${t.name.replace(/"/g, '""')}"`,
      t.amount.toFixed(2)
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const stamp = `${String(now.getDate()).padStart(2, '0')}-${MONTHS_SHORT[now.getMonth()]}-${String(now.getFullYear()).slice(-2)}`;
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_${stamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-zinc-950 rounded-3xl shadow-2xl border border-zinc-900 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="p-8 border-b border-zinc-900 flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-zinc-950">
        <div>
          <h3 className="text-xl font-extrabold text-zinc-100 flex items-center gap-3">
            <div className="p-2 bg-violet-500/10 rounded-xl">
              <Table className="w-5 h-5 text-violet-500" />
            </div>
            {title}
          </h3>
          <p className="text-sm text-zinc-500 mt-1">{description}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1 xl:max-w-2xl xl:justify-end">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              type="text"
              placeholder={`Filter by ${nameLabel.toLowerCase()}${showCategory ? ', category' : ''} or date...`}
              className="w-full pl-11 pr-11 py-3 bg-black border border-zinc-800 rounded-2xl text-sm font-bold text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              disabled={transactions.length === 0}
              className="flex items-center gap-2 px-5 py-3 bg-zinc-100 hover:bg-white disabled:bg-zinc-900 disabled:text-zinc-700 text-zinc-950 rounded-2xl text-xs font-black transition-all shadow-lg active:scale-95 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Export {searchTerm ? 'Filtered' : 'CSV'}
            </button>
            <span className="text-xs font-black text-indigo-500 bg-indigo-500/10 px-4 py-3 rounded-2xl border border-indigo-500/20 uppercase tracking-tighter hidden sm:block whitespace-nowrap">
              {searchTerm ? `${filteredTransactions.length} Matches` : `${transactions.length} Entries`}
            </span>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-black">
            <tr>
              <th className="px-8 py-5 text-xs font-bold text-zinc-600 uppercase tracking-widest">Date</th>
              {showCategory && <th className="px-8 py-5 text-xs font-bold text-zinc-600 uppercase tracking-widest">Category</th>}
              <th className="px-8 py-5 text-xs font-bold text-zinc-600 uppercase tracking-widest">{nameLabel}</th>
              <th className="px-8 py-5 text-xs font-bold text-zinc-600 uppercase tracking-widest text-right">Amount</th>
              {onDelete && <th className="px-8 py-5 text-xs font-bold text-zinc-600 uppercase tracking-widest text-right w-10">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {filteredTransactions.slice().reverse().map((t, i) => (
              <tr key={t.rowId || i} className="group hover:bg-zinc-900/30 transition-all cursor-default">
                <td className="px-8 py-5 whitespace-nowrap">
                  <div className="flex items-center gap-3 text-sm font-medium text-zinc-500 uppercase">
                    <Calendar className="w-4 h-4 text-zinc-700 group-hover:text-indigo-500 transition-colors" />
                    {formatDisplayDate(t.date)}
                  </div>
                </td>
                {showCategory && (
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 text-zinc-400 text-[10px] font-black uppercase tracking-tighter border border-zinc-800">
                      <Layers className="w-3 h-3" />
                      {t.category || 'Uncategorized'}
                    </span>
                  </td>
                )}
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-900 rounded-lg group-hover:bg-zinc-800 transition-colors">
                      <Tag className="w-4 h-4 text-zinc-600" />
                    </div>
                    <span className="text-sm font-bold text-zinc-200">{t.name}</span>
                  </div>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs font-bold text-zinc-700">MVR</span>
                    <span className="text-base font-black text-zinc-100">
                      {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </td>
                {onDelete && (
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => handleDeleteClick(t)}
                        disabled={deletingId === t.rowId}
                        className={`
                          p-2 rounded-xl transition-all flex items-center gap-2 group/btn
                          ${confirmDeleteId === t.rowId 
                            ? 'bg-rose-950 text-rose-500 px-3 border border-rose-900' 
                            : 'hover:bg-rose-950 text-zinc-700 hover:text-rose-500'}
                        `}
                      >
                        {deletingId === t.rowId ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                        ) : confirmDeleteId === t.rowId ? (
                          <>
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase">Confirm?</span>
                          </>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={showCategory ? 5 : 4} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-2">
                      {searchTerm ? (
                        <Search className="w-8 h-8 text-zinc-800" />
                      ) : (
                        <Landmark className="w-8 h-8 text-zinc-800" />
                      )}
                    </div>
                    <p className="text-zinc-700 font-bold">
                      {searchTerm ? `No results for "${searchTerm}"` : 'No records found.'}
                    </p>
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="text-xs font-black text-indigo-500 hover:text-indigo-400 mt-2 uppercase tracking-widest"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionList;