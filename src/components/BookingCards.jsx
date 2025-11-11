import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit, Trash2, FileText, Home, 
  ShoppingCart, DollarSign, X, AlertCircle,
  MinusCircle, PlusCircle, LogOut, CreditCard, Banknote, Building2, CheckCircle, XCircle, RefreshCw
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const BookingCards = () => {
  const [bookingCards, setBookingCards] = useState([]);
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [agents, setAgents] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [goods, setGoods] = useState([]);
  const [services, setServices] = useState([]);
  const [tempBookings, setTempBookings] = useState([]); // Временное хранилище созданных бронирований
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentCardForPayment, setCurrentCardForPayment] = useState(null);
  const [showGuestSelectModal, setShowGuestSelectModal] = useState(false); // Модалка выбора гостя
  const [showAgentSelectModal, setShowAgentSelectModal] = useState(false); // Модалка выбора контрагента
  const [showBookingGuestModal, setShowBookingGuestModal] = useState(false); // Модалка выбора гостя в бронировании
  const [showBookingAgentModal, setShowBookingAgentModal] = useState(false); // Модалка выбора контрагента в бронировании
  const [guestSearchTerm, setGuestSearchTerm] = useState(''); // Поиск гостей
  const [agentSearchTerm, setAgentSearchTerm] = useState(''); // Поиск контрагентов

  // Данные для новых бронирований
  const [newBookingData, setNewBookingData] = useState({
    guest: '',
    agent: '',
    room: '',
    check_in: '',
    check_out: '',
    note: ''
  });

  // Список временно созданных бронирований для новой карточки
  const [temporaryBookings, setTemporaryBookings] = useState([]);

  // Данные для оплаты
  const [paymentData, setPaymentData] = useState({
    type: 'card', // card, cash, bank
    amount: '',
    agent: '',
    cheque_id: '',
    reference_number: '',
    bank_name: ''
  });

  const [formData, setFormData] = useState({
    primary_guest: '',
    agent: '', // Добавлено: контрагент для всей карточки
    bookings: [],
    goods: {},
    services: {},
    status: 1,
    total_amount: 0
  });

  useEffect(() => {
    fetchBookingCards();
    fetchGuests();
    fetchRooms();
    fetchAgents();
    fetchWorkers();
    fetchGoods();
    fetchServices();
  }, []);

  // Отслеживание изменений formData.bookings
  useEffect(() => {
    console.log('🔔 formData.bookings изменился:', formData.bookings);
  }, [formData.bookings]);

  // Загрузка всех данных
  const fetchBookingCards = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/v1/booking-cards/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Ошибка загрузки карточек');
      const data = await response.json();
      const cards = data.results || data;
      setBookingCards(cards);
      
      // ✅ Автоматически загружаем платежи если карточек немного (до 10)
      if (cards.length > 0 && cards.length <= 10) {
        console.log('💰 Автоматически загружаем платежи для', cards.length, 'карточек...');
        const updatedCards = await Promise.all(
          cards.map(async (card) => {
            const payments = await fetchCardPayments(card.id);
            return { ...card, ...payments };
          })
        );
        setBookingCards(updatedCards);
        console.log('✅ Платежи загружены');
      } else if (cards.length > 10) {
        console.log(`ℹ️ Карточек много (${cards.length}), платежи будут загружаться по требованию`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
        setGuests(data.results || data);
      }
    } catch (err) {
      console.error('Ошибка загрузки гостей:', err);
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

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/v1/agents/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAgents(data.results || data);
      }
    } catch (err) {
      console.error('Ошибка загрузки контрагентов:', err);
    }
  };

  const fetchWorkers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/v1/workers/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setWorkers(data.results || data);
      }
    } catch (err) {
      console.error('Ошибка загрузки сотрудников:', err);
    }
  };

  const fetchGoods = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/v1/goods/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setGoods(data.results || data);
      }
    } catch (err) {
      console.error('Ошибка загрузки товаров:', err);
    }
  };

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/v1/services/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setServices(data.results || data);
      }
    } catch (err) {
      console.error('Ошибка загрузки услуг:', err);
    }
  };

  // Создать новое бронирование
  const handleCreateBooking = async () => {
    if (!newBookingData.guest || !newBookingData.room || !newBookingData.check_in || !newBookingData.check_out) {
      alert('Заполните все обязательные поля бронирования');
      return;
    }

    // Используем контрагента из карточки, если не выбран отдельно
    // Проверяем явно на пустую строку и null/undefined
    let agentToUse = null;
    if (newBookingData.agent && newBookingData.agent !== '') {
      // Если в форме бронирования выбран контрагент - используем его
      agentToUse = parseInt(newBookingData.agent);
      console.log('📋 Используем контрагента из формы бронирования:', agentToUse);
    } else if (formData.agent && formData.agent !== '') {
      // Если не выбран - берём из карточки
      agentToUse = parseInt(formData.agent);
      console.log('📋 Используем контрагента из карточки:', agentToUse);
    } else {
      console.log('📋 Контрагент не указан');
    }

    try {
      const token = localStorage.getItem('access_token');
      const currentUser = workers[0];
      
      const bookingPayload = {
        guest: parseInt(newBookingData.guest),
        agent: agentToUse,
        room: parseInt(newBookingData.room),
        check_in: newBookingData.check_in,
        check_out: newBookingData.check_out,
        note: newBookingData.note || '',
        status: 1, // Забронирован
        created_by: currentUser?.id || 1
      };

      console.log('📝 Создаём бронирование:', bookingPayload);

      const response = await fetch(`${API_BASE_URL}/v1/bookings/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Ошибка создания бронирования:', errorData);
        throw new Error(JSON.stringify(errorData));
      }

      const newBooking = await response.json();
      console.log('✅ Бронирование создано - ПОЛНЫЙ ОБЪЕКТ:');
      console.log(JSON.stringify(newBooking, null, 2));
      
      // ⚠️ WORKAROUND: Сервер не возвращает ID, получаем его из списка
      let bookingId = newBooking.id || newBooking.pk;
      
      if (!bookingId) {
        console.warn('⚠️ Сервер не вернул ID, получаем из списка...');
        
        try {
          // Получаем последние бронирования
          const token = localStorage.getItem('access_token');
          const listResponse = await fetch(`${API_BASE_URL}/v1/bookings/?page_size=10&ordering=-id`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (listResponse.ok) {
            const listData = await listResponse.json();
            const bookings = listData.results || listData;
            
            // Ищем наше бронирование по параметрам
            const foundBooking = bookings.find(b => 
              b.guest === parseInt(newBookingData.guest) &&
              b.room === parseInt(newBookingData.room) &&
              b.check_in === newBooking.check_in &&
              b.check_out === newBooking.check_out
            );
            
            if (foundBooking && foundBooking.id) {
              bookingId = foundBooking.id;
              console.log('✅ ID найден в списке:', bookingId);
            } else {
              console.error('❌ Не удалось найти созданное бронирование в списке');
              console.log('Искали:', newBooking);
              console.log('В списке:', bookings);
            }
          }
        } catch (err) {
          console.error('Ошибка получения списка бронирований:', err);
        }
      }
      
      if (!bookingId) {
        alert('⚠️ Бронирование создано, но не удалось получить его ID.\n\nИсправьте бэкенд: API должен возвращать поле "id" при создании.');
        return;
      }
      
      bookingId = parseInt(bookingId);
      console.log('✅ Используем ID:', bookingId);
      
      // Добавляем полную информацию о бронировании во временный список
      const guestName = guests.find(g => g.id === parseInt(newBookingData.guest))?.full_name || 'Неизвестно';
      const roomNumber = rooms.find(r => r.id === parseInt(newBookingData.room))?.room || '?';
      
      const fullBookingInfo = {
        id: bookingId,
        room_number: roomNumber,
        guest_name: guestName,
        status: 1,
        status_display: 'Забронирован'
      };
      
      console.log('📦 Полная информация о бронировании:', fullBookingInfo);
      
      // Обновляем оба состояния
      setTempBookings(prev => {
        const updated = [...prev, fullBookingInfo];
        console.log('✅ tempBookings обновлены:', updated);
        return updated;
      });
      
      setFormData(prev => {
        console.log('📝 Обновление formData.bookings');
        console.log('  Было:', prev.bookings);
        const updatedBookings = [...prev.bookings, bookingId];
        console.log('  Стало:', updatedBookings);
        
        return {
          ...prev,
          bookings: updatedBookings
        };
      });

      setShowBookingModal(false);
      setNewBookingData({
        guest: '',
        agent: '',
        room: '',
        check_in: '',
        check_out: '',
        note: ''
      });

      alert('Бронирование создано и добавлено в карточку!');
    } catch (err) {
      alert('Ошибка создания бронирования: ' + err.message);
    }
  };

  // Изменить статус бронирования
  const handleChangeBookingStatus = async (bookingId, newStatus) => {
    try {
      const token = localStorage.getItem('access_token');
      
      const bookingResponse = await fetch(`${API_BASE_URL}/v1/bookings/${bookingId}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!bookingResponse.ok) throw new Error('Не удалось загрузить бронирование');
      
      const booking = await bookingResponse.json();

      const response = await fetch(`${API_BASE_URL}/v1/bookings/${bookingId}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...booking,
          status: newStatus
        })
      });

      if (!response.ok) throw new Error('Ошибка изменения статуса');

      await fetchBookingCards();
      alert('Статус бронирования изменён!');
    } catch (err) {
      alert(err.message);
    }
  };

  // Выселить все бронирования
  const handleCheckOutAll = async (cardId) => {
    if (!window.confirm('Выселить все бронирования в этой карточке?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const card = bookingCards.find(c => c.id === cardId);
      
      if (!card || !card.bookings_list) return;

      for (const booking of card.bookings_list) {
        await fetch(`${API_BASE_URL}/v1/bookings/${booking.id}/`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...booking,
            status: 3 // Выселен
          })
        });
      }

      await fetchBookingCards();
      alert('Все гости выселены!');
    } catch (err) {
      alert('Ошибка при выселении: ' + err.message);
    }
  };

  // Добавить оплату
  const handleAddPayment = async () => {
    if (!paymentData.amount || !currentCardForPayment) {
      alert('Укажите сумму оплаты');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      
      // ✅ ВАЖНО: Определяем контрагента
      // 1. Из формы оплаты (если выбран явно)
      // 2. Из формы карточки (если карточка открыта)
      // 3. Из данных карточки бронирования (если есть в бронированиях)
      let agentToUse = null;
      
      if (paymentData.agent) {
        agentToUse = parseInt(paymentData.agent);
        console.log('📋 Контрагент из формы оплаты:', agentToUse);
      } else if (formData.agent) {
        agentToUse = parseInt(formData.agent);
        console.log('📋 Контрагент из формы карточки:', agentToUse);
      } else if (currentCardForPayment.bookings_list && currentCardForPayment.bookings_list.length > 0) {
        // Берём контрагента из первого бронирования в карточке
        const firstBookingAgent = currentCardForPayment.bookings_list[0].agent;
        if (firstBookingAgent) {
          agentToUse = firstBookingAgent;
          console.log('📋 Контрагент из бронирования в карточке:', agentToUse);
        }
      }
      
      if (!agentToUse) {
        alert('⚠️ Необходимо указать контрагента.\n\nВыберите контрагента в форме оплаты или создайте карточку с контрагентом.');
        return;
      }
      
      let endpoint = '';
      let payload = {
        amount: paymentData.amount,
        booking_card: currentCardForPayment.id,
        agent: agentToUse
      };

      // Выбираем endpoint в зависимости от типа оплаты
      if (paymentData.type === 'card') {
        endpoint = `${API_BASE_URL}/v1/card-payments/`;
        payload.cheque_id = paymentData.cheque_id;
      } else if (paymentData.type === 'cash') {
        endpoint = `${API_BASE_URL}/v1/cash-payments/`;
        payload.cheque_id = paymentData.cheque_id;
        payload.received_by = workers[0]?.id || null;
      } else if (paymentData.type === 'bank') {
        endpoint = `${API_BASE_URL}/v1/bank-payments/`;
        payload.reference_number = paymentData.reference_number;
        payload.bank_name = paymentData.bank_name;
      }

      console.log('💳 Создаём платёж:', payload);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Ошибка создания платежа:', errorData);
        throw new Error(JSON.stringify(errorData));
      }

      const paymentResult = await response.json();
      console.log('✅ Платёж создан:', paymentResult);
      
      // Закрываем модальное окно сразу для лучшего UX
      handleClosePaymentModal();

      // ⏳ Задержка 500мс для сохранения на сервере
      console.log('⏳ Ожидание сохранения платежа...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Обновляем список всех карточек
      console.log('🔄 Обновляем список всех карточек...');
      await fetchBookingCards();
      console.log('✅ Список карточек обновлён');
      
      // ✅ Получаем платежи отдельными запросами (обход проблемы с сериализатором)
      console.log('💰 Получаем платежи для карточки #' + currentCardForPayment.id);
      const payments = await fetchCardPayments(currentCardForPayment.id);
      
      // Получаем базовую информацию о карточке
      const cardResponse = await fetch(`${API_BASE_URL}/v1/booking-cards/${currentCardForPayment.id}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      let updatedCard = null;
      if (cardResponse.ok) {
        updatedCard = await cardResponse.json();
        // Добавляем платежи к карточке
        updatedCard = {
          ...updatedCard,
          ...payments
        };
        
        console.log('✅ Данные карточки обновлены');
        console.log('  📊 ДЕТАЛЬНАЯ ИНФОРМАЦИЯ:');
        console.log('  - Общая сумма:', updatedCard.total_amount);
        console.log('  - Платежей картой:', updatedCard.card_payments?.length || 0);
        console.log('  - Платежей наличными:', updatedCard.cash_payments?.length || 0);
        console.log('  - Платежей через банк:', updatedCard.bank_payments?.length || 0);
        
        // Если карточка открыта в модальном окне - обновляем её данные
        if (editingCard && editingCard.id === currentCardForPayment.id) {
          console.log('📝 Обновляем editingCard в модальном окне');
          setEditingCard(updatedCard);
          
          // Обновляем formData с новыми суммами
          setFormData(prev => ({
            ...prev,
            total_amount: updatedCard.total_amount || 0
          }));
        }
        
        // Пересчитываем оплату
        const totalPaid = calculateTotalPaid(updatedCard);
        console.log('💰 Итого оплачено:', totalPaid, '₸');
        
        alert(`✅ Оплата добавлена успешно!\n\n💳 Сумма: ${paymentData.amount} ₸\n💰 Всего оплачено: ${totalPaid.toFixed(2)} ₸\n📊 К оплате: ${(parseFloat(updatedCard.total_amount || 0) - totalPaid).toFixed(2)} ₸`);
      } else {
        console.warn('⚠️ Не удалось получить данные карточки');
        alert('✅ Оплата добавлена, но данные могут обновиться не сразу.\nОбновите страницу.');
      }
    } catch (err) {
      console.error('Ошибка добавления оплаты:', err);
      alert('Ошибка добавления оплаты: ' + err.message);
    }
  };

  // Обновить контрагента во всех бронированиях
  const updateAgentInBookings = async (cardId, newAgentId) => {
    try {
      const token = localStorage.getItem('access_token');
      const card = bookingCards.find(c => c.id === cardId);
      
      if (!card || !card.bookings_list) return;

      for (const booking of card.bookings_list) {
        await fetch(`${API_BASE_URL}/v1/bookings/${booking.id}/`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...booking,
            agent: newAgentId || null
          })
        });
      }
    } catch (err) {
      console.error('Ошибка обновления контрагента:', err);
    }
  };

  const updateGoodQuantity = (goodId, change) => {
    setFormData(prev => {
      const currentQty = prev.goods[goodId] || 0;
      const newQty = Math.max(0, currentQty + change);
      
      const newGoods = { ...prev.goods };
      if (newQty === 0) {
        delete newGoods[goodId];
      } else {
        newGoods[goodId] = newQty;
      }
      
      return { ...prev, goods: newGoods };
    });
  };

  const updateServiceQuantity = (serviceId, change) => {
    setFormData(prev => {
      const currentQty = prev.services[serviceId] || 0;
      const newQty = Math.max(0, currentQty + change);
      
      const newServices = { ...prev.services };
      if (newQty === 0) {
        delete newServices[serviceId];
      } else {
        newServices[serviceId] = newQty;
      }
      
      return { ...prev, services: newServices };
    });
  };

  // Создание или обновление карточки
  const handleCreateOrUpdate = async () => {
    console.log('🔍 Начало сохранения карточки');
    console.log('formData.bookings:', formData.bookings);
    console.log('formData.primary_guest:', formData.primary_guest);
    
    if (!formData.primary_guest) {
      alert('Выберите основного гостя');
      return;
    }

    if (formData.bookings.length === 0) {
      alert('Добавьте хотя бы одно бронирование через кнопку "Создать новое бронирование"');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        alert('Ошибка: нет токена авторизации. Войдите в систему заново.');
        return;
      }

      const url = editingCard 
        ? `${API_BASE_URL}/v1/booking-cards/${editingCard.id}/`
        : `${API_BASE_URL}/v1/booking-cards/`;
      
      const method = editingCard ? 'PUT' : 'POST';

      // Фильтруем и преобразуем данные
      const validBookings = formData.bookings
        .filter(id => {
          const isValid = id !== null && id !== undefined && id !== 'None' && id !== '';
          if (!isValid) {
            console.log('❌ Невалидное бронирование:', id);
          }
          return isValid;
        })
        .map(id => {
          const numId = parseInt(id);
          console.log('✅ Валидное бронирование:', id, '→', numId);
          return numId;
        });

      console.log('Валидных бронирований:', validBookings.length);
      console.log('Массив валидных ID:', validBookings);

      if (validBookings.length === 0) {
        alert('Нет валидных бронирований. Создайте новое бронирование.');
        return;
      }

      const payload = {
        primary_guest: parseInt(formData.primary_guest),
        bookings: validBookings,
        goods: Object.keys(formData.goods)
          .filter(id => id && id !== 'null' && id !== 'undefined')
          .map(id => parseInt(id)),
        services: Object.keys(formData.services)
          .filter(id => id && id !== 'null' && id !== 'undefined')
          .map(id => parseInt(id)),
        status: parseInt(formData.status),
        total_amount: parseFloat(formData.total_amount) || 0
      };

      console.log('📤 Отправляем данные:', payload);
      console.log('URL:', url);
      console.log('Method:', method);

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Ошибка от сервера:', errorData);
        
        // Формируем читаемое сообщение об ошибке
        let errorMessage = 'Ошибка сохранения:\n';
        if (typeof errorData === 'object') {
          for (const [field, errors] of Object.entries(errorData)) {
            if (Array.isArray(errors)) {
              errorMessage += `${field}: ${errors.join(', ')}\n`;
            } else {
              errorMessage += `${field}: ${errors}\n`;
            }
          }
        }
        throw new Error(errorMessage);
      }

      const savedCard = await response.json();
      console.log('✅ Карточка сохранена:', savedCard);

      // Обновляем контрагента во всех бронированиях
      if (formData.agent) {
        await updateAgentInBookings(savedCard.id, formData.agent);
      }

      await fetchBookingCards();
      handleCloseModal();
      alert('Карточка успешно сохранена!');
    } catch (err) {
      console.error('Полная ошибка:', err);
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить эту карточку?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/v1/booking-cards/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Ошибка удаления');
      await fetchBookingCards();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = async (card) => {
    console.log('🔍 Открываем карточку на редактирование:', card.id);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/v1/booking-cards/${card.id}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        let fullCard = await response.json();
        
        // Получаем платежи отдельными запросами
        const payments = await fetchCardPayments(card.id);
        fullCard = { ...fullCard, ...payments };
        
        console.log('✅ Загружены полные данные карточки:', fullCard);
        
        // ✅ ВАЖНО: Устанавливаем editingCard с ПОЛНЫМИ данными
        setEditingCard(fullCard);
        
        const goodsObj = {};
        fullCard.goods_list?.forEach(g => {
          goodsObj[g.id] = 1;
        });
        
        const servicesObj = {};
        fullCard.services_list?.forEach(s => {
          servicesObj[s.id] = 1;
        });

        // Получаем контрагента из первого бронирования
        const agentId = fullCard.bookings_list?.[0]?.agent || '';
        
        setFormData({
          primary_guest: fullCard.primary_guest || '',
          agent: agentId,
          bookings: fullCard.bookings?.map(b => b.id) || [],
          goods: goodsObj,
          services: servicesObj,
          status: fullCard.status || 1,
          total_amount: fullCard.total_amount || 0
        });
      } else {
        console.error('❌ Ошибка загрузки карточки:', response.status);
      }
    } catch (err) {
      console.error('❌ Ошибка загрузки карточки:', err);
    }
    
    setShowModal(true);
  };

  // Обновить конкретную карточку (для кнопки "Обновить")
  const handleRefreshCard = async (cardId) => {
    console.log('🔄 Принудительное обновление карточки #' + cardId);
    
    try {
      const token = localStorage.getItem('access_token');
      
      // Получаем базовую информацию о карточке
      const response = await fetch(`${API_BASE_URL}/v1/booking-cards/${cardId}/?t=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        let updatedCard = await response.json();
        
        // Получаем платежи отдельными запросами
        const payments = await fetchCardPayments(cardId);
        updatedCard = { ...updatedCard, ...payments };
        
        console.log('✅ Карточка обновлена:', updatedCard);
        
        // Обновляем карточку в списке
        setBookingCards(prev => 
          prev.map(card => card.id === cardId ? updatedCard : card)
        );
        
        // Пересчитываем оплату
        const totalPaid = calculateTotalPaid(updatedCard);
        console.log('💰 Итого оплачено:', totalPaid, '₸');
        
        alert(`✅ Карточка обновлена!\n\n💰 Оплачено: ${totalPaid.toFixed(2)} ₸\n📊 К оплате: ${(parseFloat(updatedCard.total_amount || 0) - totalPaid).toFixed(2)} ₸`);
      } else {
        console.error('❌ Ошибка обновления карточки:', response.status);
        alert('❌ Не удалось обновить карточку');
      }
    } catch (err) {
      console.error('❌ Ошибка обновления карточки:', err);
      alert('❌ Ошибка обновления карточки');
    }
  };

  // Закрыть модальное окно оплаты
  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setCurrentCardForPayment(null);
    setPaymentData({
      type: 'card',
      amount: '',
      agent: '',
      cheque_id: '',
      reference_number: '',
      bank_name: ''
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCard(null);
    setTempBookings([]); // Очищаем временные бронирования
    setFormData({
      primary_guest: '',
      agent: '',
      bookings: [],
      goods: {},
      services: {},
      status: 1,
      total_amount: 0
    });
  };

  const toggleBooking = (bookingId) => {
    setFormData(prev => ({
      ...prev,
      bookings: prev.bookings.includes(bookingId)
        ? prev.bookings.filter(id => id !== bookingId)
        : [...prev.bookings, bookingId]
    }));
  };

  // Рассчитать общую сумму оплат
  // ✅ АЛЬТЕРНАТИВНОЕ РЕШЕНИЕ: Получить платежи отдельными запросами
  const fetchCardPayments = async (cardId) => {
    console.log('💰 Получаем платежи для карточки #' + cardId);
    try {
      const token = localStorage.getItem('access_token');
      
      // Параллельные запросы для всех типов платежей
      const [cardRes, cashRes, bankRes] = await Promise.all([
        fetch(`${API_BASE_URL}/v1/card-payments/?booking_card=${cardId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/v1/cash-payments/?booking_card=${cardId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/v1/bank-payments/?booking_card=${cardId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      const cardPayments = cardRes.ok ? await cardRes.json() : { results: [] };
      const cashPayments = cashRes.ok ? await cashRes.json() : { results: [] };
      const bankPayments = bankRes.ok ? await bankRes.json() : { results: [] };
      
      const payments = {
        card_payments: cardPayments.results || cardPayments || [],
        cash_payments: cashPayments.results || cashPayments || [],
        bank_payments: bankPayments.results || bankPayments || []
      };
      
      console.log('✅ Платежи получены:', {
        картой: payments.card_payments.length,
        наличными: payments.cash_payments.length,
        переводом: payments.bank_payments.length
      });
      
      return payments;
    } catch (err) {
      console.error('❌ Ошибка загрузки платежей:', err);
      return { card_payments: [], cash_payments: [], bank_payments: [] };
    }
  };

  const calculateTotalPaid = (card) => {
    if (!card) return 0;
    
    const cardPayments = card.card_payments || [];
    const cashPayments = card.cash_payments || [];
    const bankPayments = card.bank_payments || [];
    
    const total = [
      ...cardPayments,
      ...cashPayments,
      ...bankPayments
    ].reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
    
    return total;
  };

  // Проверить полностью ли оплачено
  const isFullyPaid = (card) => {
    if (!card) return false;
    const totalAmount = parseFloat(card.total_amount || 0);
    const totalPaid = calculateTotalPaid(card);
    return totalPaid >= totalAmount;
  };

  // Загрузить платежи для всех карточек в списке
  const loadPaymentsForAllCards = async () => {
    console.log('💰 Загружаем платежи для всех карточек...');
    const updatedCards = await Promise.all(
      bookingCards.map(async (card) => {
        const payments = await fetchCardPayments(card.id);
        return { ...card, ...payments };
      })
    );
    setBookingCards(updatedCards);
    console.log('✅ Платежи загружены для всех карточек');
  };

  const filteredCards = bookingCards.filter(card => {
    const guestName = card.primary_guest_name?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return guestName.includes(search) || card.id.toString().includes(search);
  });

  const stats = {
    total: bookingCards.length,
    active: bookingCards.filter(c => c.status === 1).length,
    completed: bookingCards.filter(c => c.status === 2).length
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
      {/* Заголовок */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Карточки бронирования</h2>
          <p className="text-gray-600 mt-1">Управление карточками, бронированиями и оплатами</p>
        </div>
        <div className="flex gap-2">
          {bookingCards.length > 10 && (
            <button
              onClick={loadPaymentsForAllCards}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
              title={`Загрузить платежи для всех ${bookingCards.length} карточек`}
            >
              <RefreshCw size={18} />
              Загрузить платежи
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Plus size={20} />
            Создать карточку
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Всего карточек</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Активные</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <FileText className="text-green-600" size={32} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Завершённые</p>
              <p className="text-2xl font-bold text-gray-600">{stats.completed}</p>
            </div>
            <FileText className="text-gray-600" size={32} />
          </div>
        </div>
      </div>

      {/* Поиск */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Поиск по номеру карточки или гостю..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Список карточек */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCards.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center text-gray-500">
            {searchTerm ? 'Карточки не найдены' : 'Нет карточек. Создайте первую карточку!'}
          </div>
        ) : (
          filteredCards.map((card) => {
            const totalPaid = calculateTotalPaid(card);
            const isPaid = isFullyPaid(card);
            const totalAmount = parseFloat(card.total_amount || 0);
            
            return (
            <div key={card.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Карточка #{card.id}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Гость: {card.primary_guest_name || 'Не указан'}
                    </p>
                    {card.bookings_list?.[0]?.agent_name && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Building2 size={14} />
                        {card.bookings_list[0].agent_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    card.status === 1 
                      ? 'bg-green-100 text-green-800'
                      : card.status === 2
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {card.status_display}
                  </span>
                  {isPaid ? (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
                      <CheckCircle size={14} />
                      Оплачено
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 flex items-center gap-1">
                      <XCircle size={14} />
                      Не оплачено
                    </span>
                  )}
                </div>
              </div>

              {/* Бронирования */}
              {card.bookings_list && card.bookings_list.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Бронирования:</p>
                  <div className="space-y-2">
                    {card.bookings_list.map(booking => (
                      <div key={booking.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">
                          Номер {booking.room_number} - {booking.guest_name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            booking.status === 1 ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 2 ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status_display}
                          </span>
                          {booking.status !== 3 && (
                            <button
                              onClick={() => handleChangeBookingStatus(booking.id, booking.status === 1 ? 2 : 3)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              {booking.status === 1 ? '→ Заселить' : '→ Выселить'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Оплаты */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Оплаты:</p>
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <span className="text-gray-600">Оплачено: </span>
                    <span className="font-semibold text-green-600">{totalPaid.toFixed(2)} ₸</span>
                    <span className="text-gray-600"> из </span>
                    <span className="font-semibold">{totalAmount.toFixed(2)} ₸</span>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentCardForPayment(card);
                      
                      // ✅ Пробуем получить контрагента разными способами
                      let agentFromCard = '';
                      
                      // 1. Из бронирований карточки
                      if (card.bookings_list?.[0]?.agent) {
                        agentFromCard = card.bookings_list[0].agent;
                        console.log('📋 Контрагент из бронирования:', agentFromCard);
                      }
                      // 2. Из formData если карточка открыта
                      else if (formData.agent) {
                        agentFromCard = formData.agent;
                        console.log('📋 Контрагент из formData:', agentFromCard);
                      }
                      // 3. Из самой карточки если есть поле agent
                      else if (card.agent) {
                        agentFromCard = card.agent;
                        console.log('📋 Контрагент из card.agent:', agentFromCard);
                      }
                      
                      console.log('📋 Открываем модальное окно оплаты для карточки #' + card.id);
                      console.log('👤 Итоговый контрагент:', agentFromCard || 'НЕТ');
                      
                      if (agentFromCard) {
                        const agentName = agents.find(a => a.id === parseInt(agentFromCard))?.full_title;
                        console.log('✅ Автоматически установлен контрагент:', agentName);
                      } else {
                        console.log('⚠️ У карточки нет контрагента - нужно выбрать вручную');
                      }
                      
                      setPaymentData({
                        type: 'card',
                        amount: '',
                        agent: agentFromCard ? String(agentFromCard) : '',
                        cheque_id: '',
                        reference_number: '',
                        bank_name: ''
                      });
                      setShowPaymentModal(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                  >
                    <Plus size={14} />
                    Добавить оплату
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Home size={16} />
                  <span>{card.total_bookings || 0} номеров</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <ShoppingCart size={16} />
                  <span>{card.goods_list?.length || 0} товаров</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <DollarSign size={16} />
                  <span>{card.services_list?.length || 0} услуг</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
                  <DollarSign size={16} />
                  <span>{totalAmount.toFixed(2)} ₸</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => handleCheckOutAll(card.id)}
                  className="flex items-center gap-1 px-4 py-2 text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                >
                  <LogOut size={16} />
                  Выселить всех
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRefreshCard(card.id)}
                    className="flex items-center gap-1 px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Обновить данные карточки"
                  >
                    <RefreshCw size={16} />
                    Обновить
                  </button>
                  <button
                    onClick={() => handleEdit(card)}
                    className="flex items-center gap-1 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit size={16} />
                    Изменить
                  </button>
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="flex items-center gap-1 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          )})
        )}
      </div>

      {/* Модальное окно создания/редактирования карточки */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold">
                {editingCard ? 'Редактировать карточку' : 'Создать карточку бронирования'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Основной гость */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Основной гость *
                </label>
                <button
                  onClick={() => setShowGuestSelectModal(true)}
                  className="w-full px-3 py-2 border rounded-lg text-left hover:bg-gray-50 flex justify-between items-center"
                  type="button"
                >
                  <span className={formData.primary_guest ? 'text-gray-900' : 'text-gray-500'}>
                    {formData.primary_guest 
                      ? guests.find(g => g.id === parseInt(formData.primary_guest))?.full_name || 'Выберите гостя'
                      : 'Выберите гостя'}
                  </span>
                  <Search size={16} className="text-gray-400" />
                </button>
              </div>

              {/* Контрагент */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Контрагент (для всей карточки)
                </label>
                <button
                  onClick={() => setShowAgentSelectModal(true)}
                  className="w-full px-3 py-2 border rounded-lg text-left hover:bg-gray-50 flex justify-between items-center"
                  type="button"
                >
                  <span className={formData.agent ? 'text-gray-900' : 'text-gray-500'}>
                    {formData.agent 
                      ? agents.find(a => a.id === parseInt(formData.agent))?.full_title || 'Не выбран'
                      : 'Не выбран'}
                  </span>
                  <Search size={16} className="text-gray-400" />
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Контрагент будет применён ко всем бронированиям в карточке
                </p>
              </div>

              {/* Бронирования */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Бронирования *
                  </label>
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className="flex items-center gap-1 text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
                  >
                    <Plus size={16} />
                    Создать новое бронирование
                  </button>
                </div>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto bg-gray-50">
                  {formData.bookings.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm mb-2">Нет добавленных бронирований</p>
                      <p className="text-xs text-blue-600">
                        Нажмите "Создать новое бронирование" чтобы добавить номера
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Показываем бронирования из editingCard */}
                      {editingCard?.bookings_list
                        ?.filter(b => formData.bookings.includes(b.id))
                        .map(booking => (
                        <div key={`existing-${booking.id}`} className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className="text-sm">
                            Номер {booking.room_number || '?'} - {booking.guest_name || 'Без гостя'}
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                              booking.status === 1 ? 'bg-yellow-100 text-yellow-800' : 
                              booking.status === 2 ? 'bg-green-100 text-green-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {booking.status_display}
                            </span>
                          </span>
                          <button
                            onClick={() => toggleBooking(booking.id)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            Удалить
                          </button>
                        </div>
                      ))}
                      {/* Показываем временные бронирования (только что созданные) */}
                      {tempBookings
                        .filter(b => formData.bookings.includes(b.id))
                        .map(booking => (
                        <div key={`temp-${booking.id}`} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                          <span className="text-sm">
                            Номер {booking.room_number} - {booking.guest_name}
                            <span className="ml-2 text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">
                              {booking.status_display}
                            </span>
                            <span className="ml-2 text-xs text-green-600">✓ Новое</span>
                          </span>
                          <button
                            onClick={() => toggleBooking(booking.id)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            Удалить
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Добавлено: {formData.bookings.length} бронирований
                </p>
                {formData.bookings.length > 0 && (
                  <p className="text-xs text-blue-600 mt-1 font-mono">
                    ID: [{formData.bookings.join(', ')}]
                  </p>
                )}
                {formData.bookings.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    ⚠️ Необходимо добавить минимум 1 бронирование
                  </p>
                )}
              </div>

              {/* Товары */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Товары (минибар)
                </label>
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                  {goods.length === 0 ? (
                    <p className="text-gray-500 text-sm">Нет доступных товаров</p>
                  ) : (
                    <div className="space-y-3">
                      {goods.map(good => (
                        <div key={good.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
                          <div className="flex-1">
                            <span className="text-sm font-medium">{good.name}</span>
                            <span className="text-sm text-blue-600 ml-2">{good.price} ₸</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateGoodQuantity(good.id, -1)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              disabled={!formData.goods[good.id]}
                            >
                              <MinusCircle size={20} />
                            </button>
                            <span className="w-8 text-center font-medium">
                              {formData.goods[good.id] || 0}
                            </span>
                            <button
                              onClick={() => updateGoodQuantity(good.id, 1)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <PlusCircle size={20} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Услуги */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Услуги (прачка, штрафы)
                </label>
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                  {services.length === 0 ? (
                    <p className="text-gray-500 text-sm">Нет доступных услуг</p>
                  ) : (
                    <div className="space-y-3">
                      {services.map(service => (
                        <div key={service.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
                          <div className="flex-1">
                            <span className="text-sm font-medium">{service.name}</span>
                            <span className="text-sm text-blue-600 ml-2">{service.price} ₸</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateServiceQuantity(service.id, -1)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              disabled={!formData.services[service.id]}
                            >
                              <MinusCircle size={20} />
                            </button>
                            <span className="w-8 text-center font-medium">
                              {formData.services[service.id] || 0}
                            </span>
                            <button
                              onClick={() => updateServiceQuantity(service.id, 1)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <PlusCircle size={20} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Информация об оплатах (только при редактировании) */}
              {editingCard && (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-lg p-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign size={20} className="text-green-600" />
                    Информация об оплатах
                  </h4>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Общая сумма</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {parseFloat(editingCard.total_amount || 0).toFixed(2)} ₸
                      </p>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Оплачено</p>
                      <p className="text-2xl font-bold text-green-600">
                        {calculateTotalPaid(editingCard).toFixed(2)} ₸
                      </p>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Долг</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {(parseFloat(editingCard.total_amount || 0) - calculateTotalPaid(editingCard)).toFixed(2)} ₸
                      </p>
                    </div>
                  </div>

                  {/* Список платежей */}
                  {(editingCard.card_payments?.length > 0 || 
                    editingCard.cash_payments?.length > 0 || 
                    editingCard.bank_payments?.length > 0) && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-3">История платежей:</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {editingCard.card_payments?.map(payment => (
                          <div key={`card-${payment.id}`} className="flex justify-between items-center py-2 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                              <CreditCard size={16} className="text-blue-600" />
                              <span className="text-sm">Картой</span>
                            </div>
                            <span className="text-sm font-medium text-green-600">+{parseFloat(payment.amount).toFixed(2)} ₸</span>
                          </div>
                        ))}
                        {editingCard.cash_payments?.map(payment => (
                          <div key={`cash-${payment.id}`} className="flex justify-between items-center py-2 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                              <Banknote size={16} className="text-green-600" />
                              <span className="text-sm">Наличными</span>
                            </div>
                            <span className="text-sm font-medium text-green-600">+{parseFloat(payment.amount).toFixed(2)} ₸</span>
                          </div>
                        ))}
                        {editingCard.bank_payments?.map(payment => (
                          <div key={`bank-${payment.id}`} className="flex justify-between items-center py-2 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                              <Building2 size={16} className="text-purple-600" />
                              <span className="text-sm">Перевод</span>
                            </div>
                            <span className="text-sm font-medium text-green-600">+{parseFloat(payment.amount).toFixed(2)} ₸</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Статус оплаты */}
                  <div className="mt-4 flex justify-center">
                    {isFullyPaid(editingCard) ? (
                      <span className="px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 flex items-center gap-2">
                        <CheckCircle size={16} />
                        Полностью оплачено
                      </span>
                    ) : (
                      <span className="px-4 py-2 rounded-full text-sm font-medium bg-orange-100 text-orange-800 flex items-center gap-2">
                        <XCircle size={16} />
                        Частично оплачено / Не оплачено
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Статус */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Статус карточки
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>Активна</option>
                  <option value={2}>Завершена</option>
                  <option value={3}>Отменена</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
              {/* Кнопка отладки - можно удалить после исправления */}
              <button
                onClick={() => {
                  console.log('=== ТЕКУЩЕЕ СОСТОЯНИЕ ===');
                  console.log('formData:', formData);
                  console.log('formData.bookings:', formData.bookings);
                  console.log('tempBookings:', tempBookings);
                  console.log('editingCard:', editingCard);
                  alert(`Бронирований: ${formData.bookings.length}\nID: [${formData.bookings.join(', ')}]`);
                }}
                className="px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50"
                type="button"
              >
                🐛 Отладка
              </button>
              
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateOrUpdate}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingCard ? 'Сохранить' : 'Создать карточку'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно создания бронирования */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Создать новое бронирование</h3>
              <button onClick={() => setShowBookingModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Гость *</label>
                  <button
                    onClick={() => setShowBookingGuestModal(true)}
                    className="w-full px-3 py-2 border rounded-lg text-left hover:bg-gray-50 flex justify-between items-center"
                    type="button"
                  >
                    <span className={newBookingData.guest ? 'text-gray-900' : 'text-gray-500'}>
                      {newBookingData.guest 
                        ? guests.find(g => g.id === parseInt(newBookingData.guest))?.full_name || 'Выберите'
                        : 'Выберите'}
                    </span>
                    <Search size={16} className="text-gray-400" />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Номер *</label>
                  <select
                    value={newBookingData.room}
                    onChange={(e) => setNewBookingData({ ...newBookingData, room: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Выберите</option>
                    {rooms
                      .sort((a, b) => a.room - b.room)
                      .map(r => (
                        <option key={r.id} value={r.id}>Номер {r.room}</option>
                      ))
                    }
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Контрагент (опционально)
                  </label>
                  <button
                    onClick={() => setShowBookingAgentModal(true)}
                    className="w-full px-3 py-2 border rounded-lg text-left hover:bg-gray-50 flex justify-between items-center"
                    type="button"
                  >
                    <span className={newBookingData.agent ? 'text-gray-900' : 'text-gray-500'}>
                      {newBookingData.agent 
                        ? agents.find(a => a.id === parseInt(newBookingData.agent))?.full_title || 'Выбран'
                        : formData.agent 
                          ? `Из карточки: ${agents.find(a => a.id === parseInt(formData.agent))?.full_title || 'Загрузка...'}`
                          : 'Контрагент не указан'}
                    </span>
                    <Search size={16} className="text-gray-400" />
                  </button>
                  {!newBookingData.agent && formData.agent && (
                    <p className="text-xs text-blue-600 mt-1">
                      ℹ️ Будет использован контрагент из карточки
                    </p>
                  )}
                  {!newBookingData.agent && !formData.agent && (
                    <p className="text-xs text-gray-500 mt-1">
                      Контрагент не указан. Можно выбрать отдельного контрагента для этого бронирования.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Дата заезда *</label>
                  <input
                    type="datetime-local"
                    value={newBookingData.check_in}
                    onChange={(e) => setNewBookingData({ ...newBookingData, check_in: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Дата выезда *</label>
                  <input
                    type="datetime-local"
                    value={newBookingData.check_out}
                    onChange={(e) => setNewBookingData({ ...newBookingData, check_out: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Примечание</label>
                  <textarea
                    value={newBookingData.note}
                    onChange={(e) => setNewBookingData({ ...newBookingData, note: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="3"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowBookingModal(false)}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateBooking}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Создать бронирование
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно добавления оплаты */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Добавить оплату</h3>
              <button onClick={handleClosePaymentModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Тип оплаты */}
              <div>
                <label className="block text-sm font-medium mb-2">Тип оплаты *</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setPaymentData({ ...paymentData, type: 'card' })}
                    className={`p-3 border rounded-lg flex items-center justify-center gap-2 ${
                      paymentData.type === 'card' ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
                    }`}
                  >
                    <CreditCard size={20} />
                    <span>Картой</span>
                  </button>
                  <button
                    onClick={() => setPaymentData({ ...paymentData, type: 'cash' })}
                    className={`p-3 border rounded-lg flex items-center justify-center gap-2 ${
                      paymentData.type === 'cash' ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
                    }`}
                  >
                    <Banknote size={20} />
                    <span>Наличными</span>
                  </button>
                  <button
                    onClick={() => setPaymentData({ ...paymentData, type: 'bank' })}
                    className={`p-3 border rounded-lg flex items-center justify-center gap-2 ${
                      paymentData.type === 'bank' ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
                    }`}
                  >
                    <Building2 size={20} />
                    <span>Банк</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Сумма *</label>
                  <input
                    type="number"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Контрагент *
                  </label>
                  <select
                    value={paymentData.agent}
                    onChange={(e) => setPaymentData({ ...paymentData, agent: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Выберите контрагента</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.full_title}</option>
                    ))}
                  </select>
                  {paymentData.agent && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle size={12} />
                      Контрагент выбран автоматически из карточки
                    </p>
                  )}
                  {!paymentData.agent && (
                    <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Необходимо выбрать контрагента
                    </p>
                  )}
                </div>

                {paymentData.type === 'card' && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">ID чека</label>
                    <input
                      type="text"
                      value={paymentData.cheque_id}
                      onChange={(e) => setPaymentData({ ...paymentData, cheque_id: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                )}

                {paymentData.type === 'cash' && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">ID чека</label>
                    <input
                      type="text"
                      value={paymentData.cheque_id}
                      onChange={(e) => setPaymentData({ ...paymentData, cheque_id: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                )}

                {paymentData.type === 'bank' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Номер платёжного поручения</label>
                      <input
                        type="text"
                        value={paymentData.reference_number}
                        onChange={(e) => setPaymentData({ ...paymentData, reference_number: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Название банка</label>
                      <input
                        type="text"
                        value={paymentData.bank_name}
                        onChange={(e) => setPaymentData({ ...paymentData, bank_name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
                <p className="text-sm text-blue-800 font-medium">
                  📝 Оплата будет добавлена к карточке #{currentCardForPayment?.id}
                </p>
                {(() => {
                  const agentId = paymentData.agent || formData.agent || currentCardForPayment?.bookings_list?.[0]?.agent;
                  const agentName = agents.find(a => a.id === parseInt(agentId))?.full_title;
                  if (agentName) {
                    return (
                      <p className="text-sm text-blue-700">
                        👤 Контрагент: <span className="font-medium">{agentName}</span>
                      </p>
                    );
                  } else {
                    return (
                      <p className="text-sm text-red-600">
                        ⚠️ Контрагент не указан - выберите в форме
                      </p>
                    );
                  }
                })()}
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={handleClosePaymentModal}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleAddPayment}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Добавить оплату
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно выбора гостя в форме бронирования */}
      {showBookingGuestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Выберите гостя</h3>
              <button onClick={() => setShowBookingGuestModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Поиск по имени, телефону..."
                  value={guestSearchTerm}
                  onChange={(e) => setGuestSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {guests
                .filter(guest => {
                  const search = guestSearchTerm.toLowerCase();
                  return guest.full_name?.toLowerCase().includes(search) || 
                         guest.phone?.includes(search) ||
                         guest.email?.toLowerCase().includes(search);
                })
                .map(guest => (
                  <div
                    key={guest.id}
                    onClick={() => {
                      setNewBookingData({ ...newBookingData, guest: guest.id });
                      setShowBookingGuestModal(false);
                      setGuestSearchTerm('');
                    }}
                    className={`p-4 border rounded-lg mb-2 cursor-pointer hover:bg-blue-50 transition-colors ${
                      newBookingData.guest === guest.id ? 'bg-blue-100 border-blue-500' : 'hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{guest.full_name}</p>
                        <p className="text-sm text-gray-600">{guest.phone || 'Нет телефона'}</p>
                        {guest.email && (
                          <p className="text-sm text-gray-500">{guest.email}</p>
                        )}
                      </div>
                      {newBookingData.guest === guest.id && (
                        <CheckCircle className="text-blue-600" size={24} />
                      )}
                    </div>
                  </div>
                ))}
            </div>

            <div className="p-4 border-t">
              <button
                onClick={() => {
                  setShowBookingGuestModal(false);
                  setGuestSearchTerm('');
                }}
                className="w-full px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно выбора контрагента в форме бронирования */}
      {showBookingAgentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Выберите контрагента</h3>
              <button onClick={() => setShowBookingAgentModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Поиск по названию, ИИН/БИН..."
                  value={agentSearchTerm}
                  onChange={(e) => setAgentSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="p-4 border-b">
              <div
                onClick={() => {
                  setNewBookingData({ ...newBookingData, agent: '' });
                  setShowBookingAgentModal(false);
                  setAgentSearchTerm('');
                }}
                className={`p-4 border rounded-lg cursor-pointer hover:bg-blue-50 transition-colors ${
                  !newBookingData.agent ? 'bg-blue-100 border-blue-500' : 'hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Использовать контрагента карточки</p>
                    <p className="text-sm text-gray-600">Контрагент будет взят из карточки</p>
                  </div>
                  {!newBookingData.agent && (
                    <CheckCircle className="text-blue-600" size={24} />
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {agents
                .filter(agent => {
                  const search = agentSearchTerm.toLowerCase();
                  return agent.full_title?.toLowerCase().includes(search) || 
                         agent.short_title?.toLowerCase().includes(search) ||
                         agent.IIN_BIN?.includes(search);
                })
                .map(agent => (
                  <div
                    key={agent.id}
                    onClick={() => {
                      setNewBookingData({ ...newBookingData, agent: agent.id });
                      setShowBookingAgentModal(false);
                      setAgentSearchTerm('');
                    }}
                    className={`p-4 border rounded-lg mb-2 cursor-pointer hover:bg-blue-50 transition-colors ${
                      newBookingData.agent === agent.id ? 'bg-blue-100 border-blue-500' : 'hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{agent.full_title}</p>
                        {agent.short_title && (
                          <p className="text-sm text-gray-600">{agent.short_title}</p>
                        )}
                        <p className="text-sm text-gray-500 font-mono">{agent.IIN_BIN}</p>
                      </div>
                      {newBookingData.agent === agent.id && (
                        <CheckCircle className="text-blue-600" size={24} />
                      )}
                    </div>
                  </div>
                ))}
            </div>

            <div className="p-4 border-t">
              <button
                onClick={() => {
                  setShowBookingAgentModal(false);
                  setAgentSearchTerm('');
                }}
                className="w-full px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно выбора гостя */}
      {showGuestSelectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Выберите гостя</h3>
              <button onClick={() => setShowGuestSelectModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            {/* Поиск */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Поиск по имени, телефону..."
                  value={guestSearchTerm}
                  onChange={(e) => setGuestSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Список гостей */}
            <div className="flex-1 overflow-y-auto p-4">
              {guests
                .filter(guest => {
                  const search = guestSearchTerm.toLowerCase();
                  return guest.full_name?.toLowerCase().includes(search) || 
                         guest.phone?.includes(search) ||
                         guest.email?.toLowerCase().includes(search);
                })
                .map(guest => (
                  <div
                    key={guest.id}
                    onClick={() => {
                      setFormData({ ...formData, primary_guest: guest.id });
                      setShowGuestSelectModal(false);
                      setGuestSearchTerm('');
                    }}
                    className={`p-4 border rounded-lg mb-2 cursor-pointer hover:bg-blue-50 transition-colors ${
                      formData.primary_guest === guest.id ? 'bg-blue-100 border-blue-500' : 'hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{guest.full_name}</p>
                        <p className="text-sm text-gray-600">{guest.phone || 'Нет телефона'}</p>
                        {guest.email && (
                          <p className="text-sm text-gray-500">{guest.email}</p>
                        )}
                      </div>
                      {formData.primary_guest === guest.id && (
                        <CheckCircle className="text-blue-600" size={24} />
                      )}
                    </div>
                  </div>
                ))}
              {guests.filter(guest => {
                const search = guestSearchTerm.toLowerCase();
                return guest.full_name?.toLowerCase().includes(search) || 
                       guest.phone?.includes(search);
              }).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Гости не найдены
                </div>
              )}
            </div>

            <div className="p-4 border-t">
              <button
                onClick={() => {
                  setShowGuestSelectModal(false);
                  setGuestSearchTerm('');
                }}
                className="w-full px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно выбора контрагента */}
      {showAgentSelectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Выберите контрагента</h3>
              <button onClick={() => setShowAgentSelectModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            {/* Поиск */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Поиск по названию, ИИН/БИН..."
                  value={agentSearchTerm}
                  onChange={(e) => setAgentSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Кнопка "Не выбран" */}
            <div className="p-4 border-b">
              <div
                onClick={() => {
                  setFormData({ ...formData, agent: '' });
                  setShowAgentSelectModal(false);
                  setAgentSearchTerm('');
                }}
                className={`p-4 border rounded-lg cursor-pointer hover:bg-blue-50 transition-colors ${
                  !formData.agent ? 'bg-blue-100 border-blue-500' : 'hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Без контрагента</p>
                    <p className="text-sm text-gray-600">Не указывать контрагента</p>
                  </div>
                  {!formData.agent && (
                    <CheckCircle className="text-blue-600" size={24} />
                  )}
                </div>
              </div>
            </div>

            {/* Список контрагентов */}
            <div className="flex-1 overflow-y-auto p-4">
              {agents
                .filter(agent => {
                  const search = agentSearchTerm.toLowerCase();
                  return agent.full_title?.toLowerCase().includes(search) || 
                         agent.short_title?.toLowerCase().includes(search) ||
                         agent.IIN_BIN?.includes(search);
                })
                .map(agent => (
                  <div
                    key={agent.id}
                    onClick={() => {
                      setFormData({ ...formData, agent: agent.id });
                      setShowAgentSelectModal(false);
                      setAgentSearchTerm('');
                    }}
                    className={`p-4 border rounded-lg mb-2 cursor-pointer hover:bg-blue-50 transition-colors ${
                      formData.agent === agent.id ? 'bg-blue-100 border-blue-500' : 'hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{agent.full_title}</p>
                        {agent.short_title && (
                          <p className="text-sm text-gray-600">{agent.short_title}</p>
                        )}
                        <p className="text-sm text-gray-500 font-mono">{agent.IIN_BIN}</p>
                      </div>
                      {formData.agent === agent.id && (
                        <CheckCircle className="text-blue-600" size={24} />
                      )}
                    </div>
                  </div>
                ))}
              {agents.filter(agent => {
                const search = agentSearchTerm.toLowerCase();
                return agent.full_title?.toLowerCase().includes(search) || 
                       agent.IIN_BIN?.includes(search);
              }).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Контрагенты не найдены
                </div>
              )}
            </div>

            <div className="p-4 border-t">
              <button
                onClick={() => {
                  setShowAgentSelectModal(false);
                  setAgentSearchTerm('');
                }}
                className="w-full px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingCards;