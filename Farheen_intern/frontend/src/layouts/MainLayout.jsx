import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function MainLayout() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface-50 transition-colors duration-300 dark:bg-slate-950">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-surface-50 p-6 transition-colors duration-300 dark:bg-slate-950 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
