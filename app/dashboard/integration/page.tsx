'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface Project {
  id: string;
  name: string;
  apiKey: string;
}

export default function IntegrationPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [platform, setPlatform] = useState<'telegram' | 'web' | 'react'>('telegram');

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const selectedProjectData = projects.find(p => p.id === selectedProject);

  const getTelegramCode = () => {
    return `// Telegram Mini App Integration
import { WebApp } from '@twa-dev/sdk';

// 1. Создать сессию верификации
async function startVerification(userId) {
  const response = await fetch('https://veriffy.me/api/v1/sessions', {
    method: 'POST',
    headers: {
      'X-API-Key': '${selectedProjectData?.apiKey || 'YOUR_API_KEY'}',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: userId,
      metadata: {
        telegramId: WebApp.initDataUnsafe.user?.id
      }
    })
  });

  const data = await response.json();
  return data.embedUrl;
}

// 2. Открыть верификацию в popup
async function openKYC() {
  const userId = WebApp.initDataUnsafe.user?.id;
  const embedUrl = await startVerification(userId);

  // Открыть в popup
  WebApp.openLink(embedUrl);

  // ИЛИ открыть в iframe (если поддерживается)
  // const iframe = document.createElement('iframe');
  // iframe.src = embedUrl;
  // iframe.style.width = '100%';
  // iframe.style.height = '600px';
  // iframe.style.border = 'none';
  // document.getElementById('kyc-container').appendChild(iframe);

  // Слушать результат
  window.addEventListener('message', (event) => {
    if (event.data.type === 'kyc_complete') {
      console.log('KYC completed:', event.data);
      WebApp.showAlert(\`Верификация завершена! Статус: \${event.data.status}\`);
    }
  });
}

// 3. Вызвать функцию при нажатии кнопки
document.getElementById('verify-btn').addEventListener('click', openKYC);`;
  };

  const getWebCode = () => {
    return `<!-- Web Integration -->
<!DOCTYPE html>
<html>
<head>
  <title>KYC Verification</title>
</head>
<body>
  <button onclick="startVerification()">Начать верификацию</button>
  <div id="kyc-container"></div>

  <script>
    async function startVerification() {
      // 1. Создать сессию
      const response = await fetch('https://veriffy.me/api/v1/sessions', {
        method: 'POST',
        headers: {
          'X-API-Key': '${selectedProjectData?.apiKey || 'YOUR_API_KEY'}',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: 'user123',
          email: 'user@example.com'
        })
      });

      const data = await response.json();

      // 2. Открыть в iframe
      const iframe = document.createElement('iframe');
      iframe.src = data.embedUrl;
      iframe.style.width = '100%';
      iframe.style.height = '700px';
      iframe.style.border = '1px solid #ccc';
      iframe.style.borderRadius = '8px';

      const container = document.getElementById('kyc-container');
      container.innerHTML = '';
      container.appendChild(iframe);

      // 3. Слушать результат
      window.addEventListener('message', (event) => {
        if (event.data.type === 'kyc_complete') {
          console.log('KYC completed:', event.data);
          alert(\`Верификация завершена! Статус: \${event.data.status}\`);
        }
      });
    }
  </script>
</body>
</html>`;
  };

  const getReactCode = () => {
    return `// React Integration
import { useState, useEffect } from 'react';

function KYCVerification({ userId }) {
  const [embedUrl, setEmbedUrl] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    // Слушать результат верификации
    const handleMessage = (event) => {
      if (event.data.type === 'kyc_complete') {
        setResult(event.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const startVerification = async () => {
    try {
      const response = await fetch('https://veriffy.me/api/v1/sessions', {
        method: 'POST',
        headers: {
          'X-API-Key': '${selectedProjectData?.apiKey || 'YOUR_API_KEY'}',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      setEmbedUrl(data.embedUrl);
    } catch (error) {
      console.error('Failed to start verification:', error);
    }
  };

  if (result) {
    return (
      <div>
        <h2>Верификация завершена!</h2>
        <p>Статус: {result.status}</p>
        <p>Face Match Score: {result.faceMatchScore}%</p>
      </div>
    );
  }

  if (embedUrl) {
    return (
      <iframe
        src={embedUrl}
        style={{
          width: '100%',
          height: '700px',
          border: '1px solid #ccc',
          borderRadius: '8px'
        }}
      />
    );
  }

  return (
    <button onClick={startVerification}>
      Начать верификацию
    </button>
  );
}

export default KYCVerification;`;
  };

  const getCode = () => {
    switch (platform) {
      case 'telegram':
        return getTelegramCode();
      case 'web':
        return getWebCode();
      case 'react':
        return getReactCode();
      default:
        return '';
    }
  };

  return (
    <DashboardLayout currentPage="integration">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Интеграция</h1>
        <p className="text-sm text-gray-600">Встройте KYC верификацию в ваше приложение</p>
      </div>

          {/* Info Block */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Встраиваемая верификация</h3>
                <p className="text-sm text-blue-800">
                  Создайте сессию верификации через API и встройте её в ваше приложение с помощью iframe или popup. Идеально подходит для Telegram Mini Apps, веб-сайтов и мобильных приложений.
                </p>
              </div>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет проектов</h3>
              <p className="text-sm text-gray-600 mb-6">Создайте проект, чтобы начать интеграцию</p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Создать проект
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Project Selector */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Выберите проект
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Platform Selector */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Платформа
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPlatform('telegram')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      platform === 'telegram'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Telegram Mini App
                  </button>
                  <button
                    onClick={() => setPlatform('web')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      platform === 'web'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Web (HTML/JS)
                  </button>
                  <button
                    onClick={() => setPlatform('react')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      platform === 'react'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    React
                  </button>
                </div>
              </div>

              {/* Code Example */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Пример кода
                  </h3>
                  <button
                    onClick={() => copyToClipboard(getCode())}
                    className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Копировать
                  </button>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-100">
                    <code>{getCode()}</code>
                  </pre>
                </div>
              </div>

              {/* How it works */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Как это работает</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Создайте сессию</h4>
                      <p className="text-sm text-gray-600">
                        Отправьте POST запрос на <code className="bg-gray-100 px-2 py-1 rounded text-xs">/api/v1/sessions</code> с вашим API ключом. В ответ вы получите URL для встраивания.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Откройте виджет</h4>
                      <p className="text-sm text-gray-600">
                        Встройте URL в iframe на вашей странице или откройте его в отдельном окне/popup. Пользователь пройдет верификацию без выхода из вашего приложения.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Получите результат</h4>
                      <p className="text-sm text-gray-600">
                        После завершения верификации виджет отправит результат через <code className="bg-gray-100 px-2 py-1 rounded text-xs">postMessage</code>. Также можно настроить webhook для получения уведомлений на ваш сервер.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* postMessage format */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Формат сообщения (postMessage)</h3>
                <div className="bg-gray-900 rounded-lg p-4">
                  <pre className="text-sm text-gray-100 overflow-x-auto">
                    <code>{`{
  "type": "kyc_complete",
  "verificationId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "APPROVED",
  "faceMatchScore": 98.5,
  "fraudScore": 12.3
}`}</code>
                  </pre>
                </div>
              </div>
            </div>
          )}
    </DashboardLayout>
  );
}
