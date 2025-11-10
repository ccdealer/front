import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const Payments = () => {
  const [activeTab, setActiveTab] = useState('cash');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, [activeTab]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'cash' ? '/v1/cash-payments/' :
                       activeTab === 'card' ? '/v1/card-payments/' :
                       '/v1/bank-payments/';
      const data = await apiRequest(endpoint);
      setPayments(data.results || []);
    } catch (error) {
      console.error('Ошибка загрузки платежей:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'cash', label: 'Наличные' },
    { id: 'card', label: 'Карта' },
    { id: 'bank', label: 'Банк' }
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Оплаты</h2>

      <div className="flex gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8">Загрузка...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Сумма</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Примечание</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{payment.id}</td>
                  <td className="px-6 py-4 text-sm font-semibold">{payment.amount} ₸</td>
                  <td className="px-6 py-4 text-sm">{new Date(payment.payment_date).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm">{payment.status_display || 'Завершён'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{payment.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Payments;