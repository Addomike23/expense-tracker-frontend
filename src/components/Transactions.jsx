import React, { useState, useEffect } from "react";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationCircleIcon,
  CalendarDaysIcon,
  TagIcon,
  CreditCardIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";
import { getTransactions, deleteTransaction } from "../services/api";
import { Link } from "react-router-dom";

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, filter, sortBy, sortOrder]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await getTransactions({
        page: currentPage,
        limit: 20,
        sort: `${sortOrder === 'desc' ? '-' : ''}${sortBy}`,
        type: filter !== 'all' ? filter : undefined,
        search: search || undefined
      });

      // Backend returns: { success: true, data: [...], count, total, page, pages }
      const data = response.data?.data || response.data || [];
      setTransactions(Array.isArray(data) ? data : []);
      setTotalPages(response.data?.pages || 1);
      setTotalCount(response.data?.total || data.length);
      setError(null);
    } catch (error) {
      
      setError(error.response?.data?.message || "Failed to load transactions");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchTransactions();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction? This cannot be undone.")) return;

    setDeleting(id);
    try {
      await deleteTransaction(id);
      fetchTransactions();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete transaction");
    } finally {
      setDeleting(null);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatAmount = (amount, type) => {
    const prefix = type === 'income' ? '+' : '-';
    return `${prefix}$${Math.abs(amount).toFixed(2)}`;
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'desc' ? 
      <ArrowDownIcon className="h-4 w-4" /> : 
      <ArrowUpIcon className="h-4 w-4" />;
  };

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Transactions</h1>
            <p className="text-gray-400 mt-1">Manage your income and expenses</p>
          </div>
          <Link
            to="/add"
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-400 hover:to-orange-400 transition-all duration-300 shadow-lg shadow-yellow-500/25 transform hover:scale-[1.02]"
          >
            <PlusIcon className="h-5 w-5" />
            Add Transaction
          </Link>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 bg-red-900/30 border border-red-500/50 rounded-xl p-4 animate-slideDown">
          <div className="flex items-center gap-3">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
            <p className="text-sm text-red-200">{error}</p>
            <button
              onClick={fetchTransactions}
              className="ml-auto text-sm text-red-300 hover:text-red-100 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50">
          <p className="text-xs text-gray-500 mb-1">Total Count</p>
          <p className="text-xl font-bold text-white">{totalCount}</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50">
          <p className="text-xs text-gray-500 mb-1">Income</p>
          <p className="text-xl font-bold text-emerald-400">+${totalIncome.toFixed(2)}</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50">
          <p className="text-xs text-gray-500 mb-1">Expenses</p>
          <p className="text-xl font-bold text-red-400">-${totalExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700/50">
          <p className="text-xs text-gray-500 mb-1">Balance</p>
          <p className={`text-xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ${(totalIncome - totalExpenses).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 mb-6 border border-gray-700/50">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <form onSubmit={handleSearch} className="relative flex-1 md:w-64">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 transition-all"
              />
            </form>
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
                className="pl-9 pr-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500/50 transition-all appearance-none"
              >
                <option value="all">All Types</option>
                <option value="income">Income Only</option>
                <option value="expense">Expenses Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th
                  className="text-left py-4 px-6 text-sm font-medium text-gray-400 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4" />
                    Date
                    {getSortIcon('date')}
                  </div>
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">
                  <div className="flex items-center gap-2">
                    <TagIcon className="h-4 w-4" />
                    Description
                  </div>
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Category</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">
                  <div className="flex items-center gap-2">
                    <CreditCardIcon className="h-4 w-4" />
                    Payment
                  </div>
                </th>
                <th
                  className="text-right py-4 px-6 text-sm font-medium text-gray-400 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Amount
                    {getSortIcon('amount')}
                  </div>
                </th>
                <th className="text-center py-4 px-6 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {transactions.length > 0 ? (
                transactions.map((t) => (
                  <tr
                    key={t._id || t.id}
                    className="hover:bg-gray-700/30 transition-all duration-200 group"
                  >
                    <td className="py-4 px-6">
                      <p className="text-sm text-gray-300">{formatDate(t.date)}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-white font-medium">
                        {t.description || t.category || 'No description'}
                      </p>
                      {t.location && (
                        <p className="text-xs text-gray-500 mt-0.5">{t.location}</p>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 bg-yellow-500/10 text-yellow-400 rounded-full text-xs font-medium border border-yellow-500/20 capitalize">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs text-gray-400 capitalize">
                        {t.paymentMethod?.replace('_', ' ') || 'Cash'}
                      </span>
                    </td>
                    <td className={`py-4 px-6 text-right font-semibold text-sm ${
                      t.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {formatAmount(t.amount, t.type)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          to={`/edit/${t._id || t.id}`}
                          className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(t._id || t.id)}
                          disabled={deleting === (t._id || t.id)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete"
                        >
                          {deleting === (t._id || t.id) ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent"></div>
                          ) : (
                            <TrashIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <CreditCardIcon className="h-12 w-12 text-gray-600" />
                      <p className="text-gray-500 text-lg">No transactions found</p>
                      <Link
                        to="/add"
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-medium hover:from-yellow-400 hover:to-orange-400 transition-all"
                      >
                        <PlusIcon className="h-5 w-5" />
                        Add your first transaction
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Page {currentPage} of {totalPages} ({totalCount} transactions)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                      currentPage === pageNum
                        ? 'bg-yellow-500 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Transactions;