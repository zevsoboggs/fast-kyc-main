'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface Activity {
  id: string;
  action: string;
  description: string;
  status: string;
  projectName: string;
  userName: string;
  externalId: string | null;
  faceMatchScore: number | null;
  fraudScore: number | null;
  timestamp: string;
  createdAt: string;
}

export default function ActivityPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }

    loadActivities(token);
  }, [router]);

  const loadActivities = async (token: string) => {
    try {
      const response = await fetch('/api/activity', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'REJECTED':
        return (
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'MANUAL_REVIEW':
        return (
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'PROCESSING':
        return (
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; color: string } } = {
      APPROVED: { label: 'Одобрено', color: 'bg-green-50 text-green-700 border-green-200' },
      REJECTED: { label: 'Отклонено', color: 'bg-red-50 text-red-700 border-red-200' },
      MANUAL_REVIEW: { label: 'На проверке', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      PROCESSING: { label: 'Обработка', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      PENDING: { label: 'Ожидание', color: 'bg-gray-50 text-gray-700 border-gray-200' },
    };
    const config = statusMap[status] || { label: status, color: 'bg-gray-50 text-gray-700 border-gray-200' };
    return <span className={`px-2 py-1 rounded text-xs font-medium border ${config.color}`}>{config.label}</span>;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} дн. назад`;
    if (hours > 0) return `${hours} ч. назад`;
    if (minutes > 0) return `${minutes} мин. назад`;
    return 'Только что';
  };

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(a => a.status === filter);

  return (
    <DashboardLayout currentPage="activity">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">История активности</h1>
        <p className="text-sm text-gray-600">Логи и события в системе</p>
      </div>

          {/* Filters */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === 'all' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setFilter('APPROVED')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === 'APPROVED' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Одобрено
            </button>
            <button
              onClick={() => setFilter('REJECTED')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === 'REJECTED' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Отклонено
            </button>
            <button
              onClick={() => setFilter('MANUAL_REVIEW')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === 'MANUAL_REVIEW' ? 'bg-yellow-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              На проверке
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredActivities.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    {getStatusIcon(activity.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-900">{activity.action}</h3>
                        <span className="text-xs text-gray-500">{formatTimestamp(activity.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{activity.description}</p>
                      <div className="flex items-center gap-4 flex-wrap">
                        {getStatusBadge(activity.status)}
                        <span className="text-xs text-gray-500">
                          <span className="font-medium">Проект:</span> {activity.projectName}
                        </span>
                        {activity.externalId && (
                          <span className="text-xs text-gray-500">
                            <span className="font-medium">ID:</span> {activity.externalId}
                          </span>
                        )}
                        {activity.faceMatchScore !== null && (
                          <span className="text-xs text-gray-500">
                            <span className="font-medium">Match:</span> {activity.faceMatchScore.toFixed(1)}%
                          </span>
                        )}
                        {activity.fraudScore !== null && (
                          <span className="text-xs text-gray-500">
                            <span className="font-medium">Fraud:</span> {activity.fraudScore.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет записей</h3>
              <p className="text-sm text-gray-600">История активности пока пуста</p>
            </div>
          )}
    </DashboardLayout>
  );
}
