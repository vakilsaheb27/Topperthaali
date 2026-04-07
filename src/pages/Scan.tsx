import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db, Student, Subscription } from '@/db';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Utensils } from 'lucide-react';

export function Scan() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [meal, setMeal] = useState<'Lunch' | 'Dinner'>('Lunch');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const currentHour = new Date().getHours();
    setMeal(currentHour < 15 ? 'Lunch' : 'Dinner');

    const scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (decodedText) => {
        setScanResult(decodedText);
        scanner.pause();
      },
      (error) => {
        // ignore continuous errors
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, []);

  useEffect(() => {
    if (scanResult) {
      processScan(scanResult);
    }
  }, [scanResult, meal]);

  const processScan = async (qrCode: string) => {
    try {
      const foundStudent = await db.students.where('qrCode').equals(qrCode).first();
      
      if (!foundStudent) {
        setStatus('error');
        setMessage('Invalid QR Code. Student not found.');
        return;
      }

      setStudent(foundStudent);

      const activeSub = await db.subscriptions
        .where('studentId').equals(foundStudent.id!)
        .and(s => s.status === 'Active')
        .first();

      if (!activeSub) {
        setStatus('error');
        setMessage('No active subscription found for this student.');
        return;
      }

      setSubscription(activeSub);

      // Check if plan allows this meal
      if (activeSub.plan !== 'Both' && activeSub.plan !== meal) {
        setStatus('error');
        setMessage(`Student plan is for ${activeSub.plan} only.`);
        return;
      }

      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Check for duplicate
      const existingAttendance = await db.attendance
        .where({ studentId: foundStudent.id!, date: today, meal })
        .first();

      if (existingAttendance) {
        setStatus('error');
        setMessage(`Attendance already marked for ${meal} today.`);
        return;
      }

      // Mark attendance
      await db.attendance.add({
        studentId: foundStudent.id!,
        date: today,
        meal,
        timestamp: new Date().toISOString()
      });

      // Handle remaining days (decrement on first meal of the day)
      const anyMealToday = await db.attendance
        .where({ studentId: foundStudent.id!, date: today })
        .count();

      if (anyMealToday === 1) { // This was the first meal today
        const newRemaining = activeSub.remainingDays - 1;
        await db.subscriptions.update(activeSub.id!, {
          remainingDays: newRemaining,
          status: newRemaining <= 0 ? 'Expired' : 'Active'
        });
      }

      setStatus('success');
      setMessage(`Attendance marked for ${foundStudent.name} (${meal})`);
      
      // Reset after 3 seconds
      setTimeout(() => {
        resetScanner();
      }, 3000);

    } catch (error) {
      console.error(error);
      setStatus('error');
      setMessage('An error occurred while processing.');
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setStudent(null);
    setSubscription(null);
    setStatus('idle');
    setMessage('');
    // The scanner needs to be resumed, but html5-qrcode API for resume is tricky.
    // Easiest is to let the user tap a button to scan again or we just reload the component state.
    // For now, we'll just force a re-render of the scanner by not doing anything special, 
    // but we need to get the scanner instance. Let's just use window location reload for simplicity in this demo,
    // or better, we can just clear and re-initialize.
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Scan QR</h2>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={() => setMeal('Lunch')}
            className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${
              meal === 'Lunch' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Utensils className="w-4 h-4" /> Lunch
          </button>
          <button
            onClick={() => setMeal('Dinner')}
            className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${
              meal === 'Dinner' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Utensils className="w-4 h-4" /> Dinner
          </button>
        </div>

        <div id="reader" className="w-full overflow-hidden rounded-lg border-2 border-gray-100"></div>
      </div>

      {status !== 'idle' && (
        <div className={`p-4 rounded-xl flex items-start gap-3 ${
          status === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {status === 'success' ? (
            <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
          ) : (
            <XCircle className="w-6 h-6 text-red-600 shrink-0" />
          )}
          <div>
            <h3 className="font-bold">{status === 'success' ? 'Success' : 'Error'}</h3>
            <p className="text-sm mt-1">{message}</p>
            {status === 'error' && (
              <button 
                onClick={resetScanner}
                className="mt-3 px-4 py-1.5 bg-white rounded-lg text-sm font-medium border shadow-sm"
              >
                Scan Again
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
