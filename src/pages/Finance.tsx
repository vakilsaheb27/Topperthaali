import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { Plus, Receipt, TrendingDown, MessageCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { generateReceiptNo, getWhatsAppLink } from '@/lib/utils';

export function Finance() {
  const [tab, setTab] = useState<'subscriptions' | 'payments' | 'expenses'>('subscriptions');
  const [isAdding, setIsAdding] = useState(false);

  const students = useLiveQuery(() => db.students.toArray()) || [];
  const subscriptions = useLiveQuery(async () => {
    const subs = await db.subscriptions.reverse().toArray();
    return Promise.all(subs.map(async s => {
      const student = await db.students.get(s.studentId);
      return { ...s, studentName: student?.name || 'Unknown' };
    }));
  }, []) || [];

  const payments = useLiveQuery(async () => {
    const pays = await db.payments.reverse().toArray();
    return Promise.all(pays.map(async p => {
      const student = await db.students.get(p.studentId);
      return { ...p, studentName: student?.name || 'Unknown', studentMobile: student?.mobile || '' };
    }));
  }, []) || [];

  const expenses = useLiveQuery(() => db.expenses.reverse().toArray()) || [];

  const handleAddSubscription = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const studentId = Number(formData.get('studentId'));
    const plan = formData.get('plan') as 'Lunch' | 'Dinner' | 'Both';
    const days = Number(formData.get('days'));
    const amount = Number(formData.get('amount'));

    if (!studentId || !plan || !days || !amount) return;

    const startDate = format(new Date(), 'yyyy-MM-dd');
    const endDate = format(addDays(new Date(), days), 'yyyy-MM-dd');

    await db.transaction('rw', db.subscriptions, db.payments, async () => {
      await db.subscriptions.add({
        studentId,
        plan,
        startDate,
        endDate,
        remainingDays: days,
        status: 'Active',
        createdAt: new Date().toISOString()
      });

      await db.payments.add({
        studentId,
        amount,
        date: startDate,
        receiptNo: generateReceiptNo(),
        type: 'Subscription'
      });
    });

    setIsAdding(false);
  };

  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const description = formData.get('description') as string;
    const amount = Number(formData.get('amount'));
    const category = formData.get('category') as string;

    if (!description || !amount || !category) return;

    await db.expenses.add({
      description,
      amount,
      category,
      date: format(new Date(), 'yyyy-MM-dd')
    });

    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Finance</h2>

      <div className="flex bg-gray-200 p-1 rounded-xl">
        {(['subscriptions', 'payments', 'expenses'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setIsAdding(false); }}
            className={`flex-1 py-1.5 text-sm font-medium rounded-lg capitalize ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-medium"
        >
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      {isAdding && tab === 'subscriptions' && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-3">New Subscription</h3>
          <form onSubmit={handleAddSubscription} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Student</label>
              <select name="studentId" required className="w-full p-2 border border-gray-200 rounded-lg">
                <option value="">Select Student</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.mobile})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Plan</label>
                <select name="plan" required className="w-full p-2 border border-gray-200 rounded-lg">
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Both">Both</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Days</label>
                <input name="days" type="number" defaultValue={30} required className="w-full p-2 border border-gray-200 rounded-lg" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Amount Paid (₹)</label>
              <input name="amount" type="number" required className="w-full p-2 border border-gray-200 rounded-lg" />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium mt-2">Save Subscription</button>
          </form>
        </div>
      )}

      {isAdding && tab === 'expenses' && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-3">New Expense</h3>
          <form onSubmit={handleAddExpense} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <input name="description" type="text" required className="w-full p-2 border border-gray-200 rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input name="amount" type="number" required className="w-full p-2 border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select name="category" required className="w-full p-2 border border-gray-200 rounded-lg">
                  <option value="Groceries">Groceries</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Salary">Salary</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium mt-2">Save Expense</button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {tab === 'subscriptions' && subscriptions.map(sub => (
          <div key={sub.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-900">{sub.studentName}</h4>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                sub.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {sub.status}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Plan: {sub.plan}</span>
              <span>{sub.remainingDays} days left</span>
            </div>
          </div>
        ))}

        {tab === 'payments' && payments.map(pay => (
          <div key={pay.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full text-green-600">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{pay.studentName}</h4>
                <p className="text-xs text-gray-500">{pay.date} • {pay.receiptNo}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">₹{pay.amount}</p>
              <a 
                href={getWhatsAppLink(pay.studentMobile, `Receipt from Mess: ${pay.receiptNo} for ₹${pay.amount}. Thank you!`)}
                target="_blank" rel="noreferrer"
                className="text-xs text-green-600 flex items-center gap-1 justify-end mt-1"
              >
                <MessageCircle className="w-3 h-3" /> Share
              </a>
            </div>
          </div>
        ))}

        {tab === 'expenses' && expenses.map(exp => (
          <div key={exp.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-full text-red-600">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{exp.description}</h4>
                <p className="text-xs text-gray-500">{exp.date} • {exp.category}</p>
              </div>
            </div>
            <p className="font-bold text-red-600">-₹{exp.amount}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
