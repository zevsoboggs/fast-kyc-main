'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface Project {
  id: string;
  name: string;
  webhookUrl: string | null;
  webhookSecret: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function WebhooksPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [showSecret, setShowSecret] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }

    loadProjects(token);
  }, [router]);

  const loadProjects = async (token: string) => {
    try {
      const response = await fetch('/api/webhooks', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project.id);
    setWebhookUrl(project.webhookUrl || '');
    setTestResult(null);
  };

  const handleCancel = () => {
    setEditingProject(null);
    setWebhookUrl('');
    setTestResult(null);
  };

  const handleSave = async (projectId: string) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          webhookUrl: webhookUrl.trim() || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(prev =>
          prev.map(p => (p.id === projectId ? { ...p, ...data.project } : p))
        );
        setEditingProject(null);
        setWebhookUrl('');
      } else {
        alert('Ошибка сохранения webhook');
      }
    } catch (error) {
      console.error('Failed to save webhook:', error);
      alert('Ошибка сохранения webhook');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (projectId: string) => {
    setTesting(projectId);
    setTestResult(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });

      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      console.error('Failed to test webhook:', error);
      setTestResult({
        success: false,
        message: 'Ошибка отправки тестового webhook',
      });
    } finally {
      setTesting(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleShowSecret = (projectId: string) => {
    setShowSecret(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  return (
    <DashboardLayout currentPage="webhooks">
      <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Webhooks</h1>
            <p className="text-sm text-gray-600">Настройка webhook уведомлений для ваших проектов</p>
          </div>

          {/* Info Block */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">О Webhooks</h3>
                <p className="text-sm text-blue-800">
                  Webhooks позволяют получать уведомления в реальном времени о событиях верификации. Настройте URL эндпоинта для каждого проекта, и мы будем отправлять туда POST запросы с данными о завершенных верификациях.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : projects.length > 0 ? (
            <div className="space-y-6">
              {projects.map((project) => (
                <div key={project.id} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-500">ID: {project.id}</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      project.webhookUrl
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-gray-50 text-gray-700 border border-gray-200'
                    }`}>
                      {project.webhookUrl ? 'Настроен' : 'Не настроен'}
                    </span>
                  </div>

                  {editingProject === project.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Webhook URL
                        </label>
                        <input
                          type="url"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          placeholder="https://your-domain.com/webhooks"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          URL эндпоинта, на который будут отправляться webhook уведомления
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(project.id)}
                          disabled={saving}
                          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
                        >
                          {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={saving}
                          className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 transition-colors"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {project.webhookUrl ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Webhook URL
                            </label>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono">
                                {project.webhookUrl}
                              </code>
                              <button
                                onClick={() => copyToClipboard(project.webhookUrl!)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Копировать"
                              >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Webhook Secret
                            </label>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono">
                                {showSecret[project.id] ? project.webhookSecret : '••••••••••••••••'}
                              </code>
                              <button
                                onClick={() => toggleShowSecret(project.id)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title={showSecret[project.id] ? 'Скрыть' : 'Показать'}
                              >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  {showSecret[project.id] ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                  ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  )}
                                </svg>
                              </button>
                              <button
                                onClick={() => copyToClipboard(project.webhookSecret!)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Копировать"
                              >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Используйте этот секрет для проверки подписи webhook запросов
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(project)}
                              className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                              Редактировать
                            </button>
                            <button
                              onClick={() => handleTest(project.id)}
                              disabled={testing === project.id}
                              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                            >
                              {testing === project.id ? 'Отправка...' : 'Тестировать'}
                            </button>
                          </div>

                          {testResult && (
                            <div className={`p-4 rounded-lg border ${
                              testResult.success
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                            }`}>
                              <div className="flex items-start gap-3">
                                <svg className={`w-5 h-5 mt-0.5 ${
                                  testResult.success ? 'text-green-600' : 'text-red-600'
                                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  {testResult.success ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  )}
                                </svg>
                                <div className="flex-1">
                                  <p className={`text-sm font-medium ${
                                    testResult.success ? 'text-green-900' : 'text-red-900'
                                  }`}>
                                    {testResult.message}
                                  </p>
                                  {testResult.response && (
                                    <div className="mt-2">
                                      <p className="text-xs font-medium text-gray-700">
                                        Статус: {testResult.response.statusCode}
                                      </p>
                                      {testResult.response.body && (
                                        <pre className="mt-1 text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                                          {testResult.response.body}
                                        </pre>
                                      )}
                                    </div>
                                  )}
                                  {testResult.error && (
                                    <p className="text-xs text-red-700 mt-1">{testResult.error}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <p className="text-sm text-gray-600 mb-4">
                            Webhook не настроен для этого проекта
                          </p>
                          <button
                            onClick={() => handleEdit(project)}
                            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                          >
                            Настроить webhook
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет проектов</h3>
              <p className="text-sm text-gray-600 mb-6">Создайте проект, чтобы настроить webhooks</p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Перейти к проектам
              </Link>
          </div>
        )}
    </DashboardLayout>
  );
}
