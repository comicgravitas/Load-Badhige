import React, { useState, useEffect, useRef } from 'react';
import { Transaction } from '../types';
import { PlusCircle, Loader2, Sparkles, Calendar as CalendarIcon, Tag, ChevronDown, Edit3, AlignLeft } from 'lucide-react';

interface TransactionFormProps {
  onSuccess: (transaction: Transaction) => void;
  isLoading: boolean;
  title?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  options?: string[]; 
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TransactionForm: React.FC<TransactionFormProps> = ({ 
  onSuccess, 
  isLoading, 
  title = "New Entry", 
  placeholder = "Details...",
  icon = <PlusCircle className="w-5 h-5 text-indigo-500" />,
  options = []
}) => {
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateToDisplay = (isoDate: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    const [y, m, d] = parts;
    const monthIndex = parseInt(m, 10) - 1;
    const mmm = MONTHS_SHORT[monthIndex] || m;
    const yy = y.slice(-2);
    return `${d.padStart(2, '0')}-${mmm}-${yy}`;
  };

  const [formData, setFormData] = useState<Transaction>({
    date: getLocalDateString(),
    amount: 0,
    name: '',
    category: options.length > 1 ? options[0] : (options[0] || '')
  });

  const [displayDate, setDisplayDate] = useState(formatDateToDisplay(getLocalDateString()));
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  useEffect(() => {
    if (options.length > 0 && !isCustomCategory) {
      if (!formData.category || !options.includes(formData.category)) {
        setFormData(prev => ({ ...prev, category: options[0] }));
      }
    }
  }, [options, isCustomCategory]);

  const handlePickerChange = (isoDate: string) => {
    if (!isoDate) return;
    setFormData(prev => ({ ...prev, date: isoDate }));
    setDisplayDate(formatDateToDisplay(isoDate));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0 || !formData.name || !formData.date) return;
    const finalCategory = formData.category || (options.length > 0 ? options[0] : '');
    onSuccess({ ...formData, category: finalCategory });
    
    const defaultDate = getLocalDateString();
    setFormData({
      date: defaultDate,
      amount: 0,
      name: '',
      category: options.length > 0 ? options[0] : ''
    });
    setDisplayDate(formatDateToDisplay(defaultDate));
    setIsCustomCategory(false);
  };

  const handleDateClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    try {
      if ('showPicker' in input) {
        input.showPicker();
      }
    } catch (error) {
      console.debug('Native showPicker not supported or failed', error);
    }
  };

  return (
    <div className="bg-zinc-950 p-8 rounded-3xl shadow-2xl border border-zinc-900 h-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
        <Sparkles className="w-24 h-24 text-indigo-500" />
      </div>
      
      <h3 className="text-xl font-extrabold text-zinc-100 mb-8 flex items-center gap-3">
        <div className="p-2.5 bg-indigo-500/10 rounded-xl">
          {icon}
        </div>
        {title}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1 flex items-center gap-2">
            <CalendarIcon className="w-3 h-3" />
            Date Selection
          </label>
          
          <div className="relative group/date h-[58px]">
            <div className="absolute inset-0 w-full h-full px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between pointer-events-none group-hover/date:border-indigo-500 transition-all">
              <span className="text-sm font-bold text-zinc-200 uppercase">
                {displayDate || "DD-MMM-YY"}
              </span>
              <CalendarIcon className="w-4 h-4 text-zinc-600 group-hover/date:text-indigo-500 transition-all" />
            </div>

            <input
              type="date"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 block"
              value={formData.date}
              onChange={(e) => handlePickerChange(e.target.value)}
              onClick={handleDateClick}
              required
            />
          </div>
        </div>
        
        {options.length > 0 && (
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1 flex items-center gap-2">
              <Tag className="w-3 h-3" />
              Category
            </label>
            
            {!isCustomCategory ? (
              <div className="relative">
                <select
                  required
                  className="w-full px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-bold appearance-none cursor-pointer text-zinc-200"
                  value={formData.category}
                  onChange={(e) => {
                    if (e.target.value === 'CUSTOM_NEW') {
                      setIsCustomCategory(true);
                      setFormData({ ...formData, category: '' });
                    } else {
                      setFormData({ ...formData, category: e.target.value });
                    }
                  }}
                >
                  {options.map((opt) => (
                    <option key={opt} value={opt} className="bg-zinc-950">{opt}</option>
                  ))}
                  <option value="CUSTOM_NEW" className="text-indigo-500 font-bold bg-zinc-950">+ Add New...</option>
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="New category name..."
                  className="w-full px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-bold text-zinc-200"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  autoFocus
                />
                <button 
                  type="button"
                  onClick={() => setIsCustomCategory(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
                  title="Back to list"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1 flex items-center gap-2">
            <AlignLeft className="w-3 h-3" />
            Description
          </label>
          <input
            type="text"
            required
            placeholder={placeholder}
            className="w-full px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-bold text-zinc-200"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Amount (MVR)</label>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 font-black text-xs">MVR</span>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              className="w-full pl-16 pr-5 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-base font-black text-zinc-100"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-zinc-100 hover:bg-indigo-600 disabled:bg-zinc-800 text-zinc-950 hover:text-white font-black py-4 rounded-2xl shadow-xl shadow-black transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <PlusCircle className="w-5 h-5" />
              Sync Record
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;