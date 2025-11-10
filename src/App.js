import React, { useState, useEffect } from 'react';
import { Calendar, Users, CreditCard, FileText, UserCheck, Briefcase, Clock, LogOut, Menu, X } from 'lucide-react';
import Login from './components/Login';
import Bookings from './components/Bookings';
import BookingCards from './components/BookingCards';
import Payments from './components/Payments';
import Guests from './components/Guests';
import Agents from './components/Agents';
import Reports from './components/Reports';
import ReportsPage from './components/ReportsPage';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('bookings');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (username) => {
    setIsLoggedIn(true);
    setCurrentUser(username);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const menuItems = [
    { id: 'bookings', label: 'Бронирования', icon: Calendar },
    { id: 'booking-cards', label: 'Карточки бронирования', icon: FileText },
    { id: 'payments', label: 'Оплаты', icon: CreditCard },
    { id: 'reports-page', label: 'Отчёты', icon: FileText },
    { id: 'guests', label: 'Гости', icon: Users },
    { id: 'agents', label: 'Контрагенты', icon: Briefcase },
    { id: 'timesheet', label: 'Табель', icon: Clock },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'bookings':
        return <Bookings />;
      case 'booking-cards':
        return <BookingCards />;
      case 'payments':
        return <Payments />;
      case 'reports-page':
        return <ReportsPage />;
      case 'guests':
        return <Guests />;
      case 'agents':
        return <Agents />;
      case 'timesheet':
        return <Reports />;
      default:
        return <Bookings />;
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">Отель</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-800 rounded">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  currentPage === item.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <UserCheck size={20} />
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="text-sm font-semibold">{currentUser || 'Администратор'}</p>
                <p className="text-xs text-gray-400">Администратор</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
          >
            <LogOut size={18} />
            {sidebarOpen && <span>Выход</span>}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {renderPage()}
      </div>
    </div>
  );
};

export default App;