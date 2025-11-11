import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, Users, Home, Clock, X, Search,
  ChevronRight, Edit, Trash2, UserPlus, ListPlus
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Модальные окна
  const [showModal, setShowModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showGuestSelectModal, setShowGuestSelectModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  
  // Форма одиночного бронирования
  const [formData, setFormData] = useState({
    room: '',
    guest: '',
    check_in: '',      // ← Правильное имя!
    check_out: '',     // ← Правильное имя!
    status: 1
  });
  
  // Форма группового бронирования
  const [groupFormData, setGroupFormData] = useState({
    rooms: [],
    guests: [],
    check_in: '',
    check_out: '',
    status: 1
  });
  
  const [guestSearch, setGuestSearch] = useState('');

  useEffect(() => {
    fetchBookings();
    fetchRooms();
    fetchGuests();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/v1/bookings/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const bookingsList = data.results || data;
        console.log('✅ Загружено бронирований:', bookingsList.length);
        if (bookingsList.length > 0) {
          console.log('📋 Первое бронирование:', bookingsList[0]);
          console.log('📋 Поля:', Object.keys(bookingsList[0]));
          console.log('📅 Даты первого бронирования:');
          console.log('   check_in:', bookingsList[0].check_in);
          console.log('   check_out:', bookingsList[0].check_out);
          console.log('   Тип check_in:', typeof bookingsList[0].check_in);
          console.log('   Тип check_out:', typeof bookingsList[0].check_out);
        }
        setBookings(bookingsList);
      } else {
        console.error('❌ Ошибка загрузки бронирований:', response.status);
      }
    } catch (err) {
      console.error('❌ Ошибка загрузки бронирований:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.error('Нет токена авторизации');
        return;
      }

      let allRooms = [];
      let nextUrl = `${API_BASE_URL}/v1/rooms/?page_size=100`;
      
      // Загружаем все страницы
      while (nextUrl) {
        const response = await fetch(nextUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          console.error('Ошибка загрузки номеров:', response.status);
          break;
        }
        
        const data = await response.json();
        allRooms = [...allRooms, ...(data.results || [])];
        nextUrl = data.next; // Следующая страница
      }
      
      console.log('Загружено номеров:', allRooms.length);
      console.log('Номера:', allRooms.map(r => r.room).sort((a, b) => a - b));
      setRooms(allRooms);
    } catch (err) {
      console.error('Ошибка загрузки номеров:', err);
    }
  };

  const fetchGuests = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/v1/guests/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const guestsList = data.results || data;
        console.log('✅ Загружено гостей:', guestsList.length);
        setGuests(guestsList);
      } else {
        console.error('❌ Ошибка загрузки гостей:', response.status);
      }
    } catch (err) {
      console.error('❌ Ошибка загрузки гостей:', err);
    }
  };

  // Фильтрация бронирований по выбранной дате
  // Фильтрация бронирований по выбранной дате
  const filteredBookings = bookings.filter(booking => {
    if (!selectedDate) return true; // Показать все если дата не выбрана
    
    const checkIn = new Date(booking.check_in);
    const selected = new Date(selectedDate);
    
    // Нормализация дат (убираем время)
    checkIn.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);
    
    // Показываем бронирования которые:
    // Начинаются С выбранной даты включительно (заезд >= выбранная дата)
    return checkIn >= selected;
  });

  // Логирование для диагностики
  React.useEffect(() => {
    if (bookings.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🔍 Фильтр: ${selectedDate || 'НЕТ (показать все)'}`);
      console.log(`📊 Всего бронирований в базе: ${bookings.length}`);
      console.log(`✅ Отфильтровано: ${filteredBookings.length}`);
      
      if (selectedDate && bookings.length > 0) {
        console.log('\n📋 Детали бронирований (показываем с заездом >= выбранной даты):');
        bookings.forEach((b, i) => {
          const checkIn = new Date(b.check_in);
          const selected = new Date(selectedDate);
          checkIn.setHours(0, 0, 0, 0);
          selected.setHours(0, 0, 0, 0);
          
          const matchesFilter = checkIn >= selected;
          console.log(`${i + 1}. Номер ${b.room_number || b.room || '?'}: заезд ${b.check_in} ${matchesFilter ? '✅' : '❌'}`);
        });
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
  }, [bookings, selectedDate, filteredBookings]);

  // Группировка по датам заезда
  const groupedBookings = filteredBookings.reduce((groups, booking) => {
    const date = booking.check_in;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(booking);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedBookings).sort();

  // Создать/обновить бронирование
  const handleSubmit = async () => {
    if (!formData.room || !formData.guest || !formData.check_in || !formData.check_out) {
      alert('Заполните все обязательные поля');
      return;
    }

    // Валидация формата дат
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.check_in)) {
      alert('❌ Неправильный формат даты заезда: ' + formData.check_in);
      console.error('Invalid check_in:', formData.check_in);
      return;
    }
    if (!dateRegex.test(formData.check_out)) {
      alert('❌ Неправильный формат даты выезда: ' + formData.check_out);
      console.error('Invalid check_out:', formData.check_out);
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      
      // Добавляем created_by (ID текущего пользователя)
      const dataToSend = {
        ...formData,
        created_by: 1 // TODO: получить реальный ID пользователя
      };
      
      console.log('📝 Создаём бронирование:');
      console.log('   Номер:', dataToSend.room);
      console.log('   Гость:', dataToSend.guest);
      console.log('   Заезд:', dataToSend.check_in);
      console.log('   Выезд:', dataToSend.check_out);
      console.log('   Статус:', dataToSend.status);
      console.log('   Created by:', dataToSend.created_by);
      console.log('   Полные данные:', JSON.stringify(dataToSend, null, 2));

      const url = editingBooking 
        ? `${API_BASE_URL}/v1/bookings/${editingBooking.id}/`
        : `${API_BASE_URL}/v1/bookings/`;
      const method = editingBooking ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Бронирование создано:', result);
        await fetchBookings();
        handleCloseModal();
        alert(editingBooking ? 'Бронирование обновлено!' : 'Бронирование создано!');
      } else {
        const error = await response.json();
        console.error('❌ Ошибка от сервера:', error);
        
        // Красивое отображение ошибок
        let errorMessage = 'Ошибка при сохранении:\n\n';
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

  // Групповое бронирование
  const handleGroupSubmit = async () => {
    if (groupFormData.rooms.length === 0 || groupFormData.guests.length === 0 
        || !groupFormData.check_in || !groupFormData.check_out) {
      alert('Выберите хотя бы один номер, одного гостя и укажите даты');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      
      // Создаём бронирования для каждой комбинации номер-гость
      const bookingsToCreate = [];
      const minLength = Math.min(groupFormData.rooms.length, groupFormData.guests.length);
      
      for (let i = 0; i < minLength; i++) {
        bookingsToCreate.push({
          room: groupFormData.rooms[i],
          guest: groupFormData.guests[i],
          check_in: groupFormData.check_in,
          check_out: groupFormData.check_out,
          status: groupFormData.status,
          created_by: 1 // TODO: получить реальный ID пользователя
        });
      }

      console.log('📝 Создаём групповые бронирования:', bookingsToCreate);

      // Создаём все бронирования параллельно
      const promises = bookingsToCreate.map(booking =>
        fetch(`${API_BASE_URL}/v1/bookings/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(booking)
        })
      );

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.ok).length;
      const failedCount = results.length - successCount;

      console.log(`✅ Успешно: ${successCount}, ❌ Ошибок: ${failedCount}`);

      // Показываем ошибки если есть
      if (failedCount > 0) {
        const errors = await Promise.all(
          results.map(async (r, i) => {
            if (!r.ok) {
              const error = await r.json();
              return `Бронирование #${i + 1}: ${JSON.stringify(error)}`;
            }
            return null;
          })
        );
        const errorList = errors.filter(e => e !== null).join('\n');
        console.error('❌ Ошибки при создании:', errorList);
      }

      await fetchBookings();
      handleCloseGroupModal();
      
      if (failedCount === 0) {
        alert(`✅ Все бронирования созданы успешно!\n\nСоздано: ${successCount}`);
      } else {
        alert(`⚠️ Создано частично\n\n✅ Успешно: ${successCount}\n❌ Ошибок: ${failedCount}\n\nПроверьте консоль для деталей`);
      }
    } catch (err) {
      console.error('❌ Критическая ошибка:', err);
      alert('Ошибка при групповом бронировании: ' + err.message);
    }
  };

  const handleEdit = (booking) => {
    setEditingBooking(booking);
    setFormData({
      room: booking.room,
      guest: booking.guest,
      check_in: booking.check_in,
      check_out: booking.check_out,
      status: booking.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить бронирование?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/v1/bookings/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchBookings();
        alert('Бронирование удалено');
      }
    } catch (err) {
      console.error('Ошибка:', err);
      alert('Ошибка при удалении');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBooking(null);
    setFormData({
      room: '',
      guest: '',
      check_in: '',
      check_out: '',
      status: 1
    });
  };

  const handleCloseGroupModal = () => {
    setShowGroupModal(false);
    setGroupFormData({
      rooms: [],
      guests: [],
      check_in: '',
      check_out: '',
      status: 1
    });
  };

  const filteredGuestsForSearch = guests.filter(g =>
    g.full_name.toLowerCase().includes(guestSearch.toLowerCase())
  );

  const toggleRoom = (roomId) => {
    setGroupFormData(prev => ({
      ...prev,
      rooms: prev.rooms.includes(roomId)
        ? prev.rooms.filter(id => id !== roomId)
        : [...prev.rooms, roomId]
    }));
  };

  const toggleGuest = (guestId) => {
    setGroupFormData(prev => ({
      ...prev,
      guests: prev.guests.includes(guestId)
        ? prev.guests.filter(id => id !== guestId)
        : [...prev.guests, guestId]
    }));
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 1: return 'bg-yellow-100 text-yellow-800';
      case 2: return 'bg-green-100 text-green-800';
      case 3: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 1: return 'Забронировано';
      case 2: return 'Заселено';
      case 3: return 'Выселено';
      default: return 'Неизвестно';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Заголовок */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Бронирования</h2>
          <p className="text-gray-600 mt-1">Управление бронированиями номеров</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              // При групповом бронировании автоматически устанавливаем даты
              const today = new Date().toISOString().split('T')[0];
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              const tomorrowStr = tomorrow.toISOString().split('T')[0];
              
              // Если выбрана дата в фильтре И она не пустая, используем её
              const checkInDate = (selectedDate && selectedDate !== '') ? selectedDate : today;
              
              console.log('🎯 Групповое бронирование:');
              console.log('   selectedDate:', selectedDate);
              console.log('   checkInDate:', checkInDate);
              console.log('   checkOutDate:', tomorrowStr);
              
              setGroupFormData({
                rooms: [],
                guests: [],
                check_in: checkInDate,
                check_out: tomorrowStr,
                status: 1
              });
              setShowGroupModal(true);
            }}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ListPlus size={20} />
            Групповое бронирование
          </button>
          <button
            onClick={() => {
              // При создании нового бронирования автоматически устанавливаем даты
              const today = new Date().toISOString().split('T')[0];
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              const tomorrowStr = tomorrow.toISOString().split('T')[0];
              
              // Если выбрана дата в фильтре И она не пустая, используем её
              const checkInDate = (selectedDate && selectedDate !== '') ? selectedDate : today;
              
              console.log('🎯 Создание нового бронирования:');
              console.log('   selectedDate:', selectedDate);
              console.log('   checkInDate:', checkInDate);
              console.log('   checkOutDate:', tomorrowStr);
              
              setFormData({
                room: '',
                guest: '',
                check_in: checkInDate,
                check_out: tomorrowStr,
                status: 1
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Plus size={20} />
            Добавить бронирование
          </button>
        </div>
      </div>

      {/* Выбор даты */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center gap-4">
          <Calendar className="text-blue-600" size={24} />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Фильтр по дате (показать бронирования с заездом начиная с этой даты)
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              />
              <button
                onClick={() => setSelectedDate('')}
                className="px-4 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50"
              >
                Показать все
              </button>
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                С сегодня
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              {selectedDate ? 'Будущие бронирования' : 'Все бронирования'}
            </p>
            <p className="text-3xl font-bold text-blue-600">{filteredBookings.length}</p>
            {selectedDate && bookings.length > filteredBookings.length && (
              <p className="text-xs text-gray-500 mt-1">
                из {bookings.length} всего
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Список бронирований по датам */}
      <div className="space-y-6">
        {/* Индикатор активного фильтра */}
        {selectedDate && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="text-blue-600" size={20} />
              <div>
                <p className="font-medium text-blue-900">
                  Фильтр: с {new Date(selectedDate).toLocaleDateString('ru-RU', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })} включительно
                </p>
                <p className="text-sm text-blue-700">
                  Показаны бронирования с заездом начиная с этой даты
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedDate('')}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-300"
            >
              Сбросить фильтр
            </button>
          </div>
        )}

        {sortedDates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
            {selectedDate ? (
              <>
                <p className="text-gray-500 text-lg mb-2">
                  Нет бронирований с заездом начиная с выбранной даты
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  {new Date(selectedDate).toLocaleDateString('ru-RU', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })} и позже
                </p>
                <button
                  onClick={() => setSelectedDate('')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Показать все бронирования
                </button>
              </>
            ) : (
              <p className="text-gray-500 text-lg">Нет бронирований в системе</p>
            )}
          </div>
        ) : (
          sortedDates.map((date, idx) => (
            <div key={date}>
              {/* Заголовок группы */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-300"></div>
                <div className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold flex items-center gap-2">
                  <Calendar size={18} />
                  Заезд: {
                    date && date !== 'Invalid Date' && date !== 'null' && date !== ''
                      ? new Date(date).toLocaleDateString('ru-RU', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })
                      : '⚠️ Не указана'
                  }
                  <span className="bg-white text-blue-600 px-2 py-0.5 rounded-full text-sm">
                    {groupedBookings[date].length}
                  </span>
                </div>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>

              {/* Бронирования в группе */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {groupedBookings[date].map(booking => {
                  // Универсальное получение номера комнаты
                  const roomDisplay = booking.room_number || booking.room || booking.room_id || 'N/A';
                  const guestDisplay = booking.guest_name || booking.guest || 'Гость';
                  
                  return (
                  <div key={booking.id} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Home className="text-blue-600" size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">Номер {roomDisplay}</p>
                          <p className="text-sm text-gray-600">{guestDisplay}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={14} />
                        <span>
                          Заезд: {
                            booking.check_in && booking.check_in !== 'Invalid Date'
                              ? new Date(booking.check_in).toLocaleDateString('ru-RU')
                              : '⚠️ Не указана'
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={14} />
                        <span>
                          Выезд: {
                            booking.check_out && booking.check_out !== 'Invalid Date'
                              ? new Date(booking.check_out).toLocaleDateString('ru-RU')
                              : '⚠️ Не указана'
                          }
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t">
                      <button
                        onClick={() => handleEdit(booking)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit size={16} />
                        <span className="text-sm">Изменить</span>
                      </button>
                      <button
                        onClick={() => handleDelete(booking.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                        <span className="text-sm">Удалить</span>
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Модальное окно одиночного бронирования */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">
                {editingBooking ? 'Редактировать бронирование' : 'Новое бронирование'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Номер */}
              <div>
                <label className="block text-sm font-medium mb-1">Номер *</label>
                <select
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  disabled={rooms.length === 0}
                >
                  <option value="">
                    {rooms.length === 0 ? 'Нет доступных номеров' : 'Выберите номер'}
                  </option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      Номер {r.room}
                    </option>
                  ))}
                </select>
                {rooms.length === 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ Сначала добавьте номера в системе
                  </p>
                )}
              </div>

              {/* Гость */}
              <div>
                <label className="block text-sm font-medium mb-1">Гость *</label>
                <button
                  onClick={() => guests.length > 0 && setShowGuestSelectModal(true)}
                  className="w-full px-3 py-2 border rounded-lg text-left hover:bg-gray-50 flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={guests.length === 0}
                >
                  <span className={formData.guest ? 'text-gray-900' : 'text-gray-500'}>
                    {guests.length === 0 
                      ? 'Нет доступных гостей'
                      : formData.guest 
                        ? guests.find(g => g.id === parseInt(formData.guest))?.full_name || 'Выберите гостя'
                        : 'Выберите гостя'}
                  </span>
                  <Search size={16} className="text-gray-400" />
                </button>
                {guests.length === 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ Сначала добавьте гостей в системе
                  </p>
                )}
              </div>

              {/* Даты */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Дата заезда *</label>
                  <input
                    type="date"
                    value={formData.check_in}
                    onChange={(e) => {
                      console.log('📅 Изменена дата заезда:', e.target.value);
                      setFormData({ ...formData, check_in: e.target.value });
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Значение: {formData.check_in || 'не установлено'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Дата выезда *</label>
                  <input
                    type="date"
                    value={formData.check_out}
                    onChange={(e) => {
                      console.log('📅 Изменена дата выезда:', e.target.value);
                      setFormData({ ...formData, check_out: e.target.value });
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Значение: {formData.check_out || 'не установлено'}
                  </p>
                </div>
              </div>

              {/* Статус */}
              <div>
                <label className="block text-sm font-medium mb-1">Статус</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value={1}>Забронировано</option>
                  <option value={2}>Заселено</option>
                  <option value={3}>Выселено</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingBooking ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно выбора гостя */}
      {showGuestSelectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold mb-4">Выберите гостя</h3>
              <input
                type="text"
                placeholder="Поиск по имени..."
                value={guestSearch}
                onChange={(e) => setGuestSearch(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-2">
                {filteredGuestsForSearch.map(guest => (
                  <button
                    key={guest.id}
                    onClick={() => {
                      setFormData({ ...formData, guest: guest.id });
                      setShowGuestSelectModal(false);
                      setGuestSearch('');
                    }}
                    className="w-full p-3 border rounded-lg hover:bg-blue-50 text-left"
                  >
                    <p className="font-medium">{guest.full_name}</p>
                    {guest.phone && (
                      <p className="text-sm text-gray-600">{guest.phone}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 border-t">
              <button
                onClick={() => {
                  setShowGuestSelectModal(false);
                  setGuestSearch('');
                }}
                className="w-full px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно группового бронирования */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold">Групповое бронирование</h3>
              <button onClick={handleCloseGroupModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Даты */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Дата заезда *</label>
                  <input
                    type="date"
                    value={groupFormData.check_in}
                    onChange={(e) => setGroupFormData({ ...groupFormData, check_in: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Дата выезда *</label>
                  <input
                    type="date"
                    value={groupFormData.check_out}
                    onChange={(e) => setGroupFormData({ ...groupFormData, check_out: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Выбор номеров */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Выберите номера * ({groupFormData.rooms.length} выбрано)
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto border rounded-lg p-4">
                  {rooms.map(r => (
                    <button
                      key={r.id}
                      onClick={() => toggleRoom(r.id)}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        groupFormData.rooms.includes(r.id)
                          ? 'bg-blue-50 border-blue-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <p className="font-medium">№ {r.room}</p>
                      <p className="text-xs text-gray-600">{r.room_type_display || 'Стандарт'}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Выбор гостей */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Выберите гостей * ({groupFormData.guests.length} выбрано)
                </label>
                <input
                  type="text"
                  placeholder="Поиск по имени..."
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg mb-2"
                />
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-lg p-4">
                  {filteredGuestsForSearch.map(guest => (
                    <button
                      key={guest.id}
                      onClick={() => toggleGuest(guest.id)}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        groupFormData.guests.includes(guest.id)
                          ? 'bg-purple-50 border-purple-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <p className="font-medium">{guest.full_name}</p>
                      {guest.phone && (
                        <p className="text-xs text-gray-600">{guest.phone}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Информация о создании */}
              {groupFormData.rooms.length > 0 && groupFormData.guests.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    Будет создано бронирований: {Math.min(groupFormData.rooms.length, groupFormData.guests.length)}
                  </p>
                  <p className="text-xs text-blue-700">
                    Система создаст бронирования, комбинируя выбранные номера и гостей по порядку
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={handleCloseGroupModal}
                className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleGroupSubmit}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Создать бронирования
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;