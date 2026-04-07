import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Student } from '@/db';
import { Plus, Search, User, QrCode, Trash2, Edit } from 'lucide-react';
import { generateQRCodeString } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';

export function Students() {
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const studentAttendance = useLiveQuery(
    () => selectedStudent ? db.attendance.where('studentId').equals(selectedStudent.id!).reverse().toArray() : [],
    [selectedStudent]
  );

  const students = useLiveQuery(
    () => db.students
      .filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.mobile.includes(search))
      .reverse()
      .toArray(),
    [search]
  );

  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const mobile = formData.get('mobile') as string;

    if (!name || !mobile) return;

    await db.students.add({
      name,
      mobile,
      qrCode: generateQRCodeString(),
      createdAt: new Date().toISOString()
    });

    setIsAdding(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this student?')) {
      await db.students.delete(id);
      // Also delete related records in a real app
      setSelectedStudent(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Students</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 text-white p-2 rounded-full shadow-sm hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or mobile..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {isAdding && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-3">Add New Student</h3>
          <form onSubmit={handleAddStudent} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
              <input name="name" type="text" required className="w-full p-2 border border-gray-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mobile</label>
              <input name="mobile" type="tel" required className="w-full p-2 border border-gray-200 rounded-lg" />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium">Save</button>
              <button type="button" onClick={() => setIsAdding(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {selectedStudent ? (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h3>
              <p className="text-gray-500">{selectedStudent.mobile}</p>
            </div>
            <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-100">
            <QRCodeSVG value={selectedStudent.qrCode} size={150} />
            <p className="text-xs text-gray-400 mt-2 font-mono">{selectedStudent.qrCode}</p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => handleDelete(selectedStudent.id!)}
              className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 py-2 rounded-lg font-medium"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>

          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-3">Attendance History</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {studentAttendance?.map(record => (
                <div key={record.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg text-sm border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-800">{record.date}</p>
                    <p className="text-xs text-gray-500">{format(new Date(record.timestamp), 'hh:mm a')}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.meal === 'Lunch' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>
                    {record.meal}
                  </span>
                </div>
              ))}
              {studentAttendance?.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg border border-gray-100">No attendance records found.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {students?.map(student => (
            <div
              key={student.id}
              onClick={() => setSelectedStudent(student)}
              className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 cursor-pointer hover:bg-gray-50"
            >
              <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{student.name}</h4>
                <p className="text-sm text-gray-500">{student.mobile}</p>
              </div>
              <QrCode className="w-5 h-5 text-gray-400" />
            </div>
          ))}
          {students?.length === 0 && !isAdding && (
            <p className="text-center text-gray-500 py-8">No students found.</p>
          )}
        </div>
      )}
    </div>
  );
}
