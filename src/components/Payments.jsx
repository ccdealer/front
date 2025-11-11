// src/components/Payments.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Filter, User, Clock, Briefcase, TrendingUp, Download } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    dateFrom: new Date().toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0]
  });

  const [groupBy, setGroupBy] = useState('date');

  useEffect(() => {
    fetchPayments();
  }, [filters]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      
      const url = new URL(`${API_BASE_URL}/v1/reports/`);
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const allReports = data.results || data;
        
        const filteredReports = allReports.filter(report => {
          if (!report.finish) return false;
          
          const finishDate = new Date(report.finish).toISOString().split('T')[0];
          return finishDate >= filters.dateFrom && finishDate <= filters.dateTo;
        });
        
        console.log('✅ Загружено оплат:', filteredReports.length);
        setPayments(filteredReports);
        
        await fetchStatistics();
      }
    } catch (err) {
      console.error('❌ Ошибка загрузки оплат:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      const url = new URL(`${API_BASE_URL}/v1/reports/statistics/`);
      url.searchParams.append('date_from', filters.dateFrom);
      url.searchParams.append('date_to', filters.dateTo);
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (err) {
      console.error('❌ Ошибка загрузки статистики:', err);
    }
  };

  const setQuickPeriod = (period) => {
    const today = new Date();
    let dateFrom = new Date();
    
    switch(period) {
      case 'today':
        dateFrom = new Date();
        break;
      case 'yesterday':
        dateFrom = new Date(today.setDate(today.getDate() - 1));
        break;
      case 'week':
        dateFrom = new Date(today.setDate(today.getDate() - 7));
        break;
      case 'month':
        dateFrom = new Date(today.setMonth(today.getMonth() - 1));
        break;
      default:
        dateFrom = new Date();
    }
    
    setFilters({
      dateFrom: dateFrom.toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0]
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (duration) => {
    if (!duration) return '-';
    const parts = duration.split(':');
    return `${parts[0]}ч ${parts[1]}м`;
  };

  const groupByDate = () => {
    const grouped = {};
    
    payments.forEach(payment => {
      const date = new Date(payment.finish).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(payment);
    });
    
    return grouped;
  };

  const groupByWorker = () => {
    const grouped = {};
    
    payments.forEach(payment => {
      const workerId = payment.worker;
      if (!grouped[workerId]) {
        grouped[workerId] = {
          name: payment.worker_name,
          payments: []
        };
      }
      grouped[workerId].payments.push(payment);
    });
    
    return grouped;
  };

  const calculateGroupTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.total_payment || 0), 0);
  };

  const exportToCSV = () => {
    if (payments.length === 0) {
      alert('Нет данных для экспорта');
      return;
    }

    const headers = ['Дата', 'Сотрудник', 'Должность', 'Начало', 'Конец', 'Часов', 'Оплата'];
    const rows = payments.map(p => [
      new Date(p.finish).toLocaleDateString('ru-RU'),
      p.worker_name,
      p.job_title,
      formatTime(p.start),
      formatTime(p.finish),
      formatDuration(p.duration),
      p.total_payment || 0
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `payments_${filters.dateFrom}_${filters.dateTo}.csv`;
    link.click();
  };

  const groupedData = groupBy === 'date' ? groupByDate() : groupByWorker();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Заголовок */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <DollarSign size={32} className="text-green-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Оплаты</h2>
            <p className="text-sm text-gray-500">Учет выплат сотрудникам</p>
          </div>
        </div>
        
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download size={18} />
          Экспорт CSV
        </button>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h3 className="font-semibold text-gray-700">Фильтры</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата с</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата по</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Группировать по</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="date">По дате</option>
              <option value="worker">По сотруднику</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setQuickPeriod('today')} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm">Сегодня</button>
          <button onClick={() => setQuickPeriod('yesterday')} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm">Вчера</button>
          <button onClick={() => setQuickPeriod('week')} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm">Неделя</button>
          <button onClick={() => setQuickPeriod('month')} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm">Месяц</button>
        </div>
      </div>

      {/* Статистика */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <DollarSign size={24} />
              <TrendingUp size={20} />
            </div>
            <h3 className="text-sm font-medium opacity-90">Всего оплат</h3>
            <p className="text-3xl font-bold mt-1">{statistics.total_payment.toLocaleString()} ₸</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={20} className="text-blue-500" />
              <h3 className="text-sm font-medium text-gray-600">Смен</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{statistics.total_shifts}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={20} className="text-purple-500" />
              <h3 className="text-sm font-medium text-gray-600">Часов</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{statistics.total_hours}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={20} className="text-orange-500" />
              <h3 className="text-sm font-medium text-gray-600">Средняя оплата</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {statistics.total_shifts > 0 ? Math.round(statistics.total_payment / statistics.total_shifts) : 0} ₸
            </p>
          </div>
        </div>
      )}

      {/* Список оплат */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Нет данных</h3>
          <p className="text-gray-500">За выбранный период нет завершенных смен</p>
        </div>
      ) : groupBy === 'date' ? (
        // Группировка по дате
        <div className="space-y-6">
          {Object.entries(groupedData).sort((a, b) => b[0].localeCompare(a[0])).map(([date, items]) => (
            <div key={date} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-3">
                  <Calendar size={24} />
                  <div>
                    <h3 className="font-semibold text-lg">{formatDate(date)}</h3>
                    <p className="text-sm opacity-90">{items.length} смен</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-90">Итого</p>
                  <p className="text-2xl font-bold">{calculateGroupTotal(items).toLocaleString()} ₸</p>
                </div>
              </div>

              <div className="divide-y">
                {items.map(payment => (
                  <div key={payment.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-3 rounded-full">
                          <User size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{payment.worker_name}</p>
                          <p className="text-sm text-gray-500">{payment.job_title}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">Начало</p>
                        <p className="font-medium">{formatTime(payment.start)}</p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">Конец</p>
                        <p className="font-medium">{formatTime(payment.finish)}</p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">Отработано</p>
                        <p className="font-medium">{formatDuration(payment.duration)}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Оплата</p>
                        <p className="text-xl font-bold text-green-600">{payment.total_payment?.toLocaleString() || 0} ₸</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Группировка по сотруднику
        <div className="space-y-6">
          {Object.entries(groupedData).map(([workerId, data]) => (
            <div key={workerId} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-3">
                  <User size={24} />
                  <div>
                    <h3 className="font-semibold text-lg">{data.name}</h3>
                    <p className="text-sm opacity-90">{data.payments.length} смен</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-90">Итого</p>
                  <p className="text-2xl font-bold">{calculateGroupTotal(data.payments).toLocaleString()} ₸</p>
                </div>
              </div>

              <div className="divide-y">
                {data.payments.map(payment => (
                  <div key={payment.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-3 rounded-full">
                          <Briefcase size={20} className="text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{payment.job_title}</p>
                          <p className="text-sm text-gray-500">{formatDate(payment.finish)}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">Начало</p>
                        <p className="font-medium">{formatTime(payment.start)}</p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">Конец</p>
                        <p className="font-medium">{formatTime(payment.finish)}</p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">Отработано</p>
                        <p className="font-medium">{formatDuration(payment.duration)}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Оплата</p>
                        <p className="text-xl font-bold text-green-600">{payment.total_payment?.toLocaleString() || 0} ₸</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Payments;