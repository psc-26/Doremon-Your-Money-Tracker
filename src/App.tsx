import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Wallet, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  ChevronRight,
  Sparkles,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip
} from 'recharts';
import { format, isSameDay, isSameWeek, isSameMonth, isSameYear } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { parseExpense, getSpendingInsight } from './services/geminiService';
import { Expense, Category } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COLORS = {
  genuine: '#00FF00',
  avoidable: '#FFFF00',
  unnecessary: '#FF0055',
  pending: '#333333'
};

export default function App() {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('zenz_expenses');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputText, setInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [showReview, setShowReview] = useState(false);
  const [insight, setInsight] = useState<string>('');
  const [isInsightLoading, setIsInsightLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('zenz_expenses', JSON.stringify(expenses));
  }, [expenses]);

  const fetchInsight = async () => {
    setIsInsightLoading(true);
    const text = await getSpendingInsight(expenses);
    setInsight(text);
    setIsInsightLoading(false);
  };

  useEffect(() => {
    if (expenses.length > 0 && !insight) {
      fetchInsight();
    }
  }, [expenses]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsParsing(true);
    const parsed = await parseExpense(inputText);
    setIsParsing(false);

    if (parsed) {
      const newExpense: Expense = {
        id: Math.random().toString(36).substr(2, 9),
        amount: parsed.amount,
        reason: parsed.reason,
        timestamp: parsed.timestamp,
        category: parsed.suggestedCategory || 'pending',
        rawText: inputText
      };
      setExpenses(prev => [newExpense, ...prev]);
      setInputText('');
    }
  };

  const updateCategory = (id: string, category: Category) => {
    setExpenses(prev => prev.map(ex => ex.id === id ? { ...ex, category } : ex));
  };

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter(ex => {
      const date = new Date(ex.timestamp);
      if (activeTab === 'daily') return isSameDay(date, now);
      if (activeTab === 'weekly') return isSameWeek(date, now);
      if (activeTab === 'monthly') return isSameMonth(date, now);
      if (activeTab === 'yearly') return isSameYear(date, now);
      return true;
    });
  }, [expenses, activeTab]);

  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const byCategory = filteredExpenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    const chartData = [
      { name: 'Genuine', value: byCategory.genuine || 0, color: COLORS.genuine },
      { name: 'Avoidable', value: byCategory.avoidable || 0, color: COLORS.avoidable },
      { name: 'Unnecessary', value: byCategory.unnecessary || 0, color: COLORS.unnecessary },
    ].filter(d => d.value > 0);

    return { total, byCategory, chartData };
  }, [filteredExpenses]);

  const pendingCount = expenses.filter(ex => ex.category === 'pending').length;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'GM, Bestie';
    if (hour < 18) return 'Good Afternoon';
    return 'Evening Vibe';
  }, []);

  return (
    <div className="min-h-screen bg-dark-bg pb-24 selection:bg-neon-green selection:text-black">
      {/* Header - Paytm Style but Neon */}
      <header className="sticky top-0 z-50 glass-card rounded-t-none border-x-0 border-t-0 p-4 sm:p-6 mb-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              animate={{ 
                boxShadow: ["0 0 20px rgba(0,255,0,0.2)", "0 0 40px rgba(0,255,0,0.4)", "0 0 20px rgba(0,255,0,0.2)"] 
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-12 h-12 rounded-2xl bg-neon-green flex items-center justify-center"
            >
              <Wallet className="text-black w-6 h-6" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{greeting}</h1>
              <p className="text-xs text-white/50 font-mono uppercase">Doremon Agent v1.0</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Total Balance</p>
            <p className="text-2xl font-bold text-neon-green">₹{stats.total.toLocaleString()}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* AI Input */}
        <section className="glass-card p-6 neon-shadow-green">
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-neon-green" />
              <span className="text-xs font-bold uppercase tracking-tighter text-neon-green">AI Agent Ready</span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g., Spent 200 on coffee at Starbucks"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-neon-green transition-all"
                disabled={isParsing}
              />
              <button
                type="submit"
                disabled={isParsing || !inputText}
                className="absolute right-2 top-2 bottom-2 px-6 bg-neon-green text-black font-bold rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                {isParsing ? '...' : <Plus className="w-6 h-6" />}
              </button>
            </div>
            <p className="text-[10px] text-white/30 font-mono">PROMPT: AMOUNT + REASON + TIME</p>
          </form>
        </section>

        {/* AI Insight Section */}
        <section className="glass-card p-6 border-neon-pink/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2">
            <Sparkles className="w-4 h-4 text-neon-pink animate-pulse" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-neon-pink/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-neon-pink" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-neon-pink">Doremon's Tea ☕</h3>
          </div>
          <div className="min-h-[60px] flex items-center">
            {isInsightLoading ? (
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-neon-pink rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-neon-pink rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-neon-pink rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            ) : (
              <p className="text-lg font-medium leading-relaxed italic">
                "{insight || "Add some expenses to get the tea, bestie! 💅"}"
              </p>
            )}
          </div>
          <button 
            onClick={fetchInsight}
            disabled={isInsightLoading}
            className="mt-4 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-neon-pink transition-colors flex items-center gap-1"
          >
            Refresh Insight <ChevronRight className="w-3 h-3" />
          </button>
        </section>

        {/* Quick Stats Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {['daily', 'weekly', 'monthly', 'yearly'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all whitespace-nowrap",
                activeTab === tab 
                  ? "bg-white text-black border-white" 
                  : "bg-transparent text-white/50 border-white/10 hover:border-white/30"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Analytics Card */}
        <section className="glass-card p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="h-48 relative">
            {stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.chartData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs uppercase font-bold">
                No Data Yet
              </div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase text-white/40">Total</span>
              <span className="text-lg font-bold">₹{stats.total}</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-neon-green/10 border border-neon-green/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-neon-green" />
                <span className="text-sm font-medium">Genuine</span>
              </div>
              <span className="font-bold">₹{stats.byCategory.genuine || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-neon-yellow/10 border border-neon-yellow/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-neon-yellow" />
                <span className="text-sm font-medium">Avoidable</span>
              </div>
              <span className="font-bold">₹{stats.byCategory.avoidable || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-neon-pink/10 border border-neon-pink/20">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-neon-pink" />
                <span className="text-sm font-medium">Unnecessary</span>
              </div>
              <span className="font-bold">₹{stats.byCategory.unnecessary || 0}</span>
            </div>
          </div>
        </section>

        {/* Expense List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-neon-green" />
              Recent Activity
            </h2>
            {pendingCount > 0 && (
              <button 
                onClick={() => setShowReview(true)}
                className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-neon-pink text-white rounded-full animate-pulse"
              >
                {pendingCount} Pending Review
              </button>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredExpenses.map((expense) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={expense.id}
                  className="glass-card p-4 flex items-center justify-between group hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-2 h-12 rounded-full",
                      expense.category === 'genuine' && "bg-neon-green",
                      expense.category === 'avoidable' && "bg-neon-yellow",
                      expense.category === 'unnecessary' && "bg-neon-pink",
                      expense.category === 'pending' && "bg-white/20"
                    )} />
                    <div>
                      <p className="font-bold text-lg">{expense.reason}</p>
                      <p className="text-xs text-white/40 font-mono">
                        {format(expense.timestamp, 'hh:mm a • MMM dd')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">₹{expense.amount}</p>
                    <div className="flex gap-1 mt-1">
                      {expense.category === 'pending' ? (
                        <div className="flex gap-1">
                          <button onClick={() => updateCategory(expense.id, 'genuine')} className="p-1 hover:text-neon-green transition-colors"><CheckCircle2 className="w-4 h-4" /></button>
                          <button onClick={() => updateCategory(expense.id, 'avoidable')} className="p-1 hover:text-neon-yellow transition-colors"><AlertCircle className="w-4 h-4" /></button>
                          <button onClick={() => updateCategory(expense.id, 'unnecessary')} className="p-1 hover:text-neon-pink transition-colors"><XCircle className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <span className={cn(
                          "text-[8px] uppercase font-black tracking-tighter px-2 py-0.5 rounded",
                          expense.category === 'genuine' && "bg-neon-green text-black",
                          expense.category === 'avoidable' && "bg-neon-yellow text-black",
                          expense.category === 'unnecessary' && "bg-neon-pink text-white"
                        )}>
                          {expense.category}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredExpenses.length === 0 && (
              <div className="text-center py-12 text-white/20 uppercase font-bold tracking-widest border-2 border-dashed border-white/5 rounded-3xl">
                No Expenses Found
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Review Modal */}
      <AnimatePresence>
        {showReview && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div className="w-full max-w-md glass-card p-8 space-y-8 neon-shadow-pink">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Daily Review</h2>
                <button onClick={() => setShowReview(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>
              
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {expenses.filter(ex => ex.category === 'pending').map((ex) => (
                  <div key={ex.id} className="space-y-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xl font-bold">{ex.reason}</p>
                        <p className="text-sm text-white/40">₹{ex.amount}</p>
                      </div>
                      <p className="text-[10px] font-mono text-white/20">{format(ex.timestamp, 'hh:mm a')}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button 
                        onClick={() => updateCategory(ex.id, 'genuine')}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-neon-green/10 border border-neon-green/20 hover:bg-neon-green hover:text-black transition-all"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase">Genuine</span>
                      </button>
                      <button 
                        onClick={() => updateCategory(ex.id, 'avoidable')}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-neon-yellow/10 border border-neon-yellow/20 hover:bg-neon-yellow hover:text-black transition-all"
                      >
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase">Avoidable</span>
                      </button>
                      <button 
                        onClick={() => updateCategory(ex.id, 'unnecessary')}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-neon-pink/10 border border-neon-pink/20 hover:bg-neon-pink hover:text-white transition-all"
                      >
                        <XCircle className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase">Unnecessary</span>
                      </button>
                    </div>
                  </div>
                ))}
                {pendingCount === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-neon-green mx-auto mb-4" />
                    <p className="text-lg font-bold">All caught up!</p>
                    <p className="text-sm text-white/40">You've categorized all your expenses.</p>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setShowReview(false)}
                className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:scale-[1.02] transition-all"
              >
                DONE
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav - Paytm Style */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card rounded-b-none border-x-0 border-b-0 p-4">
        <div className="max-w-4xl mx-auto flex justify-around items-center">
          <button className="flex flex-col items-center gap-1 text-neon-green">
            <Wallet className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-colors">
            <TrendingUp className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase">Trends</span>
          </button>
          <div className="relative -top-8">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-16 h-16 bg-neon-green rounded-full flex items-center justify-center text-black neon-shadow-green hover:scale-110 active:scale-95 transition-all"
            >
              <Plus className="w-8 h-8" />
            </button>
          </div>
          <button className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-colors">
            <PieChartIcon className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase">Stats</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-colors">
            <History className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase">History</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
