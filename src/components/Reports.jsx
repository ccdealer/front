import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { apiRequest } from '../utils/api';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/v1/reports/');
      setReports(data.results || []);
    } catch (error) {
      console.error('Ошибка загрузки табеля:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Табель</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus size={20} /> Начать смену
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Загрузка...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Сотрудник</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Должность</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Начало</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Конец</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Часов</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Оплата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{report.worker_name}</td>
                  <td className="px-6 py-4 text-sm">{report.job_title}</td>
                  <td className="px-6 py-4 text-sm">{new Date(report.start).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm">
                    {report.finish ? new Date(report.finish).toLocaleString() : 'В процессе'}
                  </td>
                  <td className="px-6 py-4 text-sm">{report.duration || '-'}</td>
                  <td className="px-6 py-4 text-sm font-semibold">{report.total_payment || '-'} ₸</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Reports;