import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, QrCode, IndianRupee, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Layout() {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/students', icon: Users, label: 'Students' },
    { to: '/scan', icon: QrCode, label: 'Scan' },
    { to: '/finance', icon: IndianRupee, label: 'Finance' },
    { to: '/reports', icon: FileText, label: 'Reports' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900">MessAdmin</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around items-center pb-safe">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center py-3 px-2 min-w-[64px] text-xs font-medium transition-colors",
                isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
              )
            }
          >
            <item.icon className="w-6 h-6 mb-1" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
