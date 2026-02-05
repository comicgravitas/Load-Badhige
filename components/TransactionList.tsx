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
  X,
  FileText,
  Filter
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const parseISO = (dateInput: string | any): Date | null => {
    if (!dateInput) return null;
    const cleanStr = String(dateInput).startsWith("'") ? String(dateInput).slice(1) : String(dateInput);
    let d: Date;
    if (cleanStr.includes('T')) {
      d = new Date(cleanStr);
    } else {
      const parts = cleanStr.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          const year = parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2]);
          d = new Date(year, parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
      } else {
        d = new Date(cleanStr);
      }
    }
    return isNaN(d.getTime()) ? null : d;
  };

  const formatDisplayDate = (dateInput: string | any) => {
    const dateObj = parseISO(dateInput);
    if (!dateObj) return String(dateInput || 'N/A');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mmm = MONTHS_SHORT[dateObj.getMonth()];
    const yy = String(dateObj.getFullYear()).slice(-2);
    return `${dd}-${mmm}-${yy}`;
  };

  const filteredTransactions = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    if (from) from.setHours(0, 0, 0, 0);
    if (to) to.setHours(23, 59, 59, 999);

    return transactions.filter(t => {
      const tDate = parseISO(t.date);
      const lowerSearch = searchTerm.toLowerCase();
      
      // Date range check
      if (from && tDate && tDate < from) return false;
      if (to && tDate && tDate > to) return false;

      // Text search check
      const safeName = String(t.name || '').toLowerCase();
      const safeCategory = String(t.category || '').toLowerCase();
      const formattedDate = formatDisplayDate(t.date).toLowerCase();
      
      const nameMatch = safeName.includes(lowerSearch);
      const categoryMatch = showCategory && safeCategory.includes(lowerSearch);
      const dateMatch = formattedDate.includes(lowerSearch);

      return nameMatch || categoryMatch || dateMatch;
    });
  }, [transactions, searchTerm, dateFrom, dateTo, showCategory]);

  const totalAmount = useMemo(() => {
    return filteredTransactions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [filteredTransactions]);

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
    if (filteredTransactions.length === 0) return;
    const headers = ['Date', ...(showCategory ? ['Category'] : []), nameLabel, 'Amount (MVR)'];
    const rows = filteredTransactions.slice().reverse().map(t => [
      formatDisplayDate(t.date),
      ...(showCategory ? [String(t.category || 'N/A')] : []),
      `"${String(t.name || '').replace(/"/g, '""')}"`,
      (Number(t.amount) || 0).toFixed(2)
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_export.csv`);
    link.click();
  };

  const handleExportPDF = () => {
    if (filteredTransactions.length === 0) return;
    const doc = new jsPDF();
    const now = new Date();
    const dateStamp = formatDisplayDate(now.toISOString());

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40);
    doc.text("Load Badhige", 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(title, 14, 30);
    doc.text(`Generated on: ${dateStamp}`, 14, 36);

    if (dateFrom || dateTo) {
      const range = `Period: ${dateFrom ? formatDisplayDate(dateFrom) : 'Start'} to ${dateTo ? formatDisplayDate(dateTo) : 'End'}`;
      doc.text(range, 14, 42);
    }

    const tableHeaders = [['Date', ...(showCategory ? ['Category'] : []), nameLabel, 'Amount (MVR)']];
    const tableData = filteredTransactions.slice().reverse().map(t => [
      formatDisplayDate(t.date),
      ...(showCategory ? [String(t.category || 'N/A')] : []),
      String(t.name || ''),
      (Number(t.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      foot: [['', ...(showCategory ? [''] : []), 'TOTAL', totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })]],
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    doc.save(`${title.replace(/\s+/g, '_')}_${dateStamp}.pdf`);
  };

  return (
    <div className="bg-zinc-950 rounded-3xl shadow-2xl border border-zinc-900 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="p-8 border-b border-zinc-900 bg-zinc-950">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
          <div>
            <h3 className="text-xl font-extrabold text-zinc-100 flex items-center gap-3">
              <div className="p-2 bg-violet-500/10 rounded-xl">
                <Table className="w-5 h-5 text-violet-500" />
              </div>
              {title}
            </h3>
            <p className="text-sm text-zinc-500 mt-1">{description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              disabled={transactions.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
            <button
              onClick={handleExportPDF}
              disabled={transactions.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-900/20 active:scale-95 disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              PDF Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              type="text"
              placeholder={`Search ${nameLabel.toLowerCase()}...`}
              className="w-full pl-11 pr-11 py-3 bg-black border border-zinc-800 rounded-2xl text-sm font-bold text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="lg:col-span-7 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full grid grid-cols-2 gap-2">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                  <Filter className="w-3 h-3 text-zinc-600 group-focus-within:text-indigo-500" />
                  <span className="text-[10px] font-black text-zinc-600 uppercase">From</span>
                </div>
                <input
                  type="date"
                  className="w-full pl-16 pr-4 py-3 bg-black border border-zinc-800 rounded-2xl text-xs font-bold text-zinc-200 focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                  <Filter className="w-3 h-3 text-zinc-600 group-focus-within:text-indigo-500" />
                  <span className="text-[10px] font-black text-zinc-600 uppercase">To</span>
                </div>
                <input
                  type="date"
                  className="w-full pl-12 pr-4 py-3 bg-black border border-zinc-800 rounded-2xl text-xs font-bold text-zinc-200 focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
            {(dateFrom || dateTo || searchTerm) && (
              <button 
                onClick={() => { setDateFrom(''); setDateTo(''); setSearchTerm(''); }}
                className="p-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-2xl transition-colors border border-rose-500/20"
                title="Clear Filters"
              >
                <X className="w-4 h-4" />
              </button>
            )}
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
                      {String(t.category || 'Uncategorized')}
                    </span>
                  </td>
                )}
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-900 rounded-lg group-hover:bg-zinc-800 transition-colors">
                      <Tag className="w-4 h-4 text-zinc-600" />
                    </div>
                    <span className="text-sm font-bold text-zinc-200">{String(t.name || '')}</span>
                  </div>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs font-bold text-zinc-700">MVR</span>
                    <span className="text-base font-black text-zinc-100">
                      {(Number(t.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
          </tbody>
          {filteredTransactions.length > 0 && (
            <tfoot className="bg-zinc-900/50">
              <tr>
                <td colSpan={showCategory ? 3 : 2} className="px-8 py-6 text-xs font-black text-zinc-500 uppercase tracking-widest">Total for this selection</td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs font-bold text-indigo-500">MVR</span>
                    <span className="text-xl font-black text-white">
                      {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </td>
                {onDelete && <td />}
              </tr>
            </tfoot>
          )}
          {filteredTransactions.length === 0 && (
            <tbody>
              <tr>
                <td colSpan={showCategory ? 5 : 4} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-2">
                      <Search className="w-8 h-8 text-zinc-800" />
                    </div>
                    <p className="text-zinc-700 font-bold">No records found for current filters.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
};

export default TransactionList;