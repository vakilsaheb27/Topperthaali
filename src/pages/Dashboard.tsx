import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { Users, CreditCard, Utensils, AlertCircle } from 'lucide-react';
import { format, isToday } from 'date-fns';

export function Dashboard() {
  const studentsCount = useLiveQuery(() => db.students.count()) || 0;
  
  const activeSubscriptions = useLiveQuery(() => 
    db.subscriptions.where('status').equals('Active').count()
  ) || 0;

  const todayAttendance = useLiveQuery(async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const records = await db.attendance.where('date').equals(today).toArray();
    return {
      lunch: records.filter(r => r.meal === 'Lunch').length,
      dinner: records.filter(r => r.meal === 'Dinner').length,
      total: records.length
    };
  }, []) || { lunch: 0, dinner: 0, total: 0 };

  const expiringSoon = useLiveQuery(async () => {
    const subs = await db.subscriptions.where('status').equals('Active').toArray();
    return subs.filter(s => s.remainingDays <= 3 && s.remainingDays > 0).length;
  }) || 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Overview</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="bg-blue-100 p-3 rounded-full mb-2 text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Total Students</p>
          <p className="text-2xl font-bold text-gray-900">{studentsCount}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="bg-green-100 p-3 rounded-full mb-2 text-green-600">
            <CreditCard className="w-6 h-6" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Active Subs</p>
          <p className="text-2xl font-bold text-gray-900">{activeSubscriptions}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center col-span-2">
          <div className="bg-orange-100 p-3 rounded-full mb-2 text-orange-600">
            <Utensils className="w-6 h-6" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Today's Meals</p>
          <div className="flex items-center justify-center gap-6 mt-2 w-full">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{todayAttendance.lunch}</p>
              <p className="text-xs text-gray-500">Lunch</p>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{todayAttendance.dinner}</p>
              <p className="text-xs text-gray-500">Dinner</p>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{todayAttendance.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
      </div>

      {expiringSoon > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-medium text-red-800">Expiring Subscriptions</h3>
            <p className="text-sm text-red-600 mt-1">
              {expiringSoon} student(s) have subscriptions expiring in 3 days or less.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
