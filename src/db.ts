import Dexie, { Table } from 'dexie';

export interface Student {
  id?: number;
  name: string;
  mobile: string;
  qrCode: string;
  createdAt: string;
}

export interface Subscription {
  id?: number;
  studentId: number;
  plan: 'Lunch' | 'Dinner' | 'Both';
  startDate: string;
  endDate: string;
  remainingDays: number;
  status: 'Active' | 'Expired';
  createdAt: string;
}

export interface Attendance {
  id?: number;
  studentId: number;
  date: string; // YYYY-MM-DD
  meal: 'Lunch' | 'Dinner';
  timestamp: string;
}

export interface Payment {
  id?: number;
  studentId: number;
  amount: number;
  date: string;
  receiptNo: string;
  type: string;
}

export interface Expense {
  id?: number;
  description: string;
  amount: number;
  date: string;
  category: string;
}

export class MessDB extends Dexie {
  students!: Table<Student, number>;
  subscriptions!: Table<Subscription, number>;
  attendance!: Table<Attendance, number>;
  payments!: Table<Payment, number>;
  expenses!: Table<Expense, number>;

  constructor() {
    super('MessDB');
    this.version(1).stores({
      students: '++id, name, mobile, qrCode',
      subscriptions: '++id, studentId, plan, status, endDate',
      attendance: '++id, studentId, date, meal, [studentId+date+meal]',
      payments: '++id, studentId, date',
      expenses: '++id, date, category'
    });
  }
}

export const db = new MessDB();
