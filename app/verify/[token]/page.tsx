'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { COUNTRIES, DOCUMENT_TYPES } from '@/lib/constants/countries';

type Step = 'welcome' | 'country-selection' | 'document-type-selection' | 'document-front' | 'document-back' | 'selfie' | 'processing' | 'success' | 'error';

export default function VerifyPage() {
  const params = useParams();
  const token = params.token as string;

  const [step, setStep] = useState<Step>('welcome');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [countrySearch, setCountrySearch] = useState('');
  const [documentFront, setDocumentFront] = useState<File | null>(null);
  const [documentBack, setDocumentBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [mounted, setMounted] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string>('PROCESSING');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStarted, setScanStarted] = useState(false);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scanAnimationRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (cameraActive && step !== 'welcome') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [cameraActive, step, mounted]);

  useEffect(() => {
    // Reset scan state when changing steps
    if (step !== 'selfie') {
      setScanStarted(false);
      stopVisualScan();
    }
  }, [step]);

  const startCamera = async () => {
    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('Camera API not available');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: step === 'selfie' ? 'user' : 'environment', width: 1920, height: 1080 },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Не удалось получить доступ к камере');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const startVisualScan = () => {
    if (!overlayCanvasRef.current || !videoRef.current) return;

    setScanProgress(0);
    setIsScanning(true);

    let progress = 0;
    let animationFrame = 0;

    // Progress timer - complete in 3 seconds
    scanIntervalRef.current = setInterval(() => {
      progress += 100 / 30; // 30 intervals * 100ms = 3000ms
      setScanProgress(Math.min(progress, 100));

      if (progress >= 100) {
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
          scanIntervalRef.current = null;
        }
        // Auto-capture after scan completes
        setTimeout(() => {
          if (step === 'selfie') {
            capturePhoto();
          }
        }, 300);
      }
    }, 100);

    // Animation loop for visual effects
    const animate = () => {
      if (!overlayCanvasRef.current || !videoRef.current) return;

      const canvas = overlayCanvasRef.current;
      const video = videoRef.current;

      // Set canvas size to match video
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) * 0.35;

      // Draw circular guide with pulsing effect
      const pulseScale = 1 + Math.sin(animationFrame * 0.05) * 0.03;
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * pulseScale, 0, Math.PI * 2);
      ctx.stroke();

      // Draw scanning line that moves from top to bottom
      const scanLineProgress = (animationFrame % 60) / 60;
      const scanLineY = centerY - radius + (radius * 2 * scanLineProgress);

      // Draw scanning gradient
      const gradient = ctx.createLinearGradient(centerX - radius, scanLineY - 40, centerX - radius, scanLineY + 40);
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0)');
      gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.6)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(centerX - radius, scanLineY - 40, radius * 2, 80);

      // Draw scan line
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX - radius, scanLineY);
      ctx.lineTo(centerX + radius, scanLineY);
      ctx.stroke();

      // Draw corner brackets
      const bracketSize = 30;
      const bracketOffset = 10;
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';

      // Top-left
      ctx.beginPath();
      ctx.moveTo(centerX - radius + bracketOffset, centerY - radius + bracketSize);
      ctx.lineTo(centerX - radius + bracketOffset, centerY - radius + bracketOffset);
      ctx.lineTo(centerX - radius + bracketSize, centerY - radius + bracketOffset);
      ctx.stroke();

      // Top-right
      ctx.beginPath();
      ctx.moveTo(centerX + radius - bracketSize, centerY - radius + bracketOffset);
      ctx.lineTo(centerX + radius - bracketOffset, centerY - radius + bracketOffset);
      ctx.lineTo(centerX + radius - bracketOffset, centerY - radius + bracketSize);
      ctx.stroke();

      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(centerX - radius + bracketOffset, centerY + radius - bracketSize);
      ctx.lineTo(centerX - radius + bracketOffset, centerY + radius - bracketOffset);
      ctx.lineTo(centerX - radius + bracketSize, centerY + radius - bracketOffset);
      ctx.stroke();

      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(centerX + radius - bracketSize, centerY + radius - bracketOffset);
      ctx.lineTo(centerX + radius - bracketOffset, centerY + radius - bracketOffset);
      ctx.lineTo(centerX + radius - bracketOffset, centerY + radius - bracketSize);
      ctx.stroke();

      animationFrame++;
      scanAnimationRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  const stopVisualScan = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (scanAnimationRef.current) {
      cancelAnimationFrame(scanAnimationRef.current);
      scanAnimationRef.current = null;
    }
    setScanProgress(0);
    setIsScanning(false);

    // Clear overlay canvas
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
      }
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Stop visual scan before capturing
    if (step === 'selfie') {
      stopVisualScan();
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], `${step}.jpg`, { type: 'image/jpeg' });

      if (step === 'document-front') {
        setDocumentFront(file);
        // Skip back side for passport
        const selectedDoc = DOCUMENT_TYPES.find(d => d.id === selectedDocumentType);
        if (selectedDoc && !selectedDoc.hasBackSide) {
          setStep('selfie');
        } else {
          setStep('document-back');
        }
      } else if (step === 'document-back') {
        setDocumentBack(file);
        setStep('selfie');
      } else if (step === 'selfie') {
        setSelfie(file);
        setCameraActive(false);
        submitVerification(documentFront!, documentBack, file);
      }
    }, 'image/jpeg', 0.95);
  };

  const captureWithCountdown = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          capturePhoto();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const submitVerification = async (front: File, back: File | null, selfieFile: File) => {
    // Prevent double submission
    if (isSubmitting) {
      console.log('Submission already in progress, ignoring...');
      return;
    }

    setIsSubmitting(true);
    setStep('processing');
    setError('');

    try {
      const formData = new FormData();
      formData.append('documentFront', front);
      if (back) formData.append('documentBack', back);
      formData.append('selfie', selfieFile);

      const response = await fetch(`/api/public/verify/${token}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setVerificationId(data.verification.id);
        setStep('success');
        // Start polling for status
        pollVerificationStatus(data.verification.id);
      } else {
        setError(data.error || 'Произошла ошибка');
        setStep('error');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Ошибка отправки данных');
      setStep('error');
      setIsSubmitting(false);
    }
  };

  const pollVerificationStatus = async (id: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes max

    const poll = async () => {
      try {
        const response = await fetch(`/api/public/verify/${token}/status/${id}`);
        const data = await response.json();

        if (data.verification) {
          setVerificationStatus(data.verification.status);
          setVerificationResult(data.verification);

          if (data.verification.status !== 'PROCESSING' && data.verification.status !== 'PENDING') {
            // Verification completed
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000); // Poll every 2 seconds
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    poll();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back' | 'selfie') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'front') {
      setDocumentFront(file);
      // Skip back side for passport
      const selectedDoc = DOCUMENT_TYPES.find(d => d.id === selectedDocumentType);
      if (selectedDoc && !selectedDoc.hasBackSide) {
        setStep('selfie');
      } else {
        setStep('document-back');
      }
    } else if (type === 'back') {
      setDocumentBack(file);
      setStep('selfie');
    } else if (type === 'selfie') {
      setSelfie(file);
      submitVerification(documentFront!, documentBack, file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Welcome Step */}
        {step === 'welcome' && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center animate-fadeIn max-w-2xl w-full">
            <div className="w-20 h-20 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold mb-3 text-gray-900">Верификация личности</h1>
            <p className="text-gray-600 mb-8">
              Для продолжения нам необходимо проверить вашу личность. Это займет не более 2 минут.
            </p>

            <div className="space-y-4 mb-8 text-left">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-900 font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Сфотографируйте документ</p>
                  <p className="text-sm text-gray-600">Паспорт или ID карта (обе стороны)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-900 font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Сделайте селфи</p>
                  <p className="text-sm text-gray-600">Убедитесь что лицо хорошо видно</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-900 font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Дождитесь результата</p>
                  <p className="text-sm text-gray-600">Обработка займет несколько секунд</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep('country-selection')}
              className="w-full px-6 py-4 bg-gray-900 text-white text-lg font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Начать верификацию
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Ваши данные защищены и используются только для верификации</span>
            </div>
          </div>
        )}

        {/* Country Selection Step */}
        {step === 'country-selection' && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 animate-slideIn max-w-2xl w-full">
            <button
              onClick={() => setStep('welcome')}
              className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Назад</span>
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Выберите страну</h2>
              <p className="text-gray-600">Страна выдачи вашего документа</p>
            </div>

            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск страны..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 country-list">
              {COUNTRIES
                .filter(country =>
                  country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                  country.code.toLowerCase().includes(countrySearch.toLowerCase())
                )
                .map((country) => (
                  <button
                    key={country.code}
                    onClick={() => {
                      setSelectedCountry(country.code);
                      setTimeout(() => setStep('document-type-selection'), 300);
                    }}
                    className="w-full flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-300 group"
                  >
                    <span className="text-3xl">{country.flag}</span>
                    <span className="font-medium text-gray-900 transition-colors">{country.name}</span>
                    <svg className="w-5 h-5 text-gray-400 ml-auto transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Document Type Selection Step */}
        {step === 'document-type-selection' && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 animate-slideIn max-w-2xl w-full">
            <button
              onClick={() => setStep('country-selection')}
              className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Назад</span>
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Выберите тип документа</h2>
              <p className="text-gray-600">Какой документ вы будете использовать?</p>
            </div>

            <div className="space-y-3">
              {DOCUMENT_TYPES.map((docType) => (
                <button
                  key={docType.id}
                  onClick={() => {
                    setSelectedDocumentType(docType.id);
                    setTimeout(() => {
                      setStep('document-front');
                      setCameraActive(true);
                    }, 300);
                  }}
                  className="w-full flex items-start gap-4 p-6 rounded-lg bg-white hover:bg-gray-50 transition-all duration-300 border-2 border-gray-200 hover:border-gray-300 group shadow-sm"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {docType.id === 'PASSPORT' && (
                      <svg className="w-7 h-7 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    )}
                    {docType.id === 'ID_CARD' && (
                      <svg className="w-7 h-7 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                    )}
                    {docType.id === 'DRIVERS_LICENSE' && (
                      <svg className="w-7 h-7 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold text-gray-900 transition-colors mb-1">
                      {docType.name}
                    </h3>
                    <p className="text-sm text-gray-600">{docType.description}</p>
                  </div>
                  <svg className="w-6 h-6 text-gray-400 transition-colors flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Camera Steps */}
        {(step === 'document-front' || step === 'document-back' || step === 'selfie') && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 animate-fadeIn max-w-2xl w-full">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900">
                  {step === 'document-front' && 'Лицевая сторона документа'}
                  {step === 'document-back' && 'Обратная сторона документа'}
                  {step === 'selfie' && 'Ваше селфи'}
                </h2>
                <span className="text-sm text-gray-500">
                  {(() => {
                    const selectedDoc = DOCUMENT_TYPES.find(d => d.id === selectedDocumentType);
                    const hasBackSide = selectedDoc?.hasBackSide ?? true;
                    const totalSteps = hasBackSide ? 3 : 2;
                    if (step === 'document-front') return `1/${totalSteps}`;
                    if (step === 'document-back') return `2/${totalSteps}`;
                    if (step === 'selfie') return `${totalSteps}/${totalSteps}`;
                  })()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: (() => {
                      const selectedDoc = DOCUMENT_TYPES.find(d => d.id === selectedDocumentType);
                      const hasBackSide = selectedDoc?.hasBackSide ?? true;
                      if (step === 'document-front') return hasBackSide ? '33%' : '50%';
                      if (step === 'document-back') return '66%';
                      return '100%';
                    })()
                  }}
                />
              </div>
            </div>

            <div className="relative bg-black rounded-2xl overflow-hidden mb-4" style={{ aspectRatio: '3/4' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Overlay canvas for face detection */}
              {step === 'selfie' && scanStarted && (
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  style={{ mixBlendMode: 'screen' }}
                />
              )}

              {/* Overlay Guide (only for documents) */}
              {step !== 'selfie' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-4 border-white rounded-2xl opacity-60" style={{ width: '85%', height: '60%' }} />
                </div>
              )}

              {/* Countdown */}
              {countdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="text-white text-8xl font-bold animate-ping">{countdown}</div>
                </div>
              )}

              {/* Face scan progress */}
              {step === 'selfie' && scanStarted && scanProgress > 0 && (
                <div className="absolute top-4 left-4 right-4">
                  <div className="bg-black bg-opacity-60 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm font-medium">Сканирование...</span>
                      <span className="text-white text-sm font-bold">{Math.round(scanProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-200"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-60">
                <div className="flex items-center justify-center gap-2 text-white text-sm">
                  {(step === 'document-front' || step === 'document-back') && (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>
                        {step === 'document-front' && 'Разместите документ в рамке'}
                        {step === 'document-back' && 'Переверните документ'}
                      </span>
                    </>
                  )}
                  {step === 'selfie' && (
                    <>
                      {!scanStarted ? (
                        <>
                          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-blue-400">Нажмите кнопку для начала сканирования</span>
                        </>
                      ) : scanProgress < 100 ? (
                        <>
                          <svg className="w-5 h-5 text-green-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-green-400">Расположите лицо в центре круга</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-green-400 font-semibold">Сканирование завершено!</span>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="space-y-3">
              {step === 'selfie' ? (
                scanStarted && isScanning ? (
                  <div className="w-full px-6 py-4 bg-gray-100 text-gray-700 text-lg font-medium rounded-lg flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-3 border-gray-900 border-t-transparent rounded-full animate-spin" />
                    <span>Сканирование лица...</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setScanStarted(true);
                      startVisualScan();
                    }}
                    className="w-full px-6 py-4 bg-gray-900 text-white text-lg font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Начать сканирование лица
                  </button>
                )
              ) : (
                <button
                  onClick={captureWithCountdown}
                  disabled={countdown > 0}
                  className="w-full px-6 py-4 bg-gray-900 text-white text-lg font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  {countdown > 0 ? (
                    <>Съемка через {countdown}...</>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Сделать фото
                    </>
                  )}
                </button>
              )}

              <label className="btn bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 w-full py-4 text-lg cursor-pointer flex items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Загрузить из галереи
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, step === 'document-front' ? 'front' : step === 'document-back' ? 'back' : 'selfie')}
                />
              </label>

              {step === 'document-back' && (
                <button
                  onClick={() => {
                    setDocumentBack(null);
                    setStep('selfie');
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900 w-full py-2"
                >
                  Пропустить обратную сторону
                </button>
              )}
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center animate-fadeIn max-w-2xl w-full">
            <div className="w-20 h-20 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-3 text-gray-900">Обрабатываем данные</h2>
            <p className="text-gray-600">Проверяем документ и сравниваем с фотографией...</p>
          </div>
        )}

        {/* Success Step - Live Status */}
        {step === 'success' && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center animate-fadeIn max-w-2xl w-full">
            {verificationStatus === 'PROCESSING' || verificationStatus === 'PENDING' ? (
              <>
                {/* Processing Animation */}
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="absolute inset-0 border-8 border-gray-200 rounded-full"></div>
                  <div className="absolute inset-0 border-8 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-12 h-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>

                <h2 className="text-2xl font-bold mb-3 text-gray-900">Проверяем документы...</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-center gap-3 text-sm">
                    <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-900">Документы загружены</span>
                  </div>

                  <div className="flex items-center justify-center gap-3 text-sm">
                    <div className="w-6 h-6 border-2 border-gray-900 rounded-full flex items-center justify-center animate-pulse">
                      <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
                    </div>
                    <span className="text-gray-900">Распознавание текста...</span>
                  </div>

                  <div className="flex items-center justify-center gap-3 text-sm opacity-50">
                    <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                    <span className="text-gray-600">Сравнение лиц</span>
                  </div>

                  <div className="flex items-center justify-center gap-3 text-sm opacity-50">
                    <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                    <span className="text-gray-600">Проверка на мошенничество</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-xs text-gray-600 mb-1">ID верификации</p>
                  <p className="font-mono text-sm text-gray-900 font-semibold">{verificationId}</p>
                </div>

                <p className="text-sm text-gray-600">
                  Обычно проверка занимает 10-30 секунд
                </p>
              </>
            ) : verificationStatus === 'APPROVED' ? (
              <>
                <div className="w-24 h-24 bg-green-50 border-2 border-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold mb-3 text-gray-900">Верификация одобрена</h2>
                <p className="text-gray-600 mb-6">
                  Ваша личность успешно подтверждена. Все проверки пройдены.
                </p>

                {verificationResult && (
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-6">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Совпадение лиц:</span>
                        <span className="font-bold text-gray-900">{verificationResult.faceMatchScore?.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Уровень риска:</span>
                        <span className="font-bold text-gray-900">Низкий</span>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-600">
                  Вы можете закрыть эту страницу
                </p>
              </>
            ) : verificationStatus === 'MANUAL_REVIEW' ? (
              <>
                <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-3 text-yellow-700">Требуется проверка</h2>
                <p className="text-gray-600 mb-6">
                  Ваши документы отправлены на ручную проверку специалистом. Результат будет готов в течение 24 часов.
                </p>

                {verificationResult && (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl mb-6">
                    <p className="text-sm text-yellow-900">
                      <strong>Причина:</strong> Требуется дополнительная проверка документов
                    </p>
                  </div>
                )}

                <p className="text-sm text-gray-600">
                  Мы отправим уведомление на email когда проверка будет завершена
                </p>
              </>
            ) : (
              <>
                <div className="w-24 h-24 bg-red-50 border-2 border-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold mb-3 text-gray-900">Верификация отклонена</h2>
                <p className="text-gray-600 mb-6">
                  К сожалению, верификация не прошла проверку.
                </p>

                {verificationResult?.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
                    <p className="text-sm text-red-800">
                      <strong>Причина:</strong> {verificationResult.rejectionReason}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => {
                    setStep('welcome');
                    setDocumentFront(null);
                    setDocumentBack(null);
                    setSelfie(null);
                    setVerificationId('');
                    setIsSubmitting(false);
                  }}
                  className="w-full px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Попробовать снова
                </button>
              </>
            )}
          </div>
        )}

        {/* Error Step */}
        {step === 'error' && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center animate-fadeIn max-w-2xl w-full">
            <div className="w-20 h-20 bg-red-50 border-2 border-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-3 text-gray-900">Произошла ошибка</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => {
                setStep('welcome');
                setError('');
                setDocumentFront(null);
                setDocumentBack(null);
                setSelfie(null);
                setIsSubmitting(false);
              }}
              className="w-full px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animate-slideIn {
          animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .country-list {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }

        .country-list::-webkit-scrollbar {
          width: 6px;
        }

        .country-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .country-list::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .country-list::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        @keyframes bounce-once {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-bounce-once {
          animation: bounce-once 0.6s ease-in-out;
        }
      `}</style>
    </div>
  );
}
