import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { Download, FileSpreadsheet, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { getWhatsAppLink } from '@/lib/utils';

export function Reports() {
  const [reportType, setReportType] = useState<'attendance' | 'financial' | 'dues'>('attendance');
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));

  const attendanceData = useLiveQuery(async () => {
    if (reportType !== 'attendance') return [];
    const records = await db.attendance.filter(a => a.date.startsWith(month)).toArray();
    const students = await db.students.toArray();
    const studentMap = new Map(students.map(s => [s.id, s.name]));
    
    return records.map(r => ({
      Date: r.date,
      Student: studentMap.get(r.studentId) || 'Unknown',
      Meal: r.meal,
      Time: format(new Date(r.timestamp), 'HH:mm:ss')
    }));
  }, [reportType, month]);

  const financialData = useLiveQuery(async () => {
    if (reportType !== 'financial') return [];
    const payments = await db.payments.filter(p => p.date.startsWith(month)).toArray();
    const expenses = await db.expenses.filter(e => e.date.startsWith(month)).toArray();
    const students = await db.students.toArray();
    const studentMap = new Map(students.map(s => [s.id, s.name]));

    const combined = [
      ...payments.map(p => ({
        Date: p.date,
        Type: 'Income',
        Category: 'Subscription',
        Description: `Payment from ${studentMap.get(p.studentId) || 'Unknown'}`,
        Amount: p.amount
      })),
      ...expenses.map(e => ({
        Date: e.date,
        Type: 'Expense',
        Category: e.category,
        Description: e.description,
        Amount: -e.amount
      }))
    ].sort((a, b) => a.Date.localeCompare(b.Date));

    return combined;
  }, [reportType, month]);

  const dueData = useLiveQuery(async () => {
    if (reportType !== 'dues') return [];
    const subs = await db.subscriptions.where('status').equals('Active').toArray();
    const students = await db.students.toArray();
    const studentMap = new Map(students.map(s => [s.id, s]));

    return subs
      .filter(s => s.remainingDays <= 5)
      .map(s => {
        const student = studentMap.get(s.studentId);
        return {
          Student: student?.name || 'Unknown',
          Mobile: student?.mobile || '',
          Plan: s.plan,
          RemainingDays: s.remainingDays,
          EndDate: s.endDate
        };
      })
      .sort((a, b) => a.RemainingDays - b.RemainingDays);
  }, [reportType]);

  const handleExport = () => {
    let data: any[] = [];
    if (reportType === 'attendance') data = attendanceData || [];
    if (reportType === 'financial') data = financialData || [];
    if (reportType === 'dues') data = dueData || [];

    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `mess_${reportType}_report_${month}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Reports</h2>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Report Type</label>
          <select 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value as any)}
            className="w-full p-2 border border-gray-200 rounded-lg"
          >
            <option value="attendance">Attendance Report</option>
            <option value="financial">Financial Report</option>
            <option value="dues">Pending Dues / Expiring</option>
          </select>
        </div>

        {reportType !== 'dues' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
            <input 
              type="month" 
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg" 
            />
          </div>
        )}

        <button 
          onClick={handleExport}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg font-medium"
        >
          <Download className="w-5 h-5" /> Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-700">Preview</h3>
        </div>
        <div className="p-4 overflow-x-auto">
          {reportType === 'attendance' && (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-gray-500 border-b">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Student</th>
                  <th className="pb-2 font-medium">Meal</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData?.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="py-2">{row.Date}</td>
                    <td className="py-2">{row.Student}</td>
                    <td className="py-2">{row.Meal}</td>
                  </tr>
                ))}
                {attendanceData?.length === 0 && (
                  <tr><td colSpan={3} className="py-4 text-center text-gray-500">No data found</td></tr>
                )}
              </tbody>
            </table>
          )}

          {reportType === 'financial' && (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-gray-500 border-b">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {financialData?.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="py-2">{row.Date}</td>
                    <td className="py-2 truncate max-w-[120px]">{row.Description}</td>
                    <td className={`py-2 text-right font-medium ${row.Amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {row.Amount > 0 ? '+' : ''}{row.Amount}
                    </td>
                  </tr>
                ))}
                {financialData?.length === 0 && (
                  <tr><td colSpan={3} className="py-4 text-center text-gray-500">No data found</td></tr>
                )}
              </tbody>
            </table>
          )}

          {reportType === 'dues' && (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-gray-500 border-b">
                  <th className="pb-2 font-medium">Student</th>
                  <th className="pb-2 font-medium text-right">Days Left</th>
                  <th className="pb-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {dueData?.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="py-2">
                      <p className="font-medium text-gray-900">{row.Student}</p>
                      <p className="text-xs text-gray-500">{row.Mobile}</p>
                    </td>
                    <td className="py-2 text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.RemainingDays <= 2 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {row.RemainingDays}
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <a 
                        href={getWhatsAppLink(row.Mobile, `Hello ${row.Student}, your mess subscription for ${row.Plan} is expiring in ${row.RemainingDays} days (on ${row.EndDate}). Please renew soon to continue enjoying your meals!`)}
                        target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-600 px-2 py-1.5 rounded-lg font-medium hover:bg-green-100 transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" /> Remind
                      </a>
                    </td>
                  </tr>
                ))}
                {dueData?.length === 0 && (
                  <tr><td colSpan={3} className="py-4 text-center text-gray-500">No dues found</td></tr>
                )}
              </tbody>
            </table>
          )}
          
          {((reportType === 'attendance' && (attendanceData?.length || 0) > 5) ||
            (reportType === 'financial' && (financialData?.length || 0) > 5) ||
            (reportType === 'dues' && (dueData?.length || 0) > 5)) && (
            <p className="text-center text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
              Showing 5 rows. Export to see all.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
