import React, { useMemo } from 'react';
import { InvoiceRecord, ExpenseCategory } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface DashboardProps {
  invoices: InvoiceRecord[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#9ca3af'];

const Dashboard: React.FC<DashboardProps> = ({ invoices }) => {
  const stats = useMemo(() => {
    const successInvoices = invoices.filter(i => i.status === 'success' && i.data);
    const totalSpend = successInvoices.reduce((acc, curr) => acc + (curr.data?.totalAmount || 0), 0);

    // Category Breakdown
    const categoryMap: Record<string, number> = {};
    Object.values(ExpenseCategory).forEach(c => categoryMap[c] = 0);
    
    successInvoices.forEach(inv => {
      const cat = inv.data?.category || ExpenseCategory.MISCELLANEOUS;
      categoryMap[cat] = (categoryMap[cat] || 0) + (inv.data?.totalAmount || 0);
    });

    const categoryBreakdown = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .filter(i => i.value > 0);

    // Monthly Spend
    const monthMap: Record<string, number> = {};
    successInvoices.forEach(inv => {
        if (!inv.data?.date) return;
        const date = new Date(inv.data.date);
        if (isNaN(date.getTime())) return;
        const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        monthMap[key] = (monthMap[key] || 0) + (inv.data.totalAmount || 0);
    });
    
    // Sort months roughly
    const monthlySpend = Object.entries(monthMap).map(([month, amount]) => ({ month, amount }));

    return { totalSpend, categoryBreakdown, monthlySpend };
  }, [invoices]);

  if (invoices.filter(i => i.status === 'success').length === 0) {
      return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-fade-in">
      {/* Total Spend Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
        <h3 className="text-gray-500 font-medium mb-2">Total Expenses</h3>
        <p className="text-4xl font-bold text-gray-900">
            ${stats.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-sm text-green-600 mt-2 font-medium flex items-center bg-green-50 px-2 py-1 rounded-full">
             {invoices.filter(i => i.status === 'success').length} Invoices Processed
        </p>
      </div>

      {/* Category Pie Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
        <h3 className="text-gray-700 font-semibold mb-4">Expenses by Category</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={stats.categoryBreakdown}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {stats.categoryBreakdown.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-2 justify-center mt-[-20px] text-xs">
             {stats.categoryBreakdown.slice(0, 3).map((c, i) => (
                 <span key={i} className="flex items-center gap-1">
                     <span className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></span>
                     {c.name}
                 </span>
             ))}
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
        <h3 className="text-gray-700 font-semibold mb-4">Monthly Trends</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.monthlySpend}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} cursor={{fill: 'transparent'}} />
            <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
