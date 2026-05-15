import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addTransaction, getTransactions, updateTransaction } from "../services/api";
import { useCurrency } from "../context/CurrencyContext";
import { 
  ArrowLeftIcon,
  CurrencyDollarIcon,
  TagIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  MapPinIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  BanknotesIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

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
  { name: 'other', icon: '💰', display: 'Other' },
];

function AddTransaction() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { symbol } = useCurrency();  // ← Get currency symbol from context

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    type: "expense",
    paymentMethod: "cash",
    location: "",
    notes: ""
  });

  useEffect(() => {
    if (isEditing) loadTransaction();
  }, [id]);

  const loadTransaction = async () => {
    try {
      const response = await getTransactions();
      const transactions = response.data?.data || response.data || [];
      const transaction = transactions.find(t => (t._id || t.id) === id);
      if (transaction) {
        setFormData({
          amount: transaction.amount?.toString() || "",
          category: transaction.category || "",
          description: transaction.description || "",
          date: new Date(transaction.date).toISOString().split("T")[0],
          type: transaction.type || "expense",
          paymentMethod: transaction.paymentMethod || "cash",
          location: transaction.location || "",
          notes: transaction.notes || ""
        });
      }
    } catch (error) {
      console.error("Failed to load transaction:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!formData.amount || !formData.category) {
      setMessage({ type: 'error', text: 'Amount and category are required' });
      return;
    }
    if (parseFloat(formData.amount) <= 0) {
      setMessage({ type: 'error', text: 'Amount must be greater than zero' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        amount: parseFloat(formData.amount),
        category: formData.category.toLowerCase(),
        description: formData.description,
        date: formData.date,
        type: formData.type,
        paymentMethod: formData.paymentMethod,
        location: formData.location,
        notes: formData.notes,
        tags: [formData.category.toLowerCase()]
      };

      let response;
      if (isEditing) {
        response = await updateTransaction(id, payload);
      } else {
        response = await addTransaction(payload);
      }

      if (response.data?.success) {
        setMessage({ type: 'success', text: isEditing ? 'Transaction updated!' : 'Transaction added!' });
        setTimeout(() => navigate("/transactions"), 800);
      } else {
        throw new Error(response.data?.message || 'Failed');
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.response?.data?.error || 'Failed to save transaction' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (name) => predefinedCategories.find(c => c.name === name)?.icon || '💰';

  const inputClasses = "w-full pl-12 pr-4 py-3.5 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-300";
  const labelClasses = "block text-sm font-medium text-gray-300 mb-2";
  const iconClasses = "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none";

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors group"
        >
          <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Back</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
            {formData.type === 'income' ? (
              <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
            ) : (
              <ArrowTrendingDownIcon className="h-6 w-6 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {isEditing ? 'Edit Transaction' : 'Add Transaction'}
            </h1>
            <p className="text-gray-400 mt-1">
              {isEditing ? 'Update transaction details' : 'Record a new income or expense'}
            </p>
          </div>
        </div>
      </div>

      {/* Toast Message */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-xl backdrop-blur-sm animate-slideDown ${
          message.type === 'success' 
            ? 'bg-emerald-900/30 border border-emerald-500/50' 
            : 'bg-red-900/30 border border-red-500/50'
        }`}>
          <div className="flex items-center gap-3">
            {message.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-red-400" />
            )}
            <p className={`text-sm ${message.type === 'success' ? 'text-emerald-200' : 'text-red-200'}`}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>
        
        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Transaction Type Toggle */}
            <div>
              <label className={labelClasses}>Transaction Type</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                    formData.type === 'expense'
                      ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-lg shadow-red-500/10'
                      : 'bg-gray-900/50 border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
                  }`}
                >
                  <ArrowTrendingDownIcon className="h-5 w-5" />
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                    formData.type === 'income'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10'
                      : 'bg-gray-900/50 border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
                  }`}
                >
                  <ArrowTrendingUpIcon className="h-5 w-5" />
                  Income
                </button>
              </div>
            </div>

            {/* Amount - Now uses currency symbol */}
            <div>
              <label className={labelClasses}>
                Amount <span className="text-red-400">*</span>
              </label>
              <div className="relative group">
                <div className={iconClasses}>
                  <span className={`text-lg font-medium ${formData.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {symbol}
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className={`${inputClasses} pl-12`}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Category - unchanged */}
            <div>
              <label className={labelClasses}>
                Category <span className="text-red-400">*</span>
              </label>
              <div className="relative group">
                <div className={iconClasses}>
                  <TagIcon className="h-5 w-5 text-gray-500 group-focus-within:text-yellow-400 transition-colors" />
                </div>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className={`${inputClasses} appearance-none cursor-pointer`}
                >
                  <option value="" className="bg-gray-900">Select a category</option>
                  {predefinedCategories.map((cat) => (
                    <option key={cat.name} value={cat.name} className="bg-gray-900">
                      {cat.icon} {cat.display}
                    </option>
                  ))}
                </select>
              </div>
              {formData.category && (
                <p className="mt-2 text-sm text-gray-400 flex items-center gap-2">
                  <span className="text-xl">{getCategoryIcon(formData.category)}</span>
                  {predefinedCategories.find(c => c.name === formData.category)?.display}
                </p>
              )}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Description */}
              <div>
                <label className={labelClasses}>Description</label>
                <div className="relative group">
                  <div className={iconClasses}>
                    <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className={inputClasses}
                    placeholder="e.g. Grocery shopping"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className={labelClasses}>Date</label>
                <div className="relative group">
                  <div className={iconClasses}>
                    <CalendarDaysIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className={inputClasses}
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className={labelClasses}>Payment Method</label>
                <div className="relative group">
                  <div className={iconClasses}>
                    <CreditCardIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    className={`${inputClasses} appearance-none cursor-pointer`}
                  >
                    <option value="cash" className="bg-gray-900">💵 Cash</option>
                    <option value="debit_card" className="bg-gray-900">💳 Debit Card</option>
                    <option value="credit_card" className="bg-gray-900">💳 Credit Card</option>
                    <option value="bank_transfer" className="bg-gray-900">🏦 Bank Transfer</option>
                    <option value="mobile_money" className="bg-gray-900">📱 Mobile Money</option>
                    <option value="other" className="bg-gray-900">📌 Other</option>
                  </select>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className={labelClasses}>Location</label>
                <div className="relative group">
                  <div className={iconClasses}>
                    <MapPinIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className={inputClasses}
                    placeholder="e.g. Walmart, Amazon"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={labelClasses}>Notes</label>
              <div className="relative group">
                <div className="absolute top-3 left-0 pl-4 pointer-events-none">
                  <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                </div>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                  className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 transition-all resize-none"
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-400 hover:to-orange-400 disabled:opacity-60 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.99] shadow-lg shadow-yellow-500/25"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>{isEditing ? 'Updating...' : 'Adding...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5" />
                    <span>{isEditing ? 'Update Transaction' : 'Add Transaction'}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate("/transactions")}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl font-semibold transition-all"
              >
                <XCircleIcon className="h-5 w-5" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
      `}</style>
    </div>
  );
}

export default AddTransaction;