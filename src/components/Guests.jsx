import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Users, Phone, Mail, Calendar, AlertCircle, X } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const Guests = () => {
  const [guests, setGuests] = useState([]);
  const [nationalities, setNationalities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    nationality: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: 'M',
    notes: ''
  });

  useEffect(() => {
    fetchGuests();
    fetchNationalities();
  }, []);

  // Загрузка гостей
  const fetchGuests = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/v1/guests/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Ошибка загрузки гостей');
      
      const data = await response.json();
      setGuests(data.results || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка национальностей
  const fetchNationalities = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/v1/nationalities/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const allNationalities = data.results || data;
        
        // Сортируем: Казахстан первым
        const sorted = allNationalities.sort((a, b) => {
          if (a.nationality?.toLowerCase().includes('казахстан')) return -1;
          if (b.nationality?.toLowerCase().includes('казахстан')) return 1;
          return (a.nationality || '').localeCompare(b.nationality || '');
        });
        
        setNationalities(sorted);
      }
    } catch (err) {
      console.error('Ошибка загрузки национальностей:', err);
    }
  };

  // Создание или обновление гостя
  const handleCreateOrUpdate = async () => {
    // Валидация обязательных полей
    if (!formData.first_name || !formData.last_name || !formData.nationality) {
      alert('Пожалуйста, заполните обязательные поля: Имя, Фамилия, Гражданство');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const url = editingGuest 
        ? `${API_BASE_URL}/v1/guests/${editingGuest.id}/`
        : `${API_BASE_URL}/v1/guests/`;
      
      const method = editingGuest ? 'PUT' : 'POST';

      // Подготовка данных - удаляем пустые необязательные поля
      const dataToSend = { ...formData };
      
      // ВАЖНО: Если телефон пустой, удаляем его из запроса полностью
      // Иначе бэкенд будет валидировать уникальность пустой строки
      if (!dataToSend.phone || dataToSend.phone.trim() === '') {
        delete dataToSend.phone;
      }
      
      if (!dataToSend.email || dataToSend.email.trim() === '') {
        dataToSend.email = '';
      }
      if (!dataToSend.middle_name || dataToSend.middle_name.trim() === '') {
        dataToSend.middle_name = '';
      }
      if (!dataToSend.date_of_birth) {
        delete dataToSend.date_of_birth;
      }
      if (!dataToSend.notes || dataToSend.notes.trim() === '') {
        dataToSend.notes = '';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.detail 
          || errorData.phone?.[0]
          || errorData.email?.[0]
          || JSON.stringify(errorData)
          || 'Ошибка сохранения';
        throw new Error(errorMessage);
      }

      await fetchGuests();
      handleCloseModal();
    } catch (err) {
      alert(err.message);
    }
  };

  // Удаление гостя
  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого гостя?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/v1/guests/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Ошибка удаления');

      await fetchGuests();
    } catch (err) {
      alert(err.message);
    }
  };

  // Редактирование гостя
  const handleEdit = (guest) => {
    setEditingGuest(guest);
    setFormData({
      first_name: guest.first_name || '',
      last_name: guest.last_name || '',
      middle_name: guest.middle_name || '',
      nationality: guest.nationality?.id || guest.nationality || '',
      phone: guest.phone || '',
      email: guest.email || '',
      date_of_birth: guest.date_of_birth || '',
      gender: guest.gender || 'M',
      notes: guest.notes || ''
    });
    setShowModal(true);
  };

  // Закрытие модального окна
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGuest(null);
    setFormData({
      first_name: '',
      last_name: '',
      middle_name: '',
      nationality: '',
      phone: '',
      email: '',
      date_of_birth: '',
      gender: 'M',
      notes: ''
    });
  };

  // Фильтрация гостей
  const filteredGuests = guests.filter(guest => {
    const fullName = guest.full_name?.toLowerCase() || '';
    const phone = guest.phone || '';
    const email = guest.email?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    return fullName.includes(search) || phone.includes(search) || email.includes(search);
  });

  // Статистика
  const stats = {
    total: guests.length,
    blacklisted: guests.filter(g => g.blacklisted).length
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
          <h2 className="text-3xl font-bold text-gray-900">Гости</h2>
          <p className="text-gray-600 mt-1">Управление базой гостей отеля</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
        >
          <Plus size={20} />
          Добавить гостя
        </button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Всего гостей</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">В черном списке</p>
              <p className="text-2xl font-bold text-red-600">{stats.blacklisted}</p>
            </div>
            <AlertCircle className="text-red-600" size={32} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Найдено</p>
              <p className="text-2xl font-bold text-green-600">{filteredGuests.length}</p>
            </div>
            <Search className="text-green-600" size={32} />
          </div>
        </div>
      </div>

      {/* Поиск */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Поиск по ИИН, имени, телефону, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Таблица гостей */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ФИО
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Гражданство
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Телефон
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата рождения
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'Гости не найдены' : 'Нет гостей. Добавьте первого гостя!'}
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <Users className="text-blue-600" size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{guest.full_name}</div>
                          {guest.blacklisted && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Черный список
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {guest.nationality?.nationality || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {guest.phone ? (
                        <div className="flex items-center text-sm text-gray-900">
                          <Phone size={16} className="mr-2 text-gray-400" />
                          {guest.phone}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {guest.email ? (
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail size={16} className="mr-2 text-gray-400" />
                          {guest.email}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {guest.date_of_birth ? (
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar size={16} className="mr-2 text-gray-400" />
                          {new Date(guest.date_of_birth).toLocaleDateString('ru-RU')}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(guest)}
                        className="text-blue-600 hover:text-blue-900 mr-4 inline-flex items-center gap-1"
                      >
                        <Edit size={16} />
                        Изменить
                      </button>
                      <button
                        onClick={() => handleDelete(guest.id)}
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
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">
                {editingGuest ? 'Редактировать гостя' : 'Добавить нового гостя'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* ФИО */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Фамилия *
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Иванов"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Имя *
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="Иван"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Отчество
                  </label>
                  <input
                    type="text"
                    value={formData.middle_name}
                    onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                    placeholder="Иванович"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Гражданство и пол */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Гражданство *
                  </label>
                  <select
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Выберите гражданство</option>
                    {nationalities.map((nat) => (
                      <option key={nat.id} value={nat.id}>
                        {nat.nationality}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Пол
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="M">Мужской</option>
                    <option value="F">Женский</option>
                    <option value="O">Другой</option>
                  </select>
                </div>
              </div>

              {/* Дата рождения */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата рождения
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Телефон и Email - НЕОБЯЗАТЕЛЬНЫЕ */}
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
                  <p className="text-xs text-gray-500 mt-1">Необязательное поле</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@mail.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Необязательное поле</p>
                </div>
              </div>

              {/* Примечания */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Примечания
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Дополнительная информация о госте"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Информация об обязательных полях */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>* Обязательные поля:</strong> Фамилия, Имя, Гражданство
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  Телефон и Email - необязательные поля
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
                {editingGuest ? 'Сохранить изменения' : 'Добавить гостя'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Guests;