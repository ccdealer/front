import React, { useState, useEffect } from 'react';
import { Clock, Plus, X, CheckCircle, PlayCircle, StopCircle, Calendar, User, Briefcase } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const Timesheet = () => {
  const [reports, setReports] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishingReport, setFinishingReport] = useState(null);
  
  const [formData, setFormData] = useState({
    worker: '',
    jtitle: ''
  });

  const [finishFormData, setFinishFormData] = useState({
    finish: ''
  });

  useEffect(() => {
    fetchReports();
    fetchWorkers();
    fetchJobTitles();
  }, []);

  // Загрузка всех записей табеля
  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/v1/reports/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const reportsList = data.results || data;
        console.log('✅ Загружено записей:', reportsList.length);
        setReports(reportsList);
      }
    } catch (err) {
      console.error('❌ Ошибка загрузки табеля:', err);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка сотрудников
  const fetchWorkers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/v1/workers/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const workersList = data.results || data;
        console.log('✅ Загружено сотрудников:', workersList.length);
        setWorkers(workersList);
      }
    } catch (err) {
      console.error('❌ Ошибка загрузки сотрудников:', err);
    }
  };

  // Загрузка должностей
  const fetchJobTitles = async () => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('🔍 Загружаем должности...');
      
      // ПРАВИЛЬНЫЙ URL с дефисом!
      const response = await fetch(`${API_BASE_URL}/v1/job-titles/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('📊 Ответ сервера (должности):', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Данные от сервера:', data);
        
        const titlesList = data.results || data;
        console.log('✅ Загружено должностей:', titlesList.length);
        
        if (titlesList.length > 0) {
          console.log('📋 Первая должность:', titlesList[0]);
          console.log('📋 Все должности:', titlesList);
        } else {
          console.warn('⚠️ Список должностей пуст!');
        }
        
        setJobTitles(titlesList);
      } else {
        console.error('❌ Ошибка ответа:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('❌ Ошибка загрузки должностей:', err);
      alert('Не удалось загрузить должности. Проверьте подключение к серверу.');
    }
  };

  // Начать смену
  const handleStartShift = async () => {
    if (!formData.worker || !formData.jtitle) {
      alert('Выберите сотрудника и должность');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      
      console.log('📝 Начинаем смену:', formData);
      
      const response = await fetch(`${API_BASE_URL}/v1/reports/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          worker: parseInt(formData.worker),
          jtitle: parseInt(formData.jtitle)
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Смена начата:', result);
        await fetchReports();
        handleCloseModal();
        alert('✅ Смена начата!');
      } else {
        const error = await response.json();
        console.error('❌ Ошибка от сервера:', error);
        
        let errorMessage = 'Ошибка при начале смены:\n\n';
        for (const [field, messages] of Object.entries(error)) {
          if (Array.isArray(messages)) {
            errorMessage += `${field}: ${messages.join(', ')}\n`;
          } else {
            errorMessage += `${field}: ${messages}\n`;
          }
        }
        alert(errorMessage);
      }
    } catch (err) {
      console.error('❌ Ошибка сети:', err);
      alert('Ошибка подключения к серверу');
    }
  };

  // Открыть модальное окно завершения смены
  const openFinishModal = (report) => {
    setFinishingReport(report);
    // Устанавливаем текущее время как значение по умолчанию
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setFinishFormData({ finish: localDateTime });
    setShowFinishModal(true);
  };

  // Завершить смену с указанным временем
  const handleFinishShift = async () => {
    if (!finishingReport) return;

    try {
      const token = localStorage.getItem('access_token');
      
      const bodyData = finishFormData.finish 
        ? { finish: new Date(finishFormData.finish).toISOString() }
        : {};
      
      console.log('📝 Завершаем смену:', finishingReport.id);
      console.log('📅 Время окончания:', bodyData.finish || 'текущее время');
      
      const response = await fetch(`${API_BASE_URL}/v1/reports/${finishingReport.id}/finish/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Смена завершена:', result);
        await fetchReports();
        handleCloseFinishModal();
        alert('✅ Смена завершена!');
      } else {
        const error = await response.json();
        console.error('❌ Ошибка:', error);
        alert('Ошибка: ' + JSON.stringify(error));
      }
    } catch (err) {
      console.error('❌ Ошибка:', err);
      alert('Ошибка при завершении смены');
    }
  };

  // Закрыть модальное окно завершения
  const handleCloseFinishModal = () => {
    setShowFinishModal(false);
    setFinishingReport(null);
    setFinishFormData({ finish: '' });
  };

  // Закрыть модальное окно
  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      worker: '',
      jtitle: ''
    });
  };

  // Форматирование даты и времени
  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Не завершена';
    const date = new Date(dateStr);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Вычисление длительности
  const calculateDuration = (start, finish) => {
    if (!finish) return 'В процессе...';
    
    const startDate = new Date(start);
    const finishDate = new Date(finish);
    const diffMs = finishDate - startDate;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}ч ${diffMinutes}м`;
  };

  // Группировка по статусу
  const activeReports = reports.filter(r => !r.finish);
  const completedReports = reports.filter(r => r.finish);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xl text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Заголовок */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Табель учета рабочего времени</h2>
          <p className="text-gray-600 mt-1">Управление сменами сотрудников</p>
        </div>
        <button
          onClick={() => {
            console.log('🪟 Открываем модальное окно');
            console.log('👥 Доступно сотрудников:', workers.length);
            console.log('💼 Доступно должностей:', jobTitles.length);
            if (jobTitles.length > 0) {
              console.log('📋 Должности:', jobTitles);
            } else {
              console.warn('⚠️ Список должностей пуст!');
            }
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors shadow-lg"
        >
          <PlayCircle size={20} />
          Начать смену
        </button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <PlayCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Активные смены</p>
              <p className="text-2xl font-bold text-gray-900">{activeReports.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <CheckCircle className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Завершено смен</p>
              <p className="text-2xl font-bold text-gray-900">{completedReports.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <User className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Всего записей</p>
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Активные смены */}
      {activeReports.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">🟢 Активные смены</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeReports.map(report => (
              <div key={report.id} className="bg-white rounded-lg shadow-sm border-2 border-green-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold text-lg text-gray-900">{report.worker_name}</p>
                    <p className="text-sm text-gray-600">{report.job_title}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    В процессе
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={14} />
                    <span>Начало: {formatDateTime(report.start)}</span>
                  </div>
                </div>

                <button
                  onClick={() => openFinishModal(report)}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <StopCircle size={16} />
                  Завершить смену
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Завершенные смены */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-900">📋 История смен</h3>
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Сотрудник</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Должность</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Начало</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Окончание</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Длительность</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-700">Оплата</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {completedReports.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    Нет завершенных смен
                  </td>
                </tr>
              ) : (
                completedReports.map(report => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{report.worker_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{report.job_title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDateTime(report.start)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDateTime(report.finish)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{calculateDuration(report.start, report.finish)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-right text-gray-900">
                      {report.total_payment ? `${report.total_payment.toFixed(2)} ₸` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальное окно начала смены */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Начать смену</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Индикатор загрузки данных */}
            {(workers.length === 0 || jobTitles.length === 0) && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Не все данные загружены
                    <br/>
                    Сотрудники: {workers.length} | Должности: {jobTitles.length}
                  </p>
                  <button
                    onClick={() => {
                      console.log('🔄 Перезагрузка данных...');
                      fetchWorkers();
                      fetchJobTitles();
                    }}
                    className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                  >
                    Обновить
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Выбор сотрудника */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Сотрудник *
                </label>
                <select
                  value={formData.worker}
                  onChange={(e) => setFormData({ ...formData, worker: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Выберите сотрудника</option>
                  {workers.map(worker => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name}
                      {worker.telegram_username && ` (@${worker.telegram_username})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Выбор должности */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Должность *
                </label>
                <select
                  value={formData.jtitle}
                  onChange={(e) => {
                    console.log('Выбрана должность:', e.target.value);
                    setFormData({ ...formData, jtitle: e.target.value });
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Выберите должность</option>
                  {jobTitles.map(title => (
                    <option key={title.id} value={title.id}>
                      {title.title} ({title.pay_per_hour} ₸/час)
                    </option>
                  ))}
                </select>
                {jobTitles.length === 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ Должности не загружены
                  </p>
                )}
              </div>

              {/* Информация */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>ℹ️ Информация:</strong><br/>
                  Время начала смены будет зафиксировано автоматически при нажатии кнопки "Начать смену".
                </p>
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleStartShift}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Начать смену
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно завершения смены */}
      {showFinishModal && finishingReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Завершить смену</h3>
              <button
                onClick={handleCloseFinishModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Информация о смене */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Сотрудник</p>
              <p className="font-semibold text-gray-900">{finishingReport.worker_name}</p>
              
              <p className="text-sm text-gray-600 mt-3 mb-1">Должность</p>
              <p className="font-medium text-gray-900">{finishingReport.job_title}</p>
              
              <p className="text-sm text-gray-600 mt-3 mb-1">Начало смены</p>
              <p className="font-medium text-gray-900">{formatDateTime(finishingReport.start)}</p>
            </div>

            <div className="space-y-4">
              {/* Время окончания */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Время окончания *
                </label>
                <input
                  type="datetime-local"
                  value={finishFormData.finish}
                  onChange={(e) => setFinishFormData({ finish: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  По умолчанию установлено текущее время
                </p>
              </div>

              {/* Предупреждение */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>⚠️ Внимание:</strong><br/>
                  После завершения смены будет автоматически рассчитана длительность и сумма оплаты.
                </p>
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseFinishModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleFinishShift}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Завершить смену
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timesheet;