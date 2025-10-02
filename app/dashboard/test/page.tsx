'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function TestKYCPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    documentFront: null as File | null,
    documentBack: null as File | null,
    selfie: null as File | null,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadProjects(token);
  }, []);

  const loadProjects = async (token: string) => {
    try {
      const response = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
        if (data.projects.length > 0) {
          setSelectedProject(data.projects[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) {
      setError('Выберите проект');
      return;
    }

    if (!formData.documentFront || !formData.selfie) {
      setError('Загрузите документ и селфи');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const project = projects.find(p => p.id === selectedProject);
      const data = new FormData();
      data.append('email', formData.email);
      data.append('firstName', formData.firstName);
      data.append('lastName', formData.lastName);
      data.append('documentFront', formData.documentFront);
      if (formData.documentBack) {
        data.append('documentBack', formData.documentBack);
      }
      data.append('selfie', formData.selfie);

      const response = await fetch('/api/v1/verifications', {
        method: 'POST',
        headers: {
          'X-API-Key': project.apiKey,
        },
        body: data,
      });

      const responseData = await response.json();

      if (response.ok) {
        setResult(responseData);
        pollVerificationStatus(responseData.verification.id, project.apiKey);
      } else {
        setError(responseData.error || 'Ошибка отправки');
      }
    } catch (err) {
      setError('Ошибка отправки');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pollVerificationStatus = async (verificationId: string, apiKey: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/v1/verifications/${verificationId}`, {
          headers: { 'X-API-Key': apiKey },
        });

        if (response.ok) {
          const data = await response.json();
          setResult(prev => ({ ...prev, verification: data.verification }));

          if (data.verification.status !== 'PROCESSING' && data.verification.status !== 'PENDING') {
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    poll();
  };

  return (
    <DashboardLayout currentPage="test">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Тестирование API</h1>
        <p className="text-sm text-gray-600">Проверьте работу верификации</p>
      </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Form */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Отправить запрос</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Проект</label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Имя</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Фамилия</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Документ (лицевая сторона) *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'documentFront')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Документ (обратная сторона)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'documentBack')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Селфи *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'selfie')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? 'Отправка...' : 'Отправить'}
                </button>
              </form>
            </div>

            {/* Result */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Результат</h2>

              {result ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">ID Верификации</p>
                    <p className="font-mono text-sm text-gray-900">{result.verification.id}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">Статус</p>
                    <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                      result.verification.status === 'APPROVED' ? 'bg-green-50 text-green-700 border border-green-200' :
                      result.verification.status === 'REJECTED' ? 'bg-red-50 text-red-700 border border-red-200' :
                      result.verification.status === 'MANUAL_REVIEW' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                      'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                      {result.verification.status}
                    </span>
                  </div>

                  {result.verification.faceMatchScore && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Face Match Score</p>
                      <p className="text-xl font-semibold text-gray-900">{result.verification.faceMatchScore.toFixed(1)}%</p>
                    </div>
                  )}

                  {result.verification.fraudScore !== null && result.verification.fraudScore !== undefined && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Fraud Score</p>
                      <p className={`text-xl font-semibold ${
                        result.verification.fraudScore < 30 ? 'text-green-600' :
                        result.verification.fraudScore < 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {result.verification.fraudScore.toFixed(1)}
                      </p>
                    </div>
                  )}

                  {result.verification.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                      <p className="text-xs text-red-600 mb-1">Причина отклонения</p>
                      <p className="text-sm text-red-700">{result.verification.rejectionReason}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 text-sm">
                  Результат появится здесь после отправки
                </div>
              )}
            </div>
          </div>
    </DashboardLayout>
  );
}
