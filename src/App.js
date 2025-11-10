import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';

// Импорт компонентов - используйте те, что у вас есть
// Если компонента нет - закомментируйте его импорт
import Login from './components/Login';
// import Bookings from './components/Bookings';
// import BookingCards from './components/BookingCards';
// import Payments from './components/Payments';
// import Guests from './components/Guests';
// import Agents from './components/Agents';
// import Reports from './components/Reports';

// Временные заглушки (удалите когда добавите настоящие компоненты)
const Bookings = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Бронирования</h2>
    <div className="bg-white p-6 rounded-lg shadow">
      <p>Список бронирований будет здесь</p>
    </div>
  </div>
);

const BookingCards = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Карточки бронирования</h2>
    <div className="bg-white p-6 rounded-lg shadow">
      <p>Карточки бронирования будут здесь</p>
    </div>
  </div>
);

const Guests = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Гости</h2>
    <div className="bg-white p-6 rounded-lg shadow">
      <p>База гостей будет здесь</p>
    </div>
  </div>
);

const Agents = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Контрагенты</h2>
    <div className="bg-white p-6 rounded-lg shadow">
      <p>Список контрагентов будет здесь</p>
    </div>
  </div>
);

const Payments = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Оплаты</h2>
    <div className="bg-white p-6 rounded-lg shadow">
      <p>Учёт платежей будет здесь</p>
    </div>
  </div>
);

const Reports = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Табель</h2>
    <div className="bg-white p-6 rounded-lg shadow">
      <p>Табель учёта времени будет здесь</p>
    </div>
  </div>
);

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('bookings');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Проверка токена при загрузке
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // Обработка входа
  const handleLogin = (username) => {
    setIsLoggedIn(true);
    setCurrentUser(username);
  };

  // Обработка выхода
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentPage('bookings');
  };

  // Пункты меню - иконки берём из Icons объекта
  const menuItems = [
    { id: 'bookings', label: 'Бронирования', icon: 'Calendar' },
    { id: 'booking-cards', label: 'Карточки бронирования', icon: 'FileText' },
    { id: 'guests', label: 'Гости', icon: 'Users' },
    { id: 'agents', label: 'Контрагенты', icon: 'Briefcase' },
    { id: 'payments', label: 'Оплаты', icon: 'CreditCard' },
    { id: 'timesheet', label: 'Табель', icon: 'Clock' },
  ];

  // Рендер страниц
  const renderPage = () => {
    switch (currentPage) {
      case 'bookings':
        return <Bookings />;
      case 'booking-cards':
        return <BookingCards />;
      case 'guests':
        return <Guests />;
      case 'agents':
        return <Agents />;
      case 'payments':
        return <Payments />;
      case 'timesheet':
        return <Reports />;
      default:
        return <Bookings />;
    }
  };

  // Если не авторизован - показываем страницу входа
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Основной контент слева */}
      <div className="flex-1 overflow-y-auto">
        {renderPage()}
      </div>

      {/* Боковое меню справа */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col border-l border-gray-700`}>
        {/* Шапка меню */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">Меню</h1>}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 hover:bg-gray-800 rounded transition-colors"
            title={sidebarOpen ? "Свернуть меню" : "Развернуть меню"}
          >
            {sidebarOpen ? <Icons.X size={20} /> : <Icons.Menu size={20} />}
          </button>
        </div>

        {/* Навигация */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            // Получаем компонент иконки по имени из объекта Icons
            const IconComponent = Icons[item.icon];
            
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  currentPage === item.id 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
                title={item.label}
              >
                <IconComponent size={20} className="flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Информация о пользователе и выход */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Icons.UserCheck size={20} />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {currentUser || 'Пользователь'}
                </p>
                <p className="text-xs text-gray-400">Администратор</p>
              </div>
            )}
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            title="Выйти из системы"
          >
            <Icons.LogOut size={18} />
            {sidebarOpen && <span>Выход</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;