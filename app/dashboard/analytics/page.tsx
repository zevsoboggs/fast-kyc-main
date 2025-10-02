'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface AnalyticsData {
  totalVerifications: number;
  approvedVerifications: number;
  rejectedVerifications: number;
  pendingVerifications: number;
  averageFaceMatchScore: number;
  averageFraudScore: number;
  verificationsByStatus: Array<{ status: string; count: number }>;
  verificationsByDay: Array<{ date: string; count: number }>;
  verificationsByProject: Array<{ projectId: string; projectName: string; count: number }>;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadAnalytics(token);
  }, [router]);

  const loadAnalytics = async (token: string) => {
    try {
      const response = await fetch('/api/analytics', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'REJECTED':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'MANUAL_REVIEW':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'PROCESSING':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PENDING':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      APPROVED: 'Одобрено',
      REJECTED: 'Отклонено',
      MANUAL_REVIEW: 'На проверке',
      PROCESSING: 'Обработка',
      PENDING: 'Ожидание',
    };
    return labels[status] || status;
  };

  return (
    <DashboardLayout currentPage="analytics">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Аналитика</h1>
        <p className="text-sm text-gray-600">Статистика и аналитика верификаций</p>
      </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : analytics ? (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-600">Всего верификаций</p>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{analytics.totalVerifications}</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-600">Одобрено</p>
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold text-green-600">{analytics.approvedVerifications}</p>
                  {analytics.totalVerifications > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      {((analytics.approvedVerifications / analytics.totalVerifications) * 100).toFixed(1)}%
                    </p>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-600">Отклонено</p>
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold text-red-600">{analytics.rejectedVerifications}</p>
                  {analytics.totalVerifications > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      {((analytics.rejectedVerifications / analytics.totalVerifications) * 100).toFixed(1)}%
                    </p>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-600">В обработке</p>
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{analytics.pendingVerifications}</p>
                </div>
              </div>

              {/* Scores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Средний Face Match Score</h3>
                  <div className="flex items-end gap-4">
                    <p className="text-4xl font-bold text-gray-900">
                      {analytics.averageFaceMatchScore.toFixed(1)}%
                    </p>
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${analytics.averageFaceMatchScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Средний Fraud Score</h3>
                  <div className="flex items-end gap-4">
                    <p className="text-4xl font-bold text-gray-900">
                      {analytics.averageFraudScore.toFixed(1)}
                    </p>
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all ${
                          analytics.averageFraudScore < 30 ? 'bg-green-500' :
                          analytics.averageFraudScore < 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${analytics.averageFraudScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verifications by Status */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Верификации по статусу</h3>
                <div className="space-y-3">
                  {analytics.verificationsByStatus.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gray-900 rounded-full"
                            style={{ width: `${(item.count / analytics.totalVerifications) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-lg font-semibold text-gray-900 w-12 text-right">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verifications by Day */}
              {analytics.verificationsByDay.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Верификации за последние 30 дней</h3>
                  <div className="space-y-2">
                    {analytics.verificationsByDay.slice(-10).map((item) => (
                      <div key={item.date} className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 w-28">{item.date}</span>
                        <div className="flex-1 h-8 bg-gray-100 rounded overflow-hidden">
                          <div
                            className="h-full bg-gray-900 flex items-center justify-end pr-3"
                            style={{
                              width: `${(item.count / Math.max(...analytics.verificationsByDay.map(d => d.count))) * 100}%`,
                              minWidth: item.count > 0 ? '40px' : '0'
                            }}
                          >
                            <span className="text-xs font-semibold text-white">{item.count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verifications by Project */}
              {analytics.verificationsByProject.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Верификации по проектам</h3>
                  <div className="space-y-3">
                    {analytics.verificationsByProject.map((item) => (
                      <div key={item.projectId} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{item.projectName}</span>
                        <div className="flex items-center gap-4">
                          <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gray-900 rounded-full"
                              style={{ width: `${(item.count / analytics.totalVerifications) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-lg font-semibold text-gray-900 w-12 text-right">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <p className="text-gray-600">Не удалось загрузить аналитику</p>
            </div>
          )}
    </DashboardLayout>
  );
}
