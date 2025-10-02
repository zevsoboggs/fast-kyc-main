'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<any>(null);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [totalVerifications, setTotalVerifications] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [verificationImages, setVerificationImages] = useState<any>(null);
  const [loadingImages, setLoadingImages] = useState(false);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadProjectData(token);
  }, [projectId, currentPage]);

  // Reset page when project changes
  useEffect(() => {
    setCurrentPage(1);
  }, [projectId]);

  const loadProjectData = async (token: string) => {
    try {
      const [projectRes, verificationsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`/api/projects/${projectId}/verifications?page=${currentPage}&limit=${ITEMS_PER_PAGE}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (projectRes.ok) {
        const projectData = await projectRes.json();
        setProject(projectData.project);
      } else {
        setError('Проект не найден');
      }

      if (verificationsRes.ok) {
        const verificationsData = await verificationsRes.json();
        setVerifications(verificationsData.verifications || []);
        setTotalVerifications(verificationsData.total || 0);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    // Fallback for browsers without clipboard API
    if (!navigator.clipboard) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert(`${label} скопирован в буфер обмена!`);
      } catch (err) {
        console.error('Fallback copy failed:', err);
        alert('Ошибка копирования');
      }
      document.body.removeChild(textArea);
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      alert(`${label} скопирован в буфер обмена!`);
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Ошибка копирования');
    });
  };

  const copyVerificationJSON = () => {
    if (!selectedVerification) {
      alert('Нет данных для копирования');
      return;
    }

    const json = JSON.stringify(selectedVerification, null, 2);

    // Fallback for browsers without clipboard API
    if (!navigator.clipboard) {
      const textArea = document.createElement('textarea');
      textArea.value = json;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert(`JSON скопирован! (${json.length} символов)`);
      } catch (err) {
        console.error('Fallback copy failed:', err);
        alert('Ошибка копирования');
      }
      document.body.removeChild(textArea);
      return;
    }

    navigator.clipboard.writeText(json).then(() => {
      alert(`JSON скопирован! (${json.length} символов)`);
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Ошибка копирования');
    });
  };

  const loadVerificationDetails = async (verificationId: string) => {
    setLoadingDetails(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/verifications/${verificationId}`, {
        headers: { 'X-API-Key': project.apiKey },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedVerification(data.verification);
      }
    } catch (err) {
      console.error('Failed to load verification details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const loadVerificationImages = async (verificationId: string) => {
    setLoadingImages(true);
    try {
      console.log('Loading images for verification:', verificationId);
      console.log('API Key:', project.apiKey ? 'Present' : 'Missing');

      const response = await fetch(`/api/v1/verifications/${verificationId}/images`, {
        headers: { 'X-API-Key': project.apiKey },
      });

      console.log('Images response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Images data:', data);
        setVerificationImages(data.images);
      } else {
        const error = await response.json();
        console.error('Failed to load images:', error);
      }
    } catch (err) {
      console.error('Failed to load verification images:', err);
    } finally {
      setLoadingImages(false);
    }
  };

  useEffect(() => {
    console.log('useEffect triggered', { showModal, hasVerification: !!selectedVerification, hasProject: !!project, hasApiKey: !!project?.apiKey });

    if (showModal && selectedVerification && project?.apiKey) {
      console.log('Modal opened for verification:', selectedVerification.id);
      console.log('Has documentFrontS3Key:', !!selectedVerification.documentFrontS3Key);
      console.log('Has selfieS3Key:', !!selectedVerification.selfieS3Key);
      console.log('Has verificationImages:', !!verificationImages);

      // Only load details if not already loading and ocrData is missing
      if (!selectedVerification.ocrData && !loadingDetails) {
        console.log('Loading verification details...');
        loadVerificationDetails(selectedVerification.id);
      }

      // Only load images if not already loading, no images yet, and has S3 keys
      if (!verificationImages && !loadingImages) {
        if (selectedVerification.documentFrontS3Key || selectedVerification.selfieS3Key) {
          console.log('Loading images...');
          loadVerificationImages(selectedVerification.id);
        } else {
          console.log('No S3 keys found, skipping image load');
        }
      }
    }
  }, [showModal, selectedVerification?.id, project?.apiKey]);

  useEffect(() => {
    if (!showModal) {
      setVerificationImages(null);
    }
  }, [showModal]);

  if (loading) {
    return (
      <DashboardLayout currentPage="projects">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-14 h-14 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-medium text-gray-600">Загрузка проекта...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout currentPage="projects">
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="bg-white border-2 border-red-200 rounded-xl p-8 md:p-12 max-w-md w-full text-center shadow-sm">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Ошибка</h2>
            <p className="text-sm text-gray-600 mb-6">{error || 'Проект не найден или недоступен'}</p>
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Вернуться в дашборд
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const approvedCount = verifications.filter(v => v.status === 'APPROVED').length;
  const rejectedCount = verifications.filter(v => v.status === 'REJECTED').length;
  const pendingCount = verifications.filter(v => v.status === 'PENDING' || v.status === 'PROCESSING').length;

  return (
    <DashboardLayout currentPage="projects">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад к проектам
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 truncate">{project.name}</h1>
            {project.description && (
              <p className="text-sm md:text-base text-gray-600 line-clamp-2">{project.description}</p>
            )}
          </div>
          <span className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap self-start ${project.isActive ? 'bg-green-100 text-green-700 border-2 border-green-200' : 'bg-gray-100 text-gray-600 border-2 border-gray-200'}`}>
            {project.isActive ? '● Активен' : '○ Неактивен'}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{totalVerifications}</p>
          <p className="text-sm text-gray-600 font-medium">Всего верификаций</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{approvedCount}</p>
          <p className="text-sm text-gray-600 font-medium">Одобрено</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-white border border-red-100 rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{rejectedCount}</p>
          <p className="text-sm text-gray-600 font-medium">Отклонено</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-white border border-yellow-100 rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{pendingCount}</p>
          <p className="text-sm text-gray-600 font-medium">В обработке</p>
        </div>
      </div>

      {/* API & Integration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Verification Link */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-900">Ссылка для верификации</h3>
          </div>
          <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-xs break-all mb-4 font-mono text-gray-700">
            {`${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${Buffer.from(`${project.id}:${Date.now()}:signature`).toString('base64')}`}
          </div>
          <button
            onClick={() => {
              const link = `${window.location.origin}/verify/${Buffer.from(`${project.id}:${Date.now()}:signature`).toString('base64')}`;
              copyToClipboard(link, 'Ссылка');
            }}
            className="w-full px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
          >
            Скопировать ссылку
          </button>
          <p className="text-xs text-gray-500 mt-3">
            Отправьте эту ссылку пользователям для прохождения KYC
          </p>
        </div>

        {/* API Key */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-900">API Ключ</h3>
          </div>
          <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg font-mono text-xs break-all mb-4 text-gray-700">
            {project.apiKey || '••••••••••••••••••••••••••••••••'}
          </div>
          {project.apiKey && (
            <button
              onClick={() => copyToClipboard(project.apiKey, 'API ключ')}
              className="w-full px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
            >
              Скопировать ключ
            </button>
          )}
          <p className="text-xs text-gray-500 mt-3">
            Используйте для аутентификации API запросов
          </p>
        </div>

        {/* Webhook */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-900">Webhook</h3>
          </div>
          {project.webhookUrl ? (
            <>
              <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-xs break-all mb-3 font-mono text-gray-700">
                {project.webhookUrl}
              </div>
              {project.webhookSecret && (
                <>
                  <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg font-mono text-xs break-all mb-4 text-gray-700">
                    {project.webhookSecret}
                  </div>
                  <button
                    onClick={() => copyToClipboard(project.webhookSecret, 'Webhook секрет')}
                    className="w-full px-4 py-2.5 bg-gray-100 text-gray-900 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
                  >
                    Скопировать секрет
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-500">Webhook не настроен</p>
              <p className="text-xs text-gray-400 mt-1">Настройте в настройках проекта</p>
            </div>
          )}
        </div>
      </div>

      {/* Verifications Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900">Верификации</h2>
            <p className="text-sm text-gray-600 mt-1">{totalVerifications} {totalVerifications === 1 ? 'запись' : totalVerifications < 5 ? 'записи' : 'записей'}</p>
          </div>
        </div>

        {verifications.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Нет верификаций</h3>
            <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
              Начните отправлять запросы на верификацию через API или используйте ссылку для верификации
            </p>
            <Link href="/dashboard/integration" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Посмотреть интеграцию
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-5 text-xs font-bold text-gray-700 uppercase tracking-wider">ID</th>
                  <th className="text-left py-4 px-5 text-xs font-bold text-gray-700 uppercase tracking-wider">Имя</th>
                  <th className="text-left py-4 px-5 text-xs font-bold text-gray-700 uppercase tracking-wider">Статус</th>
                  <th className="text-left py-4 px-5 text-xs font-bold text-gray-700 uppercase tracking-wider">Face Match</th>
                  <th className="text-left py-4 px-5 text-xs font-bold text-gray-700 uppercase tracking-wider">Fraud</th>
                  <th className="text-left py-4 px-5 text-xs font-bold text-gray-700 uppercase tracking-wider">Дата</th>
                  <th className="text-left py-4 px-5 text-xs font-bold text-gray-700 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {verifications.map((verification) => (
                  <tr key={verification.id} className="hover:bg-gray-50 transition-all group">
                    <td className="py-4 px-5 font-mono text-xs text-gray-500">
                      {verification.id.substring(0, 10)}...
                    </td>
                    <td className="py-4 px-5 text-sm font-medium text-gray-900">
                      {verification.firstName && verification.lastName
                        ? `${verification.firstName} ${verification.lastName}`
                        : verification.externalId || '-'}
                    </td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        verification.status === 'APPROVED' ? 'bg-green-100 text-green-700 border border-green-200' :
                        verification.status === 'REJECTED' ? 'bg-red-100 text-red-700 border border-red-200' :
                        verification.status === 'MANUAL_REVIEW' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                        'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
                        {verification.status === 'APPROVED' && '✓'}
                        {verification.status === 'REJECTED' && '✗'}
                        {verification.status === 'MANUAL_REVIEW' && '⚠'}
                        {verification.status}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      {verification.faceMatchScore ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[60px]">
                            <div
                              className={`h-full ${
                                verification.faceMatchScore >= 80 ? 'bg-green-500' :
                                verification.faceMatchScore >= 60 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{width: `${verification.faceMatchScore}%`}}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {verification.faceMatchScore.toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      {verification.fraudScore !== null && verification.fraudScore !== undefined ? (
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${
                          verification.fraudScore < 30 ? 'bg-green-50 text-green-700' :
                          verification.fraudScore < 60 ? 'bg-yellow-50 text-yellow-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {verification.fraudScore.toFixed(1)}
                        </span>
                      ) : <span className="text-sm text-gray-400">-</span>}
                    </td>
                    <td className="py-4 px-5 text-sm text-gray-600">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {new Date(verification.createdAt).toLocaleDateString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(verification.createdAt).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <button
                        onClick={() => {
                          setSelectedVerification(verification);
                          setShowModal(true);
                        }}
                        className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 text-sm font-semibold group-hover:gap-2 transition-all"
                      >
                        Подробнее
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalVerifications > ITEMS_PER_PAGE && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600 font-medium">
              Показано {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalVerifications)} из {totalVerifications}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Назад
              </button>
              <div className="hidden sm:flex items-center gap-1">
                <span className="px-3 py-2 text-sm font-bold text-gray-900">
                  {currentPage}
                </span>
                <span className="text-sm text-gray-500">из</span>
                <span className="px-3 py-2 text-sm font-bold text-gray-900">
                  {Math.ceil(totalVerifications / ITEMS_PER_PAGE)}
                </span>
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalVerifications / ITEMS_PER_PAGE), prev + 1))}
                disabled={currentPage >= Math.ceil(totalVerifications / ITEMS_PER_PAGE)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
              >
                Вперёд
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Детали верификации</h3>
                <p className="text-sm text-gray-500 font-mono mt-1">{selectedVerification.id}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingDetails ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Загрузка деталей...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Статус</h4>
                  <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                    selectedVerification.status === 'APPROVED' ? 'bg-green-50 text-green-700 border border-green-200' :
                    selectedVerification.status === 'REJECTED' ? 'bg-red-50 text-red-700 border border-red-200' :
                    selectedVerification.status === 'MANUAL_REVIEW' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                    'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}>
                    {{
                      'APPROVED': 'Одобрено',
                      'REJECTED': 'Отклонено',
                      'MANUAL_REVIEW': 'Требует проверки',
                      'PROCESSING': 'Обработка',
                      'PENDING': 'Ожидание'
                    }[selectedVerification.status] || selectedVerification.status}
                  </span>
                  {selectedVerification.rejectionReason && (
                    <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm font-semibold text-red-900 mb-1">Причина отклонения:</p>
                      <p className="text-sm text-red-800">{selectedVerification.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {/* Images Section */}
                {verificationImages && (verificationImages.documentFront || verificationImages.selfie) && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Документы и фото</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      {verificationImages.documentFront && (
                        <div>
                          <p className="text-xs text-gray-600 mb-2">Документ (лицевая сторона)</p>
                          <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                            <img
                              src={verificationImages.documentFront}
                              alt="Document Front"
                              className="w-full h-48 object-contain"
                            />
                          </div>
                        </div>
                      )}

                      {verificationImages.documentBack && (
                        <div>
                          <p className="text-xs text-gray-600 mb-2">Документ (обратная сторона)</p>
                          <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                            <img
                              src={verificationImages.documentBack}
                              alt="Document Back"
                              className="w-full h-48 object-contain"
                            />
                          </div>
                        </div>
                      )}

                      {verificationImages.selfie && (
                        <div>
                          <p className="text-xs text-gray-600 mb-2">Селфи</p>
                          <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                            <img
                              src={verificationImages.selfie}
                              alt="Selfie"
                              className="w-full h-48 object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {loadingImages && (
                  <div className="text-center py-4">
                    <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-500 mt-2">Загрузка фотографий...</p>
                  </div>
                )}

                {/* No images available message */}
                {!loadingImages && !verificationImages && selectedVerification && !selectedVerification.documentFrontS3Key && !selectedVerification.selfieS3Key && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-600">Документы и фотографии недоступны</p>
                    <p className="text-xs text-gray-500 mt-1">Эта верификация была создана до добавления функции хранения изображений</p>
                  </div>
                )}

                {/* Face Match Visualization */}
                {verificationImages && verificationImages.documentFront && verificationImages.selfie && selectedVerification.faceMatchScore && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Сравнение лиц</h4>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between gap-6">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-700 mb-2 text-center">Фото из документа</p>
                          <div className={`bg-white rounded-lg overflow-hidden border-3 ${selectedVerification.faceMatchScore >= 80 ? 'border-green-400' : selectedVerification.faceMatchScore >= 60 ? 'border-yellow-400' : 'border-red-400'} shadow-lg relative`}>
                            <img
                              src={verificationImages.documentFront}
                              alt="Document"
                              className="w-full h-40 object-contain"
                            />
                            <div className="absolute inset-0 pointer-events-none">
                              <div className={`absolute top-2 left-2 right-2 bottom-2 border-2 ${selectedVerification.faceMatchScore >= 80 ? 'border-green-500' : selectedVerification.faceMatchScore >= 60 ? 'border-yellow-500' : 'border-red-500'} rounded-lg`}></div>
                            </div>
                            <div className="absolute top-2 left-2">
                              <div className={`px-2 py-1 rounded text-xs font-bold ${selectedVerification.faceMatchScore >= 80 ? 'bg-green-500' : selectedVerification.faceMatchScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'} text-white`}>
                                Документ
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-3">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${selectedVerification.faceMatchScore >= 80 ? 'bg-green-100' : selectedVerification.faceMatchScore >= 60 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                            {selectedVerification.faceMatchScore >= 80 ? (
                              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : selectedVerification.faceMatchScore >= 60 ? (
                              <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            ) : (
                              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </div>
                          <div className="text-center">
                            <div className={`text-3xl font-bold ${selectedVerification.faceMatchScore >= 80 ? 'text-green-600' : selectedVerification.faceMatchScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {selectedVerification.faceMatchScore.toFixed(1)}%
                            </div>
                            <p className="text-xs font-medium text-gray-600 mt-1">Совпадение</p>
                          </div>
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-8 rounded-full ${
                                  i < Math.floor(selectedVerification.faceMatchScore / 20)
                                    ? selectedVerification.faceMatchScore >= 80
                                      ? 'bg-green-500'
                                      : selectedVerification.faceMatchScore >= 60
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                    : 'bg-gray-300'
                                }`}
                              ></div>
                            ))}
                          </div>
                        </div>

                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-700 mb-2 text-center">Селфи</p>
                          <div className={`bg-white rounded-lg overflow-hidden border-3 ${selectedVerification.faceMatchScore >= 80 ? 'border-green-400' : selectedVerification.faceMatchScore >= 60 ? 'border-yellow-400' : 'border-red-400'} shadow-lg relative`}>
                            <img
                              src={verificationImages.selfie}
                              alt="Selfie"
                              className="w-full h-40 object-contain"
                            />
                            <div className="absolute inset-0 pointer-events-none">
                              <div className={`absolute top-2 left-2 right-2 bottom-2 border-2 ${selectedVerification.faceMatchScore >= 80 ? 'border-green-500' : selectedVerification.faceMatchScore >= 60 ? 'border-yellow-500' : 'border-red-500'} rounded-lg`}></div>
                            </div>
                            <div className="absolute top-2 right-2">
                              <div className={`px-2 py-1 rounded text-xs font-bold ${selectedVerification.faceMatchScore >= 80 ? 'bg-green-500' : selectedVerification.faceMatchScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'} text-white`}>
                                Селфи
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-300 grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Уровень уверенности:</span>
                            <span className="text-sm font-bold text-gray-900">
                              {selectedVerification.faceMatchConfidence?.toFixed(1) || 'N/A'}%
                            </span>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Статус:</span>
                            <span className={`text-xs font-bold ${selectedVerification.faceMatchScore >= 80 ? 'text-green-600' : selectedVerification.faceMatchScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {selectedVerification.faceMatchScore >= 80 ? '✓ Подтверждено' : selectedVerification.faceMatchScore >= 60 ? '⚠ Требует проверки' : '✗ Не совпадает'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(selectedVerification.firstName || selectedVerification.lastName) && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Персональные данные
                      {selectedVerification.mrzData?.valid && (
                        <span className="ml-2 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded">
                          ✓ Из MRZ
                        </span>
                      )}
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      {selectedVerification.firstName && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Имя:</span>
                          <span className="font-medium">{selectedVerification.firstName}</span>
                        </div>
                      )}
                      {selectedVerification.lastName && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Фамилия:</span>
                          <span className="font-medium">{selectedVerification.lastName}</span>
                        </div>
                      )}
                      {selectedVerification.dateOfBirth && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Дата рождения:</span>
                          <span className="font-medium">
                            {new Date(selectedVerification.dateOfBirth).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                      )}
                      {selectedVerification.documentNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Номер документа:</span>
                          <span className="font-medium font-mono">{selectedVerification.documentNumber}</span>
                        </div>
                      )}
                      {selectedVerification.nationality && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Гражданство:</span>
                          <span className="font-medium">{selectedVerification.nationality}</span>
                        </div>
                      )}
                      {selectedVerification.documentType && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Тип документа:</span>
                          <span className="font-medium">{selectedVerification.documentType}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedVerification.ocrData && Object.keys(selectedVerification.ocrData).length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Дополнительные данные из документа</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm max-h-60 overflow-y-auto">
                      {Object.entries(selectedVerification.ocrData)
                        .filter(([key, data]: [string, any]) => {
                          // Skip fields that are already shown above or are duplicates
                          const skipFields = ['FIRST_NAME', 'LAST_NAME', 'DOCUMENT_NUMBER', 'DATE_OF_BIRTH', 'MRZ_CODE'];
                          if (skipFields.includes(key)) return false;
                          return data?.value && data.value.trim() !== '';
                        })
                        .map(([key, data]: [string, any]) => (
                          <div key={key} className="flex justify-between border-b border-gray-200 pb-1">
                            <span className="text-gray-600 font-medium">
                              {key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}:
                            </span>
                            <span className="font-mono text-xs text-gray-900 text-right max-w-md truncate">
                              {data.value} <span className="text-gray-400">({data.confidence?.toFixed(0)}%)</span>
                            </span>
                          </div>
                        ))}
                    </div>
                    {selectedVerification.mrzData?.parsed && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-900">
                          <strong>MRZ проверен:</strong> Данные извлечены из машиночитаемой зоны документа (выше в "Персональные данные")
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Face Match</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {selectedVerification.faceMatchScore
                          ? `${selectedVerification.faceMatchScore.toFixed(1)}%`
                          : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Confidence: {selectedVerification.faceMatchConfidence?.toFixed(1) || 'N/A'}%
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Fraud Score</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className={`text-3xl font-bold mb-1 ${
                        selectedVerification.fraudScore < 30 ? 'text-green-600' :
                        selectedVerification.fraudScore < 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {selectedVerification.fraudScore?.toFixed(1) || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Уровень риска: {{
                          'LOW': 'Низкий',
                          'MEDIUM': 'Средний',
                          'HIGH': 'Высокий'
                        }[selectedVerification.fraudRiskLevel] || selectedVerification.fraudRiskLevel || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedVerification.fraudReasons && Array.isArray(selectedVerification.fraudReasons) && selectedVerification.fraudReasons.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Причины подозрения</h4>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <ul className="list-disc list-inside space-y-1">
                        {selectedVerification.fraudReasons.map((reason: string, idx: number) => (
                          <li key={idx} className="text-sm text-yellow-900">{reason}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {(selectedVerification.deviceInfo || selectedVerification.userAgent) && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Device and Browser</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                      {selectedVerification.deviceInfo ? (
                        <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Platform:</span>
                        <span className="font-medium capitalize">{selectedVerification.deviceInfo.platform}</span>
                      </div>
                      {selectedVerification.deviceInfo.brand && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Brand:</span>
                          <span className="font-medium">{selectedVerification.deviceInfo.brand}</span>
                        </div>
                      )}
                      {selectedVerification.deviceInfo.model && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Model:</span>
                          <span className="font-medium">{selectedVerification.deviceInfo.model}</span>
                        </div>
                      )}
                      {selectedVerification.deviceInfo.os && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">OS:</span>
                          <span className="font-medium">{selectedVerification.deviceInfo.os} {selectedVerification.deviceInfo.osVersion}</span>
                        </div>
                      )}
                      {selectedVerification.deviceInfo.browser && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Browser:</span>
                          <span className="font-medium">{selectedVerification.deviceInfo.browser} {selectedVerification.deviceInfo.browserVersion}</span>
                        </div>
                      )}
                        </>
                      ) : selectedVerification.userAgent ? (
                        <div className="flex justify-between">
                          <span className="text-gray-600">User Agent:</span>
                          <span className="font-medium text-xs break-all">{selectedVerification.userAgent}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                {(selectedVerification.ipGeoLocation || selectedVerification.ipAddress) && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">IP Analysis</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3 text-sm">
                      {selectedVerification.ipGeoLocation ? (
                        <>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Network details</p>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">IP Location:</span>
                            <span className="font-medium font-mono">{selectedVerification.ipGeoLocation.ip}</span>
                          </div>
                          {selectedVerification.ipGeoLocation.city && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">City:</span>
                              <span className="font-medium">{selectedVerification.ipGeoLocation.city}</span>
                            </div>
                          )}
                          {selectedVerification.ipGeoLocation.country && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Country:</span>
                              <span className="font-medium">{selectedVerification.ipGeoLocation.countryCode} {selectedVerification.ipGeoLocation.country}</span>
                            </div>
                          )}
                          {selectedVerification.ipGeoLocation.isp && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">ISP:</span>
                              <span className="font-medium">{selectedVerification.ipGeoLocation.isp}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {(selectedVerification.ipGeoLocation.isVPN ||
                        selectedVerification.ipGeoLocation.isProxy ||
                        selectedVerification.ipGeoLocation.isDataCenter ||
                        selectedVerification.ipGeoLocation.isTor) && (
                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-2">Privacy detection</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedVerification.ipGeoLocation.isVPN && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">VPN</span>
                            )}
                            {selectedVerification.ipGeoLocation.isProxy && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">Proxy</span>
                            )}
                            {selectedVerification.ipGeoLocation.isDataCenter && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">Data Center</span>
                            )}
                            {selectedVerification.ipGeoLocation.isTor && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Tor</span>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedVerification.ipGeoLocation.timezone && (
                        <div className="pt-3 border-t border-gray-200">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Timezone:</span>
                            <span className="font-medium">{selectedVerification.ipGeoLocation.timezone}</span>
                          </div>
                        </div>
                      )}
                        </>
                      ) : selectedVerification.ipAddress ? (
                        <div className="flex justify-between">
                          <span className="text-gray-600">IP Address:</span>
                          <span className="font-medium font-mono">{selectedVerification.ipAddress}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Временные метки</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Создано:</span>
                      <span>{new Date(selectedVerification.createdAt).toLocaleString('ru-RU')}</span>
                    </div>
                    {selectedVerification.completedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Завершено:</span>
                        <span>{new Date(selectedVerification.completedAt).toLocaleString('ru-RU')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                  >
                    Закрыть
                  </button>
                  <button
                    onClick={copyVerificationJSON}
                    className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Копировать JSON
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
