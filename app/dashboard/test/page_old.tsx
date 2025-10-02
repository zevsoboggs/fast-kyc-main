'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, [field]: file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      if (!selectedProject) {
        throw new Error('Выберите проект');
      }

      if (!formData.documentFront || !formData.selfie) {
        throw new Error('Загрузите документ и селфи');
      }

      const project = projects.find(p => p.id === selectedProject);
      if (!project?.apiKey) {
        throw new Error('У проекта нет API ключа');
      }

      const formDataToSend = new FormData();
      formDataToSend.append('email', formData.email);
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('documentFront', formData.documentFront);
      if (formData.documentBack) {
        formDataToSend.append('documentBack', formData.documentBack);
      }
      formDataToSend.append('selfie', formData.selfie);

      const response = await fetch('/api/v1/verifications', {
        method: 'POST',
        headers: {
          'X-API-Key': project.apiKey,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка верификации');
      }

      setResult(data);

      // Очистим форму
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        documentFront: null,
        documentBack: null,
        selfie: null,
      });

      // Очистим input файлов
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach((input: any) => {
        input.value = '';
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <nav className="glass fixed top-6 left-6 right-6 z-50 px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">К</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">veriffy.me</h1>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-gray-700 hover:text-gray-900 font-medium">
              Дашборд
            </Link>
            <Link href="/dashboard/test" className="text-indigo-600 font-medium">
              Тестировать
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2 text-gray-900">Тестирование KYC</h2>
          <p className="text-gray-600">Проверьте работу верификации с тестовыми документами</p>
        </div>

        {result && (
          <div className="glass-card p-6 mb-6 bg-green-50 border-green-200">
            <h3 className="text-lg font-bold text-green-900 mb-3">✅ Верификация создана</h3>
            <div className="space-y-2 text-sm">
              <p><strong>ID:</strong> <span className="font-mono">{result.verification?.id}</span></p>
              <p><strong>Статус:</strong> <span className="status-badge status-processing">{result.verification?.status}</span></p>
              <p className="text-gray-600">Верификация обрабатывается. Обновите страницу проекта через несколько секунд.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Выберите проект <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="input"
                required
              >
                <option value="">-- Выберите проект --</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {projects.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  <Link href="/dashboard/projects/new" className="text-indigo-600 hover:underline">
                    Создайте проект
                  </Link> чтобы начать тестирование
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Имя</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="input"
                  placeholder="Иван"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Фамилия</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="input"
                  placeholder="Иванов"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                placeholder="test@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Документ (лицевая сторона) <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'documentFront')}
                className="input"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Паспорт или ID карта</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Документ (обратная сторона)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'documentBack')}
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">Опционально</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Селфи <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'selfie')}
                className="input"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Фото лица для сравнения с документом</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h4 className="font-bold mb-2 text-blue-900">💡 Что будет проверено:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Извлечение данных из документа через AWS Textract</li>
                <li>✓ Распознавание лица на селфи через AWS Rekognition</li>
                <li>✓ Сравнение лиц (документ vs селфи)</li>
                <li>✓ Детекция мошенничества через AWS Fraud Detector</li>
                <li>✓ Автоматическое принятие решения</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading || projects.length === 0}
              className="btn btn-primary w-full"
            >
              {loading ? 'Обработка...' : 'Запустить верификацию'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
