'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

type Language = 'curl' | 'javascript' | 'python' | 'php';

export default function DocumentationPage() {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('curl');
  const [activeSection, setActiveSection] = useState('getting-started');

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  const getCodeExample = (endpoint: string, method: string) => {
    const examples: Record<Language, string> = {
      curl: getCurlExample(endpoint, method),
      javascript: getJavaScriptExample(endpoint, method),
      python: getPythonExample(endpoint, method),
      php: getPhpExample(endpoint, method),
    };
    return examples[selectedLanguage];
  };

  const getCurlExample = (endpoint: string, method: string) => {
    if (endpoint === '/api/v1/verifications' && method === 'POST') {
      return `curl -X POST https://your-domain.com/api/v1/verifications \\
  -H "X-API-Key: your_api_key_here" \\
  -F "firstName=John" \\
  -F "lastName=Doe" \\
  -F "documentFront=@/path/to/document_front.jpg" \\
  -F "selfie=@/path/to/selfie.jpg"`;
    }
    if (endpoint === '/api/v1/verifications/:id' && method === 'GET') {
      return `curl -X GET https://your-domain.com/api/v1/verifications/123 \\
  -H "X-API-Key: your_api_key_here"`;
    }
    if (endpoint === '/api/v1/verifications' && method === 'GET') {
      return `curl -X GET "https://your-domain.com/api/v1/verifications?limit=10&offset=0" \\
  -H "X-API-Key: your_api_key_here"`;
    }
    return '';
  };

  const getJavaScriptExample = (endpoint: string, method: string) => {
    if (endpoint === '/api/v1/verifications' && method === 'POST') {
      return `const formData = new FormData();
formData.append('firstName', 'John');
formData.append('lastName', 'Doe');
formData.append('documentFront', documentFrontFile);
formData.append('selfie', selfieFile);

const response = await fetch('https://your-domain.com/api/v1/verifications', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your_api_key_here'
  },
  body: formData
});

const data = await response.json();
console.log(data);`;
    }
    if (endpoint === '/api/v1/verifications/:id' && method === 'GET') {
      return `const response = await fetch('https://your-domain.com/api/v1/verifications/123', {
  method: 'GET',
  headers: {
    'X-API-Key': 'your_api_key_here'
  }
});

const data = await response.json();
console.log(data);`;
    }
    if (endpoint === '/api/v1/verifications' && method === 'GET') {
      return `const response = await fetch('https://your-domain.com/api/v1/verifications?limit=10&offset=0', {
  method: 'GET',
  headers: {
    'X-API-Key': 'your_api_key_here'
  }
});

const data = await response.json();
console.log(data);`;
    }
    return '';
  };

  const getPythonExample = (endpoint: string, method: string) => {
    if (endpoint === '/api/v1/verifications' && method === 'POST') {
      return `import requests

files = {
    'documentFront': open('document_front.jpg', 'rb'),
    'selfie': open('selfie.jpg', 'rb')
}

data = {
    'firstName': 'John',
    'lastName': 'Doe'
}

headers = {
    'X-API-Key': 'your_api_key_here'
}

response = requests.post(
    'https://your-domain.com/api/v1/verifications',
    headers=headers,
    data=data,
    files=files
)

print(response.json())`;
    }
    if (endpoint === '/api/v1/verifications/:id' && method === 'GET') {
      return `import requests

headers = {
    'X-API-Key': 'your_api_key_here'
}

response = requests.get(
    'https://your-domain.com/api/v1/verifications/123',
    headers=headers
)

print(response.json())`;
    }
    if (endpoint === '/api/v1/verifications' && method === 'GET') {
      return `import requests

headers = {
    'X-API-Key': 'your_api_key_here'
}

params = {
    'limit': 10,
    'offset': 0
}

response = requests.get(
    'https://your-domain.com/api/v1/verifications',
    headers=headers,
    params=params
)

print(response.json())`;
    }
    return '';
  };

  const getPhpExample = (endpoint: string, method: string) => {
    if (endpoint === '/api/v1/verifications' && method === 'POST') {
      return `<?php
$ch = curl_init();

$data = [
    'firstName' => 'John',
    'lastName' => 'Doe',
    'documentFront' => new CURLFile('document_front.jpg'),
    'selfie' => new CURLFile('selfie.jpg')
];

curl_setopt_array($ch, [
    CURLOPT_URL => 'https://your-domain.com/api/v1/verifications',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $data,
    CURLOPT_HTTPHEADER => [
        'X-API-Key: your_api_key_here'
    ]
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>`;
    }
    if (endpoint === '/api/v1/verifications/:id' && method === 'GET') {
      return `<?php
$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => 'https://your-domain.com/api/v1/verifications/123',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'X-API-Key: your_api_key_here'
    ]
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>`;
    }
    if (endpoint === '/api/v1/verifications' && method === 'GET') {
      return `<?php
$ch = curl_init();

$params = http_build_query([
    'limit' => 10,
    'offset' => 0
]);

curl_setopt_array($ch, [
    CURLOPT_URL => 'https://your-domain.com/api/v1/verifications?' . $params,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'X-API-Key: your_api_key_here'
    ]
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>`;
    }
    return '';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <DashboardLayout currentPage="documentation">
      <div className="flex">
        {/* Left TOC */}
        <aside className="hidden lg:block w-64 border-r border-gray-200 bg-white fixed left-64 top-16 bottom-0 overflow-y-auto">
            <nav className="p-6 space-y-1">
              <button
                onClick={() => setActiveSection('getting-started')}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeSection === 'getting-started' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Начало работы
              </button>
              <button
                onClick={() => setActiveSection('authentication')}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeSection === 'authentication' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Аутентификация
              </button>
              <button
                onClick={() => setActiveSection('create-verification')}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeSection === 'create-verification' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Создать верификацию
              </button>
              <button
                onClick={() => setActiveSection('get-verification')}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeSection === 'get-verification' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Получить верификацию
              </button>
              <button
                onClick={() => setActiveSection('list-verifications')}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeSection === 'list-verifications' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Список верификаций
              </button>
              <button
                onClick={() => setActiveSection('webhooks')}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeSection === 'webhooks' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Webhooks
              </button>
              <button
                onClick={() => setActiveSection('errors')}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeSection === 'errors' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Коды ошибок
              </button>
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 lg:ml-64 p-8">
            <div className="max-w-4xl">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Документация API</h1>
                <p className="text-gray-600">Полное руководство по интеграции veriffy.me API</p>
              </div>

              {/* Language Selector */}
              <div className="mb-8 flex gap-2">
                <button
                  onClick={() => setSelectedLanguage('curl')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    selectedLanguage === 'curl' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setSelectedLanguage('javascript')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    selectedLanguage === 'javascript' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  JavaScript
                </button>
                <button
                  onClick={() => setSelectedLanguage('python')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    selectedLanguage === 'python' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Python
                </button>
                <button
                  onClick={() => setSelectedLanguage('php')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    selectedLanguage === 'php' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  PHP
                </button>
              </div>

              {/* Getting Started */}
              {activeSection === 'getting-started' && (
                <div className="space-y-6">
                  <section className="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Начало работы</h2>
                    <p className="text-gray-600 mb-4">
                      veriffy.me API позволяет проводить верификацию личности с использованием искусственного интеллекта и машинного обучения.
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Базовый URL</h3>
                    <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm mb-4">
                      https://your-domain.com/api/v1
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Формат ответа</h3>
                    <p className="text-gray-600 mb-2">Все ответы возвращаются в формате JSON.</p>
                  </section>
                </div>
              )}

              {/* Authentication */}
              {activeSection === 'authentication' && (
                <div className="space-y-6">
                  <section className="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Аутентификация</h2>
                    <p className="text-gray-600 mb-4">
                      Для доступа к API используйте API ключ проекта. Передавайте его в заголовке <code className="bg-gray-100 px-2 py-1 rounded text-sm">X-API-Key</code>.
                    </p>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-xs">Пример запроса</span>
                        <button
                          onClick={() => copyToClipboard('curl -H "X-API-Key: your_api_key_here" https://your-domain.com/api/v1/verifications')}
                          className="text-gray-400 hover:text-white text-xs"
                        >
                          Копировать
                        </button>
                      </div>
                      <pre className="text-sm text-gray-100 overflow-x-auto">
                        <code>curl -H "X-API-Key: your_api_key_here" \
  https://your-domain.com/api/v1/verifications</code>
                      </pre>
                    </div>
                  </section>
                </div>
              )}

              {/* Create Verification */}
              {activeSection === 'create-verification' && (
                <div className="space-y-6">
                  <section className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded">POST</span>
                      <code className="text-lg font-mono">/api/v1/verifications</code>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Создание новой верификации с загрузкой документов и селфи.
                    </p>

                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Параметры</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">firstName</code>
                        <span className="text-sm text-gray-600">Имя (опционально)</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">lastName</code>
                        <span className="text-sm text-gray-600">Фамилия (опционально)</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">documentFront</code>
                        <span className="text-sm text-gray-600">Лицевая сторона документа (обязательно)</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">documentBack</code>
                        <span className="text-sm text-gray-600">Обратная сторона документа (опционально)</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">selfie</code>
                        <span className="text-sm text-gray-600">Селфи (обязательно)</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Пример запроса</h3>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-xs">{selectedLanguage.toUpperCase()}</span>
                        <button
                          onClick={() => copyToClipboard(getCodeExample('/api/v1/verifications', 'POST'))}
                          className="text-gray-400 hover:text-white text-xs"
                        >
                          Копировать
                        </button>
                      </div>
                      <pre className="text-sm text-gray-100 overflow-x-auto">
                        <code>{getCodeExample('/api/v1/verifications', 'POST')}</code>
                      </pre>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Пример ответа</h3>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <pre className="text-sm text-gray-100 overflow-x-auto">
                        <code>{`{
  "verification": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "PROCESSING",
    "createdAt": "2025-10-01T10:00:00Z"
  }
}`}</code>
                      </pre>
                    </div>
                  </section>
                </div>
              )}

              {/* Get Verification */}
              {activeSection === 'get-verification' && (
                <div className="space-y-6">
                  <section className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded">GET</span>
                      <code className="text-lg font-mono">/api/v1/verifications/:id</code>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Получение информации о верификации по ID.
                    </p>

                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Пример запроса</h3>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-xs">{selectedLanguage.toUpperCase()}</span>
                        <button
                          onClick={() => copyToClipboard(getCodeExample('/api/v1/verifications/:id', 'GET'))}
                          className="text-gray-400 hover:text-white text-xs"
                        >
                          Копировать
                        </button>
                      </div>
                      <pre className="text-sm text-gray-100 overflow-x-auto">
                        <code>{getCodeExample('/api/v1/verifications/:id', 'GET')}</code>
                      </pre>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Пример ответа</h3>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <pre className="text-sm text-gray-100 overflow-x-auto">
                        <code>{`{
  "verification": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "APPROVED",
    "firstName": "John",
    "lastName": "Doe",
    "faceMatchScore": 98.5,
    "fraudScore": 12.3,
    "createdAt": "2025-10-01T10:00:00Z",
    "completedAt": "2025-10-01T10:02:30Z"
  }
}`}</code>
                      </pre>
                    </div>
                  </section>
                </div>
              )}

              {/* List Verifications */}
              {activeSection === 'list-verifications' && (
                <div className="space-y-6">
                  <section className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded">GET</span>
                      <code className="text-lg font-mono">/api/v1/verifications</code>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Получение списка всех верификаций с поддержкой пагинации.
                    </p>

                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Query параметры</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">limit</code>
                        <span className="text-sm text-gray-600">Количество записей (по умолчанию: 10)</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">offset</code>
                        <span className="text-sm text-gray-600">Смещение (по умолчанию: 0)</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">status</code>
                        <span className="text-sm text-gray-600">Фильтр по статусу</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Пример запроса</h3>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-xs">{selectedLanguage.toUpperCase()}</span>
                        <button
                          onClick={() => copyToClipboard(getCodeExample('/api/v1/verifications', 'GET'))}
                          className="text-gray-400 hover:text-white text-xs"
                        >
                          Копировать
                        </button>
                      </div>
                      <pre className="text-sm text-gray-100 overflow-x-auto">
                        <code>{getCodeExample('/api/v1/verifications', 'GET')}</code>
                      </pre>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Пример ответа</h3>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <pre className="text-sm text-gray-100 overflow-x-auto">
                        <code>{`{
  "verifications": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "status": "APPROVED",
      "faceMatchScore": 98.5,
      "createdAt": "2025-10-01T10:00:00Z"
    }
  ],
  "total": 42,
  "limit": 10,
  "offset": 0
}`}</code>
                      </pre>
                    </div>
                  </section>
                </div>
              )}

              {/* Webhooks */}
              {activeSection === 'webhooks' && (
                <div className="space-y-6">
                  <section className="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Webhooks</h2>
                    <p className="text-gray-600 mb-4">
                      Настройте webhook URL в настройках проекта для получения уведомлений о событиях верификации.
                    </p>

                    <h3 className="text-lg font-semibold text-gray-900 mb-3">События</h3>
                    <ul className="list-disc list-inside space-y-2 mb-4 text-gray-600">
                      <li><code className="bg-gray-100 px-2 py-1 rounded text-sm">verification.completed</code> - Верификация завершена</li>
                      <li><code className="bg-gray-100 px-2 py-1 rounded text-sm">verification.approved</code> - Верификация одобрена</li>
                      <li><code className="bg-gray-100 px-2 py-1 rounded text-sm">verification.rejected</code> - Верификация отклонена</li>
                      <li><code className="bg-gray-100 px-2 py-1 rounded text-sm">verification.manual_review</code> - Требуется ручная проверка</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Формат payload</h3>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <pre className="text-sm text-gray-100 overflow-x-auto">
                        <code>{`{
  "event": "verification.completed",
  "verification": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "APPROVED",
    "faceMatchScore": 98.5,
    "fraudScore": 12.3,
    "completedAt": "2025-10-01T10:02:30Z"
  }
}`}</code>
                      </pre>
                    </div>
                  </section>
                </div>
              )}

              {/* Errors */}
              {activeSection === 'errors' && (
                <div className="space-y-6">
                  <section className="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Коды ошибок</h2>
                    <div className="space-y-4">
                      <div>
                        <code className="text-lg font-semibold">400 Bad Request</code>
                        <p className="text-gray-600 mt-1">Неверные параметры запроса</p>
                      </div>
                      <div>
                        <code className="text-lg font-semibold">401 Unauthorized</code>
                        <p className="text-gray-600 mt-1">Отсутствует или неверный API ключ</p>
                      </div>
                      <div>
                        <code className="text-lg font-semibold">404 Not Found</code>
                        <p className="text-gray-600 mt-1">Ресурс не найден</p>
                      </div>
                      <div>
                        <code className="text-lg font-semibold">429 Too Many Requests</code>
                        <p className="text-gray-600 mt-1">Превышен лимит запросов</p>
                      </div>
                      <div>
                        <code className="text-lg font-semibold">500 Internal Server Error</code>
                        <p className="text-gray-600 mt-1">Внутренняя ошибка сервера</p>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Формат ошибки</h3>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <pre className="text-sm text-gray-100 overflow-x-auto">
                        <code>{`{
  "error": "Invalid API key",
  "code": "UNAUTHORIZED",
  "statusCode": 401
}`}</code>
                      </pre>
                    </div>
                  </section>
                </div>
              )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
