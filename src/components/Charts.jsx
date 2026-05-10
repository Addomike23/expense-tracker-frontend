import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

const COLORS = [
  "#10B981",
  "#3B82F6",
  "#F59E0B",
  "#8B5CF6",
  "#EF4444",
  "#64748B",
  "#FACC15",
  "#EC4899",
  "#14B8A6",
  "#F97316",
];

function Charts({ data, type = "all" }) {
  if (!data) return null;

  // ===== PIE CHART DATA =====
  // category_breakdown is an array: [{ category, total, count }]
  const categoryBreakdown = data.category_breakdown || [];
  const pieData = categoryBreakdown.map((item) => ({
    name: item.category,
    value: item.total,
    count: item.count,
  }));

  // ===== DAILY/MONTHLY SPENDING DATA =====
  // monthly_summary: [{ month, income, expenses, savings, count }]
  const monthlyData = data.monthly_summary || [];
  
  // Format for chart
  const dailyData = monthlyData.map((m) => ({
    date: m.month,
    amount: m.expenses,
    income: m.income,
    savings: m.savings,
  }));

  // ===== PREDICTIONS DATA =====
  // predictions: { next_month_spending: { prediction, confidence, trend }, category_predictions: {...} }
  const predictions = data.predictions || {};
  const predictionData = predictions.category_predictions
    ? Object.entries(predictions.category_predictions).map(([category, pred]) => ({
        category,
        predicted: pred.predicted_amount || pred.predicted || 0,
        confidence: pred.confidence || 'low',
        trend: pred.trend || 'stable',
      }))
    : [];

  // ===== BUDGET COMPARISON DATA =====
  // budget_status: [{ category, budget, spent, remaining, percentage, status }]
  const budgetData = data.budget_status || [];
  const budgetComparisonData = budgetData.map((b) => ({
    category: b.category,
    budget: b.budget,
    spent: b.spent,
    remaining: b.remaining,
  }));

  // ===== TOP CATEGORIES =====
  const topCategories = data.top_categories || [];

  // ===== ANOMALIES =====
  const anomalies = data.anomalies || {};
  const anomalyCount = anomalies.total_anomalies || 0;

  /**
   * Pie Chart - Spending by Category
   */
  const renderCategoryPie = () => (
    <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100 h-[420px]">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Spending by Category
      </h3>
      {pieData.length > 0 ? (
        <ResponsiveContainer width="100%" height="85%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `$${value.toFixed(2)}`}
              labelFormatter={(name) => name.charAt(0).toUpperCase() + name.slice(1)}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[85%] text-gray-400">
          No spending data yet
        </div>
      )}
    </div>
  );

  /**
   * Monthly Spending Chart
   */
  const renderMonthlySpending = () => (
    <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100 h-[420px]">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Monthly Spending Trend
      </h3>
      {dailyData.length > 0 ? (
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip
              formatter={(value) => `$${Number(value).toFixed(2)}`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="#EF4444"
              fill="#FEE2E2"
              name="Expenses"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#10B981"
              fill="#D1FAE5"
              name="Income"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="savings"
              stroke="#3B82F6"
              fill="#DBEAFE"
              name="Savings"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[85%] text-gray-400">
          No monthly data yet
        </div>
      )}
    </div>
  );

  /**
   * Predictions Chart
   */
  const renderPredictions = () => (
    <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100 h-[420px]">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Next Month Spending Predictions
      </h3>
      {predictions.next_month_spending && (
        <p className="text-sm text-gray-500 mb-4">
          Predicted: ${predictions.next_month_spending.prediction?.toFixed(2) || '0.00'} 
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
            predictions.next_month_spending.trend === 'increasing' 
              ? 'bg-red-100 text-red-700' 
              : predictions.next_month_spending.trend === 'decreasing'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {predictions.next_month_spending.trend || 'stable'}
          </span>
        </p>
      )}
      {predictionData.length > 0 ? (
        <ResponsiveContainer width="100%" height="75%">
          <BarChart data={predictionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="category" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip
              formatter={(value) => `$${Number(value).toFixed(2)}`}
            />
            <Legend />
            <Bar
              dataKey="predicted"
              fill="#8B5CF6"
              name="Predicted Spending"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[75%] text-gray-400">
          Need more data for predictions
        </div>
      )}
    </div>
  );

  /**
   * Budget vs Actual Chart
   */
  const renderBudgetComparison = () => (
    <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100 h-[420px]">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Budget vs Actual
      </h3>
      {budgetComparisonData.length > 0 ? (
        <ResponsiveContainer width="100%" height="85%">
          <BarChart
            data={budgetComparisonData}
            layout="horizontal"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="category" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip
              formatter={(value) => `$${Number(value).toFixed(2)}`}
            />
            <Legend />
            <Bar
              dataKey="budget"
              fill="#3B82F6"
              name="Budget"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="spent"
              fill="#EF4444"
              name="Spent"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[85%] text-gray-400">
          Set budgets to see comparison
        </div>
      )}
    </div>
  );

  /**
   * Top Categories Chart
   */
  const renderTopCategories = () => (
    <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100 h-[420px]">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Top Spending Categories
      </h3>
      {topCategories.length > 0 ? (
        <ResponsiveContainer width="100%" height="85%">
          <BarChart
            data={topCategories}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" fontSize={12} />
            <YAxis dataKey="category" type="category" fontSize={12} width={100} />
            <Tooltip
              formatter={(value) => `$${Number(value).toFixed(2)}`}
            />
            <Bar
              dataKey="total"
              fill="#F59E0B"
              name="Total Spent"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[85%] text-gray-400">
          No data yet
        </div>
      )}
    </div>
  );

  // Render based on type prop
  switch (type) {
    case "pie":
      return renderCategoryPie();
    case "monthly":
      return renderMonthlySpending();
    case "predictions":
      return renderPredictions();
    case "budget":
      return renderBudgetComparison();
    case "top":
      return renderTopCategories();
    case "all":
    default:
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderCategoryPie()}
          {renderMonthlySpending()}
          {renderTopCategories()}
          {renderBudgetComparison()}
          <div className="lg:col-span-2">
            {renderPredictions()}
          </div>
        </div>
      );
  }
}

export default Charts;