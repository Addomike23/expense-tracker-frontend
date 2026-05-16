import React, { useState, useEffect } from "react";
import { getCategories, getBudgets, createBudget, updateBudget, deleteBudget } from "../services/api";
import { useCurrency } from "../context/CurrencyContext";
import { 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon, 
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
  TagIcon,
  FunnelIcon,
  ChevronDownIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from "@heroicons/react/24/outline";

function Categories() {
  const { formatAmount, symbol } = useCurrency();
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editBudget, setEditBudget] = useState("");
  const [period, setPeriod] = useState("month");
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBudget, setNewBudget] = useState({
    category: 'food',
    name: '',
    budget: '',
    alertThreshold: 80
  });
  const [creating, setCreating] = useState(false);

  const predefinedCategories = [
    { name: 'food', icon: '🍔', display: 'Food & Dining' },
    { name: 'transport', icon: '🚗', display: 'Transportation' },
    { name: 'entertainment', icon: '🎬', display: 'Entertainment' },
    { name: 'utilities', icon: '⚡', display: 'Utilities' },
    { name: 'shopping', icon: '🛍️', display: 'Shopping' },
    { name: 'health', icon: '🏥', display: 'Health & Medical' },
    { name: 'education', icon: '📚', display: 'Education' },
    { name: 'housing', icon: '🏠', display: 'Housing & Rent' },
    { name: 'income', icon: '💵', display: 'Income' },
    { name: 'other', icon: '💰', display: 'Other' }
  ];

  useEffect(() => {
    fetchCategories();
  }, [period]);

 const fetchCategories = async () => {
    setLoading(true);
    try {
        // Fetch BOTH categories AND budgets
        const [categoriesRes, budgetsRes] = await Promise.all([
            getCategories(period),
            getBudgets()  // ← ADD THIS
        ]);

        const categoryData = categoriesRes.data?.data || categoriesRes.data || [];
        const budgetData = budgetsRes.data?.data || budgetsRes.data || [];

        // Merge budget info into categories
        const merged = categoryData.map(cat => {
            const matchingBudget = budgetData.find(b => b.category === cat.name);
            return {
                ...cat,
                budget: matchingBudget ? {
                    id: matchingBudget._id,
                    amount: matchingBudget.budget,
                    spent: matchingBudget.spent,
                    remaining: matchingBudget.remaining,
                    percentage: matchingBudget.percentage,
                    status: matchingBudget.status,
                    alertThreshold: matchingBudget.alertThreshold
                } : null
            };
        });

        // Also add categories that have budgets but no transactions yet
        budgetData.forEach(b => {
            if (!merged.find(c => c.name === b.category)) {
                merged.push({
                    name: b.category,
                    display_name: b.name || b.category,
                    total_spent: 0,
                    transaction_count: 0,
                    budget: {
                        id: b._id,
                        amount: b.budget,
                        spent: b.spent || 0,
                        remaining: b.remaining || b.budget,
                        percentage: b.percentage || 0,
                        status: b.status || 'good',
                        alertThreshold: b.alertThreshold
                    }
                });
            }
        });

        setCategories(merged);
        setError(null);
    } catch (error) {
        setError(error.response?.data?.message || "Failed to load categories");
    } finally {
        setLoading(false);
    }
};

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    
    if (!newBudget.budget || parseFloat(newBudget.budget) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid budget amount' });
      return;
    }

    setCreating(true);
    setMessage({ type: '', text: '' });

    try {
      const categoryInfo = predefinedCategories.find(c => c.name === newBudget.category);
      
      const payload = {
        category: newBudget.category,
        name: newBudget.name.trim() || categoryInfo?.display || newBudget.category,
        budget: parseFloat(newBudget.budget),
        period: "monthly",
        alertThreshold: newBudget.alertThreshold
      };

      console.log('📤 Creating budget:', payload);  // Debug
      
      const response = await createBudget(payload);
      console.log('✅ Budget created:', response.data);

      setMessage({ type: 'success', text: 'Budget created!' });
      setShowCreateForm(false);
      setNewBudget({ category: 'food', name: '', budget: '', alertThreshold: 80 });
      fetchCategories();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Create budget error:', error.response?.data);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || error.response?.data?.message || 'Failed to create budget' 
      });
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (cat) => {
    setEditingId(cat.name || cat._id);
    setEditBudget(cat.budget?.amount || cat.budget || 0);
  };

  const handleSave = async (categoryName) => {
    try {
      const budgetAmount = parseFloat(editBudget);
      if (isNaN(budgetAmount) || budgetAmount <= 0) {
        setMessage({ type: 'error', text: 'Invalid budget amount' });
        return;
      }

      const existingBudget = categories.find(c => c.name === categoryName && c.budget?.id);

      if (existingBudget?.budget?.id) {
        await updateBudget(existingBudget.budget.id, { budget: budgetAmount });
      } else {
        const categoryInfo = predefinedCategories.find(c => c.name === categoryName.toLowerCase());
        await createBudget({ 
          category: categoryName.toLowerCase(), 
          name: categoryInfo?.display || categoryName, 
          budget: budgetAmount, 
          period: "monthly", 
          alertThreshold: 80 
        });
      }

      setEditingId(null);
      setMessage({ type: 'success', text: 'Budget updated!' });
      fetchCategories();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Save budget error:', error.response?.data);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || error.response?.data?.message || 'Failed to update' 
      });
    }
  };

  const handleDelete = async (budgetId) => {
    if (!window.confirm("Delete this budget?")) return;
    try {
      await deleteBudget(budgetId);
      setMessage({ type: 'success', text: 'Budget deleted' });
      fetchCategories();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Delete budget error:', error.response?.data);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to delete' });
    }
  };

  const getCategoryIcon = (name) => predefinedCategories.find(c => c.name === name)?.icon || '💰';
  const getStatusColor = (cat) => {
    const status = cat.budget?.status;
    if (status === 'exceeded') return 'bg-red-500';
    if (status === 'warning') return 'bg-yellow-500';
    return 'bg-emerald-500';
  };
  const getSpent = (cat) => cat.budget?.spent || cat.spent || cat.total_spent || 0;
  const getBudget = (cat) => cat.budget?.amount || cat.budget || 0;
  const getPercentage = (cat) => cat.budget?.percentage || cat.percentage || 0;
  const getRemaining = (cat) => cat.budget?.remaining || cat.remaining || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-2 border-yellow-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-400">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Categories</h1>
            <p className="text-gray-400 mt-1">Manage your spending categories and budgets</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <select value={period} onChange={(e) => setPeriod(e.target.value)} className="pl-9 pr-8 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-500/50 appearance-none cursor-pointer">
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">This Year</option>
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
            <button onClick={() => { setShowCreateForm(!showCreateForm); setMessage({ type: '', text: '' }); }} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-400 hover:to-orange-400 transition-all shadow-lg shadow-yellow-500/25 whitespace-nowrap">
              <PlusIcon className="h-5 w-5" />New Budget
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-xl backdrop-blur-sm animate-slideDown ${message.type === 'success' ? 'bg-emerald-900/30 border border-emerald-500/50' : 'bg-red-900/30 border border-red-500/50'}`}>
          <div className="flex items-center gap-3">
            {message.type === 'success' ? <CheckIcon className="h-5 w-5 text-emerald-400 flex-shrink-0" /> : <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />}
            <p className={`text-sm ${message.type === 'success' ? 'text-emerald-200' : 'text-red-200'}`}>{message.text}</p>
          </div>
        </div>
      )}

      {/* Create Budget Form */}
      {showCreateForm && (
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6 mb-8 animate-slideDown">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2"><PlusIcon className="h-5 w-5 text-yellow-400" />Create New Budget</h3>
            <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-700"><XMarkIcon className="h-5 w-5" /></button>
          </div>
          <form onSubmit={handleCreateBudget}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select value={newBudget.category} onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })} className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500/50">
                  {predefinedCategories.map(cat => (<option key={cat.name} value={cat.name}>{cat.icon} {cat.display}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name (optional)</label>
                <input type="text" value={newBudget.name} onChange={(e) => setNewBudget({ ...newBudget, name: e.target.value })} placeholder={predefinedCategories.find(c => c.name === newBudget.category)?.display} className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Budget ({symbol})</label>
                <input type="number" step="0.01" min="1" required value={newBudget.budget} onChange={(e) => setNewBudget({ ...newBudget, budget: e.target.value })} placeholder="0.00" className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Alert at {newBudget.alertThreshold}%</label>
                <input type="range" min="50" max="100" step="5" value={newBudget.alertThreshold} onChange={(e) => setNewBudget({ ...newBudget, alertThreshold: parseInt(e.target.value) })} className="w-full accent-yellow-500 mt-3" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={creating} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-400 hover:to-orange-400 disabled:opacity-60 transition-all shadow-lg shadow-yellow-500/25">{creating ? 'Creating...' : 'Create Budget'}</button>
              <button type="button" onClick={() => setShowCreateForm(false)} className="px-6 py-3 bg-gray-700 text-gray-300 rounded-xl font-semibold hover:bg-gray-600 transition-all">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-6 text-center mb-6">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-300 mb-4">{error}</p>
          <button onClick={fetchCategories} className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all">Retry</button>
        </div>
      )}

      {/* Categories Grid — EXACTLY THE SAME AS YOUR ORIGINAL, no changes to JSX below */}
      {!error && categories.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {categories.map((cat) => {
            const spent = getSpent(cat);
            const budget = getBudget(cat);
            const percentage = getPercentage(cat);
            const remaining = getRemaining(cat);
            const status = cat.budget?.status;

            return (
              <div key={cat.name || cat._id} className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getCategoryIcon(cat.name)}</span>
                    <div className="min-w-0">
                      <h3 className="text-white font-semibold capitalize truncate">{cat.display_name || cat.name}</h3>
                      {editingId === (cat.name || cat._id) ? (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{symbol}</span>
                            <input type="number" value={editBudget} onChange={(e) => setEditBudget(e.target.value)} className="w-24 pl-7 pr-2 py-1.5 bg-gray-900/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500/50" autoFocus />
                          </div>
                          <button onClick={() => handleSave(cat.name)} className="text-emerald-400 hover:text-emerald-300 p-1"><CheckIcon className="h-4 w-4" /></button>
                          <button onClick={() => setEditingId(null)} className="text-red-400 hover:text-red-300 p-1"><XMarkIcon className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm mt-1">Budget: <span className="text-white font-medium">{formatAmount(budget)}</span></p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(cat)} className="text-gray-400 hover:text-yellow-400 p-1.5 rounded-lg hover:bg-gray-700"><PencilIcon className="h-4 w-4" /></button>
                    {cat.budget?.id && <button onClick={() => handleDelete(cat.budget.id)} className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-gray-700"><TrashIcon className="h-4 w-4" /></button>}
                  </div>
                </div>

                {cat.transaction_count > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <TagIcon className="h-3.5 w-3.5" />
                    <span>{cat.transaction_count} transaction{cat.transaction_count !== 1 ? 's' : ''}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Spent</span>
                    <span className="text-white font-medium">{formatAmount(spent)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${getStatusColor(cat)}`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={status === 'exceeded' ? 'text-red-400' : 'text-gray-500'}>{percentage.toFixed(1)}% used</span>
                    <span className={status === 'exceeded' ? 'text-red-400' : status === 'warning' ? 'text-yellow-400' : 'text-emerald-400'}>
                      {formatAmount(Math.abs(remaining))} {remaining < 0 ? 'over' : 'left'}
                    </span>
                  </div>
                </div>

                {status && (
                  <div className={`mt-4 px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
                    status === 'exceeded' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    status === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {status === 'exceeded' ? <ArrowTrendingUpIcon className="h-3.5 w-3.5" /> : status === 'warning' ? <ExclamationTriangleIcon className="h-3.5 w-3.5" /> : <CheckIcon className="h-3.5 w-3.5" />}
                    {status === 'exceeded' ? 'Over Budget' : status === 'warning' ? 'Approaching Limit' : 'On Track'}
                  </div>
                )}
                {!cat.budget && (
                  <button onClick={() => handleEdit(cat)} className="mt-4 w-full py-2 text-sm text-gray-400 hover:text-yellow-400 border border-dashed border-gray-700 hover:border-yellow-500/50 rounded-xl transition-all">+ Set Budget</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!error && !loading && categories.length === 0 && (
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-16 text-center">
          <div className="w-20 h-20 bg-gray-700/50 rounded-2xl flex items-center justify-center mx-auto mb-6"><TagIcon className="h-10 w-10 text-gray-500" /></div>
          <h3 className="text-xl font-semibold text-white mb-2">No Categories Yet</h3>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">Add transactions to see your spending categories, or create a budget to start tracking.</p>
          <button onClick={() => setShowCreateForm(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-400 hover:to-orange-400 transition-all shadow-lg shadow-yellow-500/25">
            <PlusIcon className="h-5 w-5" />Create Your First Budget
          </button>
        </div>
      )}

      <style>{`@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } } .animate-slideDown { animation: slideDown 0.3s ease-out; }`}</style>
    </div>
  );
}

export default Categories;