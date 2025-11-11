import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Building2, Phone, MapPin, CreditCard, X, AlertCircle } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);

  const [formData, setFormData] = useState({
    full_title: '',
    short_title: '',
    IIN_BIN: '',
    adress: '',
    IBAN: '',
    BIC: '',
    phone: '',
    is_active: true
  });

  useEffect(() => {
    fetchAgents();
  }, []);

  // Загрузка контрагентов
  const fetchAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/v1/agents/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Ошибка загрузки данных');
      
      const data = await response.json();
      setAgents(data.results || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Создание или обновление контрагента
  const handleCreateOrUpdate = async () => {
    // Валидация обязательных полей
    if (!formData.full_title || !formData.IIN_BIN) {
      alert('Пожалуйста, заполните обязательные поля: Полное название и ИИН/БИН');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const url = editingAgent 
        ? `${API_BASE_URL}/v1/agents/${editingAgent.id}/`
        : `${API_BASE_URL}/v1/agents/`;
      
      const method = editingAgent ? 'PUT' : 'POST';

      console.log('Отправляем данные:', formData);
      console.log('URL:', url);
      console.log('Method:', method);

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Ошибка от сервера:', errorData);
        
        // Формируем понятное сообщение об ошибке
        let errorMessage = 'Ошибка сохранения:\n';
        if (typeof errorData === 'object') {
          for (const [field, errors] of Object.entries(errorData)) {
            if (Array.isArray(errors)) {
              errorMessage += `${field}: ${errors.join(', ')}\n`;
            } else {
              errorMessage += `${field}: ${errors}\n`;
            }
          }
        } else {
          errorMessage = errorData.detail || errorData.toString() || 'Неизвестная ошибка';
        }
        
        throw new Error(errorMessage);
      }

      await fetchAgents();
      handleCloseModal();
    } catch (err) {
      console.error('Полная ошибка:', err);
      alert(err.message);
    }
  };

  // Удаление контрагента
  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого контрагента?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/v1/agents/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Ошибка удаления');

      await fetchAgents();
    } catch (err) {
      alert(err.message);
    }
  };

  // Редактирование контрагента
  const handleEdit = (agent) => {
    setEditingAgent(agent);
    setFormData({
      full_title: agent.full_title || '',
      short_title: agent.short_title || '',
      IIN_BIN: agent.IIN_BIN || '',
      adress: agent.adress || '',
      IBAN: agent.IBAN || '',
      BIC: agent.BIC || '',
      phone: agent.phone || '',
      is_active: agent.is_active !== undefined ? agent.is_active : true
    });
    setShowModal(true);
  };

  // Закрытие модального окна
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAgent(null);
    setFormData({
      full_title: '',
      short_title: '',
      IIN_BIN: '',
      adress: '',
      IBAN: '',
      BIC: '',
      phone: '',
      is_active: true
    });
  };

  // Фильтрация контрагентов
  const filteredAgents = agents.filter(agent => {
    const fullTitle = agent.full_title?.toLowerCase() || '';
    const shortTitle = agent.short_title?.toLowerCase() || '';
    const iinBin = agent.IIN_BIN || '';
    const phone = agent.phone || '';
    const search = searchTerm.toLowerCase();
    
    return fullTitle.includes(search) || shortTitle.includes(search) || 
           iinBin.includes(search) || phone.includes(search);
  });

  // Статистика
  const stats = {
    total: agents.length,
    active: agents.filter(a => a.is_active).length,
    inactive: agents.filter(a => !a.is_active).length
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <span>Ошибка: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Заголовок и кнопка добавления */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Контрагенты</h2>
          <p className="text-gray-600 mt-1">Управление контрагентами и партнёрами</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
        >
          <Plus size={20} />
          Добавить контрагента
        </button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Всего контрагентов</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Building2 className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Активные</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <Building2 className="text-green-600" size={32} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Неактивные</p>
              <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
            </div>
            <Building2 className="text-gray-600" size={32} />
          </div>
        </div>
      </div>

      {/* Поиск */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Поиск по названию, ИИН/БИН, телефону..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Таблица контрагентов */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Название
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ИИН/БИН
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Телефон
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Адрес
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'Контрагенты не найдены' : 'Нет контрагентов. Добавьте первого контрагента!'}
                  </td>
                </tr>
              ) : (
                filteredAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <Building2 className="text-blue-600" size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{agent.full_title}</div>
                          {agent.short_title && (
                            <div className="text-xs text-gray-500">{agent.short_title}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-900">{agent.IIN_BIN}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {agent.phone ? (
                        <div className="flex items-center text-sm text-gray-900">
                          <Phone size={16} className="mr-2 text-gray-400" />
                          {agent.phone}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {agent.adress ? (
                        <div className="flex items-start text-sm text-gray-900">
                          <MapPin size={16} className="mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{agent.adress}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        agent.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {agent.is_active ? 'Активный' : 'Неактивный'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(agent)}
                        className="text-blue-600 hover:text-blue-900 mr-4 inline-flex items-center gap-1"
                      >
                        <Edit size={16} />
                        Изменить
                      </button>
                      <button
                        onClick={() => handleDelete(agent.id)}
                        className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                      >
                        <Trash2 size={16} />
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальное окно добавления/редактирования */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">
                {editingAgent ? 'Редактировать контрагента' : 'Добавить контрагента'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Названия */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Полное название *
                  </label>
                  <input
                    type="text"
                    value={formData.full_title}
                    onChange={(e) => setFormData({ ...formData, full_title: e.target.value })}
                    placeholder="ТОО «Туристическая Компания»"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Краткое название
                  </label>
                  <input
                    type="text"
                    value={formData.short_title}
                    onChange={(e) => setFormData({ ...formData, short_title: e.target.value })}
                    placeholder="ТК Тур"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ИИН/БИН *
                  </label>
                  <input
                    type="text"
                    value={formData.IIN_BIN}
                    onChange={(e) => setFormData({ ...formData, IIN_BIN: e.target.value })}
                    placeholder="123456789012"
                    maxLength="12"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    required
                  />
                </div>
              </div>

              {/* Контакты */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+7 (___) ___-__-__"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Юридический адрес
                  </label>
                  <input
                    type="text"
                    value={formData.adress}
                    onChange={(e) => setFormData({ ...formData, adress: e.target.value })}
                    placeholder="г. Караганда, ул. Ленина, д. 1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Банковские реквизиты */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Банковские реквизиты</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IBAN
                    </label>
                    <input
                      type="text"
                      value={formData.IBAN}
                      onChange={(e) => setFormData({ ...formData, IBAN: e.target.value })}
                      placeholder="KZ123456789012345678"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      БИК (Код банка)
                    </label>
                    <input
                      type="text"
                      value={formData.BIC}
                      onChange={(e) => setFormData({ ...formData, BIC: e.target.value })}
                      placeholder="KCJBKZKX"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Статус */}
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Активный контрагент</span>
                </label>
              </div>

              {/* Информация об обязательных полях */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>* Обязательные поля:</strong> Полное название, ИИН/БИН
                </p>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateOrUpdate}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingAgent ? 'Сохранить изменения' : 'Добавить контрагента'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agents;