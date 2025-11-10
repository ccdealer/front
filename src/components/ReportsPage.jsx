import React from 'react';

const ReportsPage = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Отчёты</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Отчёт по заселённости за 24 часа</h3>
          <p className="text-gray-600 mb-4">Статистика заселения и оплат за последние сутки</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Сформировать отчёт
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Отчёт по завтракам</h3>
          <div className="text-sm text-gray-600 mb-4">
            <p>• Стандарт/Твин полсуток: 2 завтрака</p>
            <p>• Люкс: 4 завтрака</p>
            <p>• Твин: 0 завтраков</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Сформировать отчёт
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;