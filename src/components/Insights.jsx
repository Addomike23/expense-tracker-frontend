import React, { useState, useEffect } from "react";
import { getTransactions, getDashboardData, getAnomalySummary, getSavingsPotential } from "../services/api";
import {
  LightBulbIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  ShieldExclamationIcon,
  BanknotesIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  FireIcon,
  TrophyIcon,
  ClockIcon
} from "@heroicons/react/24/outline";

function Insights() {
  const [insights, setInsights] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [anomalies, setAnomalies] = useState(null);
  const [savings, setSavings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    generateInsights();
  }, []);

  const generateInsights = async () => {
    try {
      const [transactionsRes, dashboardRes, anomalyRes, savingsRes] = await Promise.allSettled([
        getTransactions({ limit: 100, sort: '-date' }),
        getDashboardData(),
        getAnomalySummary(),
        getSavingsPotential()
      ]);

      const transactionsData = transactionsRes.status === 'fulfilled' 
        ? (transactionsRes.value.data?.data || transactionsRes.value.data || []) 
        : [];
      
      const dashboardData = dashboardRes.status === 'fulfilled' 
        ? (dashboardRes.value.data?.data || dashboardRes.value.data) 
        : null;

      const anomalyData = anomalyRes.status === 'fulfilled' 
        ? (anomalyRes.value.data?.data || anomalyRes.value.data) 
        : null;

      const savingsData = savingsRes.status === 'fulfilled' 
        ? (savingsRes.value.data?.data || savingsRes.value.data) 
        : null;

      setAnomalies(anomalyData);
      setSavings(savingsData);

      // ===== AI INSIGHTS FROM BACKEND =====
      const dashboardInsights = dashboardData?.insights || [];
      const formattedAiInsights = dashboardInsights.map(insight => ({
        ...insight,
        title: insight.type === 'danger' ? 'Critical Alert' : 
               insight.type === 'warning' ? 'Heads Up' : 
               insight.type === 'success' ? 'Great Job!' : 'Did You Know?',
        description: insight.message,
        type: insight.type || 'info'
      }));
      setAiInsights(formattedAiInsights);

      // ===== STATISTICAL INSIGHTS =====
      const insightsList = [];
      const transactions = transactionsData;
      const expenses = transactions.filter(t => t.type === 'expense');
      const income = transactions.filter(t => t.type === 'income');

      if (transactions.length === 0) {
        insightsList.push({
          type: 'empty',
          title: "Welcome to AI Insights",
          description: "Start adding transactions to unlock powerful spending analysis and predictions.",
          icon: SparklesIcon,
          color: 'yellow'
        });
      } else {
        const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
        const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
        const balance = totalIncome - totalSpent;

        // Balance Card
        insightsList.push({
          type: balance >= 0 ? 'success' : 'danger',
          title: "Financial Health",
          description: balance >= 0 
            ? `You're in the green with a $${balance.toFixed(2)} surplus. Keep up the great work!`
            : `You're $${Math.abs(balance).toFixed(2)} in the red. Time to review your expenses.`,
          value: `$${Math.abs(balance).toFixed(2)}`,
          trend: balance >= 0 ? 'up' : 'down',
          icon: BanknotesIcon,
          color: balance >= 0 ? 'emerald' : 'red'
        });

        // Savings Rate
        if (totalIncome > 0) {
          const savingsRate = ((totalIncome - totalSpent) / totalIncome * 100);
          insightsList.push({
            type: savingsRate >= 20 ? 'success' : savingsRate >= 10 ? 'warning' : 'danger',
            title: "Savings Rate",
            description: savingsRate >= 20 
              ? "Excellent savings discipline! You're building a secure future."
              : savingsRate >= 10
                ? "You're saving, but there's room for improvement."
                : "Your savings rate needs attention. Try the 50/30/20 rule.",
            value: `${savingsRate.toFixed(1)}%`,
            target: '20%',
            icon: TrophyIcon,
            color: savingsRate >= 20 ? 'emerald' : savingsRate >= 10 ? 'yellow' : 'red'
          });
        }

        // Average Transaction
        if (expenses.length > 0) {
          const avgExpense = totalSpent / expenses.length;
          insightsList.push({
            type: 'info',
            title: "Spending Pattern",
            description: `You've made ${expenses.length} transactions averaging $${avgExpense.toFixed(2)} each.`,
            value: `$${avgExpense.toFixed(2)}`,
            subtitle: `${expenses.length} transactions`,
            icon: ChartBarIcon,
            color: 'blue'
          });
        }

        // Largest Expense
        const sortedExpenses = [...expenses].sort((a, b) => b.amount - a.amount);
        if (sortedExpenses.length > 0) {
          const largest = sortedExpenses[0];
          insightsList.push({
            type: 'warning',
            title: "Largest Expense",
            description: `$${largest.amount.toFixed(2)} on ${largest.category}${largest.description ? ` - ${largest.description}` : ''}`,
            value: `$${largest.amount.toFixed(2)}`,
            subtitle: largest.category,
            icon: FireIcon,
            color: 'orange'
          });
        }

        // Top Category
        const categoryTotals = {};
        expenses.forEach(t => {
          categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });
        const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
        if (sortedCategories.length > 0) {
          const [topCat, topAmount] = sortedCategories[0];
          const topPercentage = ((topAmount / totalSpent) * 100);
          insightsList.push({
            type: 'info',
            title: "Top Spending Category",
            description: `${topCat} consumes ${topPercentage.toFixed(1)}% of your budget.`,
            value: `$${topAmount.toFixed(2)}`,
            subtitle: `${topPercentage.toFixed(1)}% of total`,
            icon: ChartBarIcon,
            color: 'purple'
          });
        }

        // Prediction
        const prediction = dashboardData?.predictions?.next_month_spending;
        if (prediction) {
          insightsList.push({
            type: prediction.trend === 'increasing' ? 'warning' : 'success',
            title: "Next Month Forecast",
            description: `Predicted spending: $${prediction.prediction?.toFixed(2) || '0.00'} (${prediction.trend || 'stable'} trend)`,
            value: `$${prediction.prediction?.toFixed(2) || '0.00'}`,
            subtitle: `${prediction.confidence || 'medium'} confidence`,
            icon: ClockIcon,
            color: prediction.trend === 'increasing' ? 'yellow' : 'emerald'
          });
        }

        // Anomalies
        if (anomalyData?.total_anomalies > 0) {
          insightsList.push({
            type: 'danger',
            title: "Anomalies Detected",
            description: `${anomalyData.total_anomalies} unusual transaction(s) found. Review them for accuracy.`,
            value: anomalyData.total_anomalies,
            subtitle: 'unusual transactions',
            icon: ShieldExclamationIcon,
            color: 'red'
          });
        }

        // Savings Potential
        if (savingsData) {
          insightsList.push({
            type: 'success',
            title: "Savings Opportunity",
            description: savingsData.recommendation || `You could save up to $${savingsData.savings_potential?.toFixed(2) || '0.00'} this month.`,
            value: `$${savingsData.savings_potential?.toFixed(2) || '0.00'}`,
            subtitle: 'potential savings',
            icon: ArrowTrendingUpIcon,
            color: 'emerald'
          });
        }
      }

      setInsights(insightsList);
      setError(null);
    } catch (error) {
      
      setError("Failed to generate insights");
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', icon: 'text-emerald-400', glow: 'shadow-emerald-500/10' },
      red: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', icon: 'text-red-400', glow: 'shadow-red-500/10' },
      yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', icon: 'text-yellow-400', glow: 'shadow-yellow-500/10' },
      blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', icon: 'text-blue-400', glow: 'shadow-blue-500/10' },
      purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', icon: 'text-purple-400', glow: 'shadow-purple-500/10' },
      orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', icon: 'text-orange-400', glow: 'shadow-orange-500/10' },
    };
    return colors[color] || colors.blue;
  };

  const getTypeBadge = (type) => {
    const badges = {
      danger: 'bg-red-500/20 text-red-400 border-red-500/30',
      warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
    return badges[type] || badges.info;
  };

  const tabs = [
    { id: 'all', label: 'All Insights' },
    { id: 'danger', label: 'Alerts' },
    { id: 'warning', label: 'Warnings' },
    { id: 'success', label: 'Positive' },
  ];

  const filteredInsights = activeTab === 'all' 
    ? insights 
    : insights.filter(i => i.type === activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative mx-auto mb-6 w-20 h-20">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl animate-pulse"></div>
            <div className="absolute inset-2 bg-[#0F172A] rounded-xl flex items-center justify-center">
              <SparklesIcon className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          <p className="text-gray-400 text-lg">Analyzing your finances...</p>
          <p className="text-gray-600 text-sm mt-2">Crunching numbers with AI</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <SparklesIcon className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">AI Insights</h1>
        </div>
        <p className="text-gray-400 ml-13">Machine learning-powered analysis of your spending habits</p>
      </div>

      {/* AI Alerts Banner */}
      {aiInsights.filter(i => i.type === 'danger' || i.type === 'warning').length > 0 && (
        <div className="mb-8 space-y-3">
          {aiInsights.filter(i => i.type === 'danger' || i.type === 'warning').slice(0, 3).map((insight, index) => (
            <div key={`alert-${index}`} className={`p-4 rounded-2xl border backdrop-blur-xl flex items-start gap-4 ${
              insight.type === 'danger' 
                ? 'bg-red-500/5 border-red-500/20' 
                : 'bg-yellow-500/5 border-yellow-500/20'
            }`}>
              <div className={`p-2 rounded-xl ${
                insight.type === 'danger' ? 'bg-red-500/10' : 'bg-yellow-500/10'
              }`}>
                <ExclamationTriangleIcon className={`h-5 w-5 ${
                  insight.type === 'danger' ? 'text-red-400' : 'text-yellow-400'
                }`} />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{insight.title}</p>
                <p className="text-gray-400 text-sm mt-0.5">{insight.description}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getTypeBadge(insight.type)}`}>
                {insight.type === 'danger' ? 'Action Needed' : 'Review'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tab Filter */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-700/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Insights Grid */}
      {filteredInsights.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredInsights.map((insight, index) => {
            const Icon = insight.icon;
            const colors = getColorClasses(insight.color);

            return (
              <div
                key={index}
                className={`${colors.bg} backdrop-blur-xl rounded-2xl border ${colors.border} p-6 hover:shadow-lg ${colors.glow} transition-all duration-300 group`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${colors.bg} border ${colors.border}`}>
                    <Icon className={`h-6 w-6 ${colors.icon}`} />
                  </div>
                  {insight.type && (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getTypeBadge(insight.type)}`}>
                      {insight.type === 'danger' ? 'Alert' : 
                       insight.type === 'warning' ? 'Notice' : 
                       insight.type === 'success' ? 'Positive' : 'Info'}
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <h3 className="text-white font-semibold text-lg mb-2">{insight.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{insight.description}</p>

                {/* Card Footer */}
                {insight.value && (
                  <div className="flex items-end justify-between pt-4 border-t border-white/5">
                    <div>
                      <p className={`text-2xl font-bold ${colors.text}`}>{insight.value}</p>
                      {insight.subtitle && (
                        <p className="text-xs text-gray-500 mt-1">{insight.subtitle}</p>
                      )}
                    </div>
                    {insight.trend && (
                      <span className={`p-1.5 rounded-lg ${insight.trend === 'up' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                        {insight.trend === 'up' ? (
                          <ArrowTrendingUpIcon className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <ArrowTrendingDownIcon className="h-5 w-5 text-red-400" />
                        )}
                      </span>
                    )}
                    {insight.target && (
                      <span className="text-xs text-gray-500">
                        Target: <span className="text-white font-medium">{insight.target}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-gray-800/30 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-yellow-500/20">
            <LightBulbIcon className="h-12 w-12 text-yellow-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">No Insights Yet</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-8">
            Add your first transactions to unlock AI-powered spending analysis, anomaly detection, and budget predictions.
          </p>
          <button
            onClick={generateInsights}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-400 hover:to-orange-400 transition-all shadow-lg shadow-yellow-500/25"
          >
            <ArrowPathIcon className="h-5 w-5" />
            Refresh Insights
          </button>
        </div>
      )}

      {/* Quick Tips Footer */}
      <div className="mt-12 bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <LightBulbIcon className="h-5 w-5 text-yellow-400" />
          Pro Tips
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: '💰', title: 'Set Budgets', desc: 'Create monthly budgets for each category' },
            { icon: '📊', title: 'Review Weekly', desc: 'Check transactions weekly to catch anomalies' },
            { icon: '🎯', title: 'Save 20%', desc: 'Aim to save at least 20% of your income' },
            { icon: '🤖', title: 'Trust AI', desc: 'Use predictions to plan next month\'s budget' },
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <span className="text-2xl">{tip.icon}</span>
              <div>
                <p className="text-white text-sm font-medium">{tip.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Insights;