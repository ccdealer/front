import React from 'react';
import { 
  Calendar, Users, Building2, DollarSign, 
  TrendingUp, TrendingDown, Clock, CheckCircle 
} from 'lucide-react';

const Dashboard = () => {
  // Демо-данные для статистики
  const stats = [
    {
      title: 'Активных бронирований',
      value: '24',
      change: '+12%',
      trend: 'up',
      icon: Calendar,
      color: 'blue'
    },
    {
      title: 'Гостей сегодня',
      value: '156',
      change: '+8%',
      trend: 'up',
      icon: Users,
      color: 'green'
    },
    {
      title: 'Свободных номеров',
      value: '18',
      change: '-5%',
      trend: 'down',
      icon: Building2,
      color: 'yellow'
    },
    {
      title: 'Выручка за месяц',
      value: '2.4M ₸',
      change: '+23%',
      trend: 'up',
      icon: DollarSign,
      color: 'purple'
    }
  ];

  // Демо-данные последних бронирований
  const recentBookings = [
    { id: 1, guest: 'Иванов Иван', room: '101', checkIn: '2024-11-10', status: 'Заселён' },
    { id: 2, guest: 'Петров Петр', room: '205', checkIn: '2024-11-10', status: 'Забронирован' },
    { id: 3, guest: 'Сидорова Мария', room: '312', checkIn: '2024-11-11', status: 'Забронирован' },
    { id: 4, guest: 'Козлов Андрей', room: '108', checkIn: '2024-11-10', status: 'Заселён' },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      purple: 'bg-purple-100 text-purple-600',
    };
    return colors[color] || colors.blue;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Заселён':
        return 'bg-green-100 text-green-700';
      case 'Забронирован':
        return 'bg-blue-100 text-blue-700';
      case 'Выселен':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Главная панель</h1>
        <p className="text-gray-600 mt-1">Добро пожаловать в систему управления отелем</p>
      </div>

      {/* Карточки статистики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
          
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                  <div className={`inline-flex items-center gap-1 text-sm ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendIcon size={16} />
                    <span>{stat.change}</span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-lg ${getColorClasses(stat.color)} flex items-center justify-center`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Сетка с двумя колонками */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Последние бронирования */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar size={20} className="text-blue-600" />
              Последние бронирования
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{booking.guest}</p>
                    <p className="text-sm text-gray-600">Номер {booking.room} • {booking.checkIn}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">
              Показать все бронирования →
            </button>
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle size={20} className="text-green-600" />
              Быстрые действия
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-3">
              <button className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Calendar className="text-white" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Новое бронирование</p>
                  <p className="text-sm text-gray-600">Создать бронирование гостя</p>
                </div>
              </button>

              <button className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <Users className="text-white" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Добавить гостя</p>
                  <p className="text-sm text-gray-600">Зарегистрировать нового гостя</p>
                </div>
              </button>

              <button className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-white" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Добавить оплату</p>
                  <p className="text-sm text-gray-600">Записать платёж</p>
                </div>
              </button>

              <button className="flex items-center gap-3 p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors text-left">
                <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <Clock className="text-white" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Табель</p>
                  <p className="text-sm text-gray-600">Учёт рабочего времени</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Нижняя панель со статусом номеров */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 size={20} className="text-blue-600" />
          Статус номеров
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Свободно</p>
            <p className="text-2xl font-bold text-green-600">18</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Занято</p>
            <p className="text-2xl font-bold text-blue-600">24</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Убирается</p>
            <p className="text-2xl font-bold text-yellow-600">5</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">В ремонте</p>
            <p className="text-2xl font-bold text-red-600">2</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;