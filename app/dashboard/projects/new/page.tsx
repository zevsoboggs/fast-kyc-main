'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function NewProjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    webhookUrl: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKeyResult, setApiKeyResult] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      setApiKeyResult(data.project);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (apiKeyResult) {
    return (
      <DashboardLayout currentPage="projects">
        <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Проект создан!</h2>
              <p className="text-sm text-gray-600">Сохраните ваш API ключ - он больше не будет показан</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-yellow-900 mb-3">Важно: Сохраните API ключ</h3>
                  <div className="bg-white border border-yellow-200 p-3 rounded-lg font-mono text-sm break-all mb-3 text-gray-900">
                    {apiKeyResult.apiKey}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(apiKeyResult.apiKey);
                      alert('API ключ скопирован в буфер обмена!');
                    }}
                    className="w-full px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Скопировать API ключ
                  </button>
                </div>
              </div>
            </div>

            {apiKeyResult.webhookSecret && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">Webhook секрет</h3>
                <div className="bg-white border border-blue-200 p-3 rounded-lg font-mono text-sm break-all mb-3 text-gray-900">
                  {apiKeyResult.webhookSecret}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(apiKeyResult.webhookSecret);
                    alert('Webhook секрет скопирован в буфер обмена!');
                  }}
                  className="w-full px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Скопировать Webhook секрет
                </button>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Детали проекта</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Название проекта:</span>
                  <span className="font-medium text-gray-900">{apiKeyResult.name}</span>
                </div>
                {apiKeyResult.description && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Описание:</span>
                    <span className="font-medium text-gray-900">{apiKeyResult.description}</span>
                  </div>
                )}
                {apiKeyResult.webhookUrl && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Webhook URL:</span>
                    <span className="font-medium text-gray-900 break-all text-right ml-4">{apiKeyResult.webhookUrl}</span>
                  </div>
                )}
              </div>
            </div>

            <Link
              href="/dashboard"
              className="block w-full px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors text-center"
            >
              Перейти в дашборд
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="projects">
      <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </Link>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Создать новый проект</h1>
            <p className="text-sm text-gray-600">Настройте новый проект для KYC верификации</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название проекта <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Мой KYC проект"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Понятное название для вашего проекта
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent min-h-[100px]"
                  placeholder="Опишите назначение проекта..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Опциональное описание для внутреннего использования
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="https://ваш-домен.ru/webhooks/kyc"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Получайте уведомления о статусе верификации в реальном времени (опционально)
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">Что дальше?</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Будет сгенерирован API ключ для вашего проекта</li>
                      <li>• Используйте API ключ для аутентификации запросов</li>
                      <li>• Настройте webhooks для получения обновлений статуса</li>
                      <li>• Начните верифицировать пользователей немедленно</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Создание проекта...' : 'Создать проект'}
              </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
