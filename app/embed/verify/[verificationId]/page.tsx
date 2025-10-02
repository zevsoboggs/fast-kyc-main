'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

export default function EmbedVerifyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const verificationId = params.verificationId as string;
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'uploading' | 'processing' | 'complete'>('form');
  const [verification, setVerification] = useState<any>(null);
  const [project, setProject] = useState<any>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    documentFront: null as File | null,
    documentBack: null as File | null,
    selfie: null as File | null,
  });

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const response = await fetch(`/api/embed/verify/${verificationId}?token=${token}`);

      if (!response.ok) {
        setError('Неверная или истекшая ссылка верификации');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setVerification(data.verification);
      setProject(data.project);

      // Pre-fill form data from metadata
      if (data.verification.metadata) {
        setFormData(prev => ({
          ...prev,
          firstName: data.verification.metadata.firstName || '',
          lastName: data.verification.metadata.lastName || '',
        }));
      }

      setLoading(false);
    } catch (err) {
      setError('Ошибка загрузки сессии');
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.documentFront || !formData.selfie) {
      setError('Загрузите документ и селфи');
      return;
    }

    setStep('uploading');
    setError('');

    try {
      const data = new FormData();
      data.append('verificationId', verificationId);
      data.append('token', token || '');
      data.append('firstName', formData.firstName);
      data.append('lastName', formData.lastName);
      data.append('documentFront', formData.documentFront);
      if (formData.documentBack) {
        data.append('documentBack', formData.documentBack);
      }
      data.append('selfie', formData.selfie);

      const response = await fetch('/api/embed/submit', {
        method: 'POST',
        body: data,
      });

      const result = await response.json();

      if (response.ok) {
        setStep('processing');
        pollVerificationStatus(result.verification.id);
      } else {
        setError(result.error || 'Ошибка отправки');
        setStep('form');
      }
    } catch (err) {
      setError('Ошибка отправки');
      setStep('form');
    }
  };

  const pollVerificationStatus = async (id: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/embed/status/${id}?token=${token}`);

        if (response.ok) {
          const data = await response.json();

          if (data.verification.status !== 'PROCESSING' && data.verification.status !== 'PENDING') {
            setVerification(data.verification);
            setStep('complete');

            // Send result to parent window (for Telegram Mini App)
            if (window.parent !== window) {
              window.parent.postMessage({
                type: 'kyc_complete',
                verificationId: id,
                status: data.verification.status,
                faceMatchScore: data.verification.faceMatchScore,
                fraudScore: data.verification.fraudScore,
              }, '*');
            }

            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setError('Превышено время ожидания');
          setStep('form');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    poll();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error && !verification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ошибка</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">K</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Верификация личности</h1>
          <p className="text-sm text-gray-600">
            {project?.name || 'veriffy.me'}
          </p>
        </div>

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Имя
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Иван"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Фамилия
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Иванов"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Документ (лицевая сторона) *
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'documentFront')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Документ (обратная сторона)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'documentBack')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Селфи *
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'selfie')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full px-4 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Начать верификацию
            </button>
          </form>
        )}

        {(step === 'uploading' || step === 'processing') && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {step === 'uploading' ? 'Загрузка файлов...' : 'Обработка верификации...'}
            </h3>
            <p className="text-sm text-gray-600">
              Пожалуйста, подождите
            </p>
          </div>
        )}

        {step === 'complete' && verification && (
          <div className="text-center py-8">
            {verification.status === 'APPROVED' ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Верификация пройдена!
                </h3>
                <p className="text-sm text-gray-600">
                  Ваша личность успешно подтверждена
                </p>
              </>
            ) : verification.status === 'REJECTED' ? (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Верификация отклонена
                </h3>
                <p className="text-sm text-gray-600">
                  {verification.rejectionReason || 'Не удалось подтвердить личность'}
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Требуется проверка
                </h3>
                <p className="text-sm text-gray-600">
                  Ваши данные отправлены на ручную проверку
                </p>
              </>
            )}

            {verification.faceMatchScore && (
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Face Match Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {verification.faceMatchScore.toFixed(1)}%
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
