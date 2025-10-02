'use client';

import Link from "next/link";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      <FloatingParticles />
      <nav className="bg-white/90 border-b border-gray-200 fixed top-0 left-0 right-0 z-50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">veriffy.me</h1>
              <p className="text-xs text-gray-600">Верификация нового поколения</p>
            </div>
          </div>
          <div>
            <Link href="/login" className="relative px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:shadow-xl transition-all hover:scale-105 group overflow-hidden">
              <span className="relative z-10">Войти</span>
              <div className="absolute inset-0 bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-24 px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div className="text-center md:text-left">
              <div className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-50 rounded-full border border-gray-200 shadow-sm animate-fade-in">
                <span className="text-gray-700 font-medium text-sm">🚀 Собственная технология распознавания</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900 animate-slide-up">
                Верификация личности<br />
                <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  нового поколения
                </span>
              </h2>
              <p className="text-xl text-gray-600 mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Автоматизированная проверка документов на базе собственных алгоритмов.<br />
                Быстро, безопасно и в соответствии с международными стандартами.
              </p>
              <div className="flex gap-4 justify-center md:justify-start flex-wrap animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <Link href="/register" className="relative px-8 py-4 bg-gradient-to-r from-gray-900 to-gray-700 text-white text-lg font-medium rounded-lg hover:shadow-2xl transition-all hover:scale-105 group overflow-hidden">
                  <span className="relative z-10">Начать бесплатно</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Link>
                <Link href="/login" className="relative px-8 py-4 bg-white text-gray-900 border-2 border-gray-300 text-lg font-medium rounded-lg hover:bg-gray-50 transition-all hover:shadow-lg hover:scale-105 hover:border-gray-900 group overflow-hidden">
                  <span className="relative z-10">Войти</span>
                </Link>
              </div>
              <div className="mt-8 flex items-center justify-center md:justify-start gap-6 text-sm text-gray-500 flex-wrap">
                <span className="flex items-center gap-1">
                  ✓ Без кредитной карты
                </span>
                <span className="flex items-center gap-1">
                  ✓ Настройка за 5 минут
                </span>
                <span className="flex items-center gap-1">
                  ✓ Поддержка 24/7
                </span>
              </div>
            </div>

            {/* Interactive Demo Animation */}
            <div className="flex justify-center">
              <VerificationDemo />
            </div>
          </div>

          {/* Live Statistics Section */}
          <LiveStatistics />

          {/* Stats Section */}
          <div
            id="stats-section"
            data-animate
            className={`mt-20 mb-20 grid md:grid-cols-4 gap-6 transition-all duration-1000 ${
              visibleSections.has('stats-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <StatCard
              number="99.9"
              suffix="%"
              label="Точность"
              delay={0}
              isVisible={visibleSections.has('stats-section')}
            />
            <StatCard
              number="5"
              suffix=" сек"
              label="Средняя скорость"
              delay={100}
              isVisible={visibleSections.has('stats-section')}
            />
            <StatCard
              number="180"
              suffix="+"
              label="Стран"
              delay={200}
              isVisible={visibleSections.has('stats-section')}
            />
            <StatCard
              number="24"
              suffix="/7"
              label="Поддержка"
              delay={300}
              isVisible={visibleSections.has('stats-section')}
            />
          </div>

          {/* How it works - Step by Step */}
          <div
            id="how-it-works"
            data-animate
            className={`mt-32 mb-32 transition-all duration-1000 ${
              visibleSections.has('how-it-works') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="text-center mb-16">
              <h3 className="text-4xl font-bold mb-4 text-gray-900">Как это работает</h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Простой процесс верификации всего за 4 шага
              </p>
            </div>

            <div className="relative">
              {/* Connection Line */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 -translate-y-1/2 z-0">
                <div
                  className={`h-full bg-gradient-to-r from-gray-900 to-gray-600 transition-all duration-2000 ${
                    visibleSections.has('how-it-works') ? 'w-full' : 'w-0'
                  }`}
                />
              </div>

              <div className="grid md:grid-cols-4 gap-8 relative z-10">
                <StepCard
                  number={1}
                  title="Загрузка документа"
                  description="Пользователь делает фото документа через камеру или загружает файл"
                  icon={
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  delay={0}
                  isVisible={visibleSections.has('how-it-works')}
                />
                <StepCard
                  number={2}
                  title="Сканирование лица"
                  description="Биометрическое сканирование с проверкой живости для защиты от подделок"
                  icon={
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  }
                  delay={200}
                  isVisible={visibleSections.has('how-it-works')}
                />
                <StepCard
                  number={3}
                  title="Анализ данных"
                  description="Автоматическое извлечение и проверка данных с использованием OCR и AI"
                  icon={
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  }
                  delay={400}
                  isVisible={visibleSections.has('how-it-works')}
                />
                <StepCard
                  number={4}
                  title="Результат"
                  description="Мгновенное получение результата с детальным отчетом о верификации"
                  icon={
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  delay={600}
                  isVisible={visibleSections.has('how-it-works')}
                />
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div
            id="features"
            data-animate
            className={`grid md:grid-cols-3 gap-6 mt-20 transition-all duration-1000 ${
              visibleSections.has('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <FeatureCard
              icon={
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              title="Распознавание документов"
              description="Автоматическое извлечение данных из паспортов и ID с поддержкой MRZ. Наши алгоритмы обеспечивают точность более 99%."
              delay={0}
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              }
              title="Биометрическое сравнение"
              description="Распознавание лиц и проверка живости с помощью собственных биометрических алгоритмов для защиты от подделок."
              delay={100}
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
              title="Детекция мошенничества"
              description="Многоуровневая система оценки рисков на основе собственных алгоритмов с настраиваемыми правилами безопасности."
              delay={200}
            />
          </div>

          {/* Why Choose Us */}
          <div
            id="why-choose"
            data-animate
            className={`mt-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl p-12 shadow-2xl transition-all duration-1000 ${
              visibleSections.has('why-choose') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="text-center mb-12">
              <h3 className="text-3xl font-semibold mb-4">Почему выбирают veriffy.me</h3>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Наша собственная технология обеспечивает непревзойденную точность и скорость верификации
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <BenefitCard
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
                title="Молниеносная скорость"
                description="Проверка документов занимает 5-10 секунд благодаря оптимизированным алгоритмам обработки"
              />
              <BenefitCard
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                title="Высокая точность"
                description="Более 99% точности распознавания документов и биометрического сравнения лиц"
              />
              <BenefitCard
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
                title="Максимальная безопасность"
                description="Шифрование данных, защита от спуфинга и многоуровневая проверка подлинности"
              />
              <BenefitCard
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                }
                title="Поддержка всех документов"
                description="Паспорта, ID карты, водительские удостоверения из более чем 180 стран"
              />
            </div>
          </div>

          {/* Integration Section */}
          <div
            id="integration"
            data-animate
            className={`mt-24 transition-all duration-1000 ${
              visibleSections.has('integration') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-12 shadow-lg hover:shadow-2xl transition-all">
              <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                <div>
                  <h3 className="text-3xl font-bold mb-4 text-gray-900">Простая интеграция</h3>
                  <p className="text-lg text-gray-600 mb-6">
                    Подключите верификацию к вашему сервису за несколько минут с помощью нашего API
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 group">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-700 group-hover:text-gray-900 transition-colors">RESTful API с подробной документацией</span>
                    </li>
                    <li className="flex items-center gap-3 group">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-700 group-hover:text-gray-900 transition-colors">Webhook для real-time уведомлений</span>
                    </li>
                    <li className="flex items-center gap-3 group">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-700 group-hover:text-gray-900 transition-colors">SDK для популярных языков</span>
                    </li>
                    <li className="flex items-center gap-3 group">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-700 group-hover:text-gray-900 transition-colors">Готовые виджеты для веб и мобильных приложений</span>
                    </li>
                  </ul>
                </div>
                <CodeBlock />
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div
            id="cta"
            data-animate
            className={`mt-24 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-12 text-center shadow-lg hover:shadow-2xl transition-all duration-1000 relative overflow-hidden ${
              visibleSections.has('cta') ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 animate-shimmer"></div>
            </div>

            <div className="relative z-10">
              <h3 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Готовы начать?</h3>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">Создайте аккаунт и начните верифицировать пользователей за считанные секунды</p>

              <div className="inline-block relative">
                {/* Pulse ring animation */}
                <div className="absolute inset-0 bg-gray-900 rounded-lg animate-ping opacity-20"></div>

                <Link href="/register" className="relative inline-block px-12 py-4 bg-gradient-to-r from-gray-900 to-gray-700 text-white text-lg font-medium rounded-lg hover:shadow-2xl transition-all hover:scale-105 group overflow-hidden">
                  <span className="relative z-10 flex items-center gap-2">
                    Создать аккаунт бесплатно
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Link>
              </div>

              <div className="mt-6 flex items-center justify-center gap-8 text-sm text-gray-600 flex-wrap">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Без кредитной карты
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Настройка за 5 минут
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-8 px-6 mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold">V</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">veriffy.me</p>
                <p className="text-xs text-gray-600">Верификация нового поколения</p>
              </div>
            </div>
            <div className="text-gray-600 text-sm">
              <p>© 2025 veriffy.me • Собственная технология верификации</p>
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(0, 0, 0, 0.2);
          }
        }

        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }

        @keyframes bounce-once {
          0%, 100% {
            transform: scale(1);
          }
          25% {
            transform: scale(1.1);
          }
          50% {
            transform: scale(0.95);
          }
          75% {
            transform: scale(1.05);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0.3;
          }
          25% {
            transform: translateY(-20px) translateX(10px) rotate(5deg);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-40px) translateX(-10px) rotate(-5deg);
            opacity: 0.4;
          }
          75% {
            transform: translateY(-20px) translateX(5px) rotate(3deg);
            opacity: 0.5;
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }

        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }

        .animate-bounce-once {
          animation: bounce-once 0.6s ease-out;
        }

        .animate-float {
          animation: float linear infinite;
        }

        .animate-shimmer {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          background-size: 1000px 100%;
          animation: shimmer 3s infinite;
        }

        .duration-2000 {
          transition-duration: 2000ms;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        ::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}

function StatCard({ number, suffix, label, delay, isVisible }: {
  number: string;
  suffix: string;
  label: string;
  delay: number;
  isVisible: boolean;
}) {
  const [count, setCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const targetNumber = parseFloat(number);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const steps = 60;
    const increment = targetNumber / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= targetNumber) {
        setCount(targetNumber);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible, targetNumber]);

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-2xl transition-all hover:scale-105 hover:border-gray-900 group cursor-pointer relative overflow-hidden"
      style={{ transitionDelay: `${delay}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Shimmer effect on hover */}
      {isHovered && (
        <div className="absolute inset-0 animate-shimmer"></div>
      )}

      <div className="relative z-10">
        <div className="text-4xl font-bold text-gray-900 mb-2 group-hover:scale-110 transition-transform">
          {isVisible ? count.toFixed(number.includes('.') ? 1 : 0) : '0'}{suffix}
        </div>
        <div className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{label}</div>
      </div>
    </div>
  );
}

function StepCard({ number, title, description, icon, delay, isVisible }: {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  delay: number;
  isVisible: boolean;
}) {
  return (
    <div
      className={`relative transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-2xl transition-all hover:scale-105 hover:border-gray-900 group">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-gray-700 rounded-full flex items-center justify-center text-white shadow-lg group-hover:shadow-2xl transition-all">
              {icon}
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-white border-2 border-gray-900 rounded-full flex items-center justify-center text-sm font-bold text-gray-900 shadow-md">
              {number}
            </div>
          </div>
        </div>
        <h4 className="text-lg font-semibold mb-2 text-gray-900 text-center">{title}</h4>
        <p className="text-sm text-gray-600 text-center leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-2xl transition-all hover:scale-105 hover:border-gray-900 group cursor-pointer relative overflow-hidden"
      style={{ transitionDelay: `${delay}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background gradient on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

      <div className="relative z-10">
        <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:scale-110 transition-all">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-3 text-gray-900 group-hover:text-gray-900">{title}</h3>
        <p className="text-gray-600 leading-relaxed text-sm group-hover:text-gray-700 transition-colors">
          {description}
        </p>
      </div>

      {/* Animated corner accent */}
      {isHovered && (
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-gray-900/5 to-transparent rounded-bl-full animate-fade-in"></div>
      )}
    </div>
  );
}

function BenefitCard({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 group hover:bg-white hover:bg-opacity-5 p-4 rounded-lg transition-all">
      <div className="w-10 h-10 bg-white bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 group-hover:bg-opacity-20 transition-all">
        {icon}
      </div>
      <div>
        <h4 className="text-lg font-semibold mb-2">{title}</h4>
        <p className="text-gray-300 text-sm">
          {description}
        </p>
      </div>
    </div>
  );
}

// Interactive Verification Demo Component
function VerificationDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ['document', 'face', 'processing', 'success'];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-sm">
      {/* Phone Frame */}
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-700 rounded-3xl p-3 shadow-2xl">
        <div className="bg-white rounded-2xl overflow-hidden" style={{ aspectRatio: '9/16' }}>
          {/* Screen Content */}
          <div className="relative h-full bg-gradient-to-br from-gray-50 to-white p-6 flex flex-col items-center justify-center">

            {/* Step 1: Document Upload */}
            {currentStep === 0 && (
              <div className="text-center animate-fade-in">
                <div className="mb-6 relative">
                  <div className="w-48 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border-2 border-dashed border-gray-400 flex items-center justify-center animate-pulse">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700">Загрузите документ</p>
                <p className="text-xs text-gray-500 mt-1">Паспорт или ID карта</p>
              </div>
            )}

            {/* Step 2: Face Scan */}
            {currentStep === 1 && (
              <div className="text-center animate-fade-in">
                <div className="mb-6 relative">
                  <div className="w-48 h-48 rounded-full bg-gradient-to-br from-green-100 to-green-200 border-4 border-green-500 flex items-center justify-center relative overflow-hidden">
                    <svg className="w-20 h-20 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {/* Scanning Animation */}
                    <div className="absolute inset-0 border-t-4 border-green-500 animate-scan"></div>
                  </div>
                  {/* Corner Brackets */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 -translate-x-2 -translate-y-2"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 translate-x-2 -translate-y-2"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 -translate-x-2 translate-y-2"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 translate-x-2 translate-y-2"></div>
                </div>
                <p className="text-sm font-medium text-gray-700">Сканирование лица</p>
                <p className="text-xs text-gray-500 mt-1">Проверка живости...</p>
              </div>
            )}

            {/* Step 3: Processing */}
            {currentStep === 2 && (
              <div className="text-center animate-fade-in">
                <div className="mb-6">
                  <div className="w-24 h-24 relative mx-auto">
                    <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-gray-900 rounded-full animate-spin"></div>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700">Обработка данных</p>
                <p className="text-xs text-gray-500 mt-1">Анализ документа и биометрии...</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-2 h-2 bg-gray-700 rounded-full animate-pulse"></div>
                    <span>OCR распознавание</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-2 h-2 bg-gray-800 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <span>Сравнение лиц</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    <span>Проверка на мошенничество</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Success */}
            {currentStep === 3 && (
              <div className="text-center animate-fade-in">
                <div className="mb-6">
                  <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce-once">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <p className="text-lg font-bold text-green-600">Верификация пройдена!</p>
                <p className="text-xs text-gray-500 mt-1">Пользователь подтвержден</p>
                <div className="mt-4 bg-gray-50 rounded-lg p-3 text-left">
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Совпадение лиц:</span>
                      <span className="font-semibold text-gray-700">98.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Риск мошенничества:</span>
                      <span className="font-semibold text-green-600">Низкий</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Время обработки:</span>
                      <span className="font-semibold text-gray-700">4.2 сек</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step Indicator */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentStep ? 'w-8 bg-gray-900' : 'w-1.5 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Phone Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-b-2xl"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute -top-4 -right-4 w-16 h-16 bg-green-500 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gray-900 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
    </div>
  );
}

// Live Statistics Component
function LiveStatistics() {
  const [verifications, setVerifications] = useState(1247893);
  const [activeUsers, setActiveUsers] = useState(342);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setVerifications(prev => prev + Math.floor(Math.random() * 3));
      setActiveUsers(prev => 300 + Math.floor(Math.random() * 100));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-24 mb-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-12 shadow-2xl overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white bg-opacity-10 rounded-full mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-white text-sm font-medium">Live статистика</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-2">Работаем по всему миру</h3>
          <p className="text-gray-300">Верификация происходит прямо сейчас</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* World Map with Activity */}
          <div className="relative">
            <WorldMap />
          </div>

          {/* Live Stats */}
          <div className="space-y-6">
            <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">Всего верификаций</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div className="text-4xl font-bold text-white mb-1" suppressHydrationWarning>
                {verifications.toLocaleString('en-US')}
              </div>
              <div className="flex items-center gap-2 text-sm text-green-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>+2.4% за сегодня</span>
              </div>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">Активных пользователей</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div className="text-4xl font-bold text-white mb-1" suppressHydrationWarning>
                {activeUsers.toLocaleString('en-US')}
              </div>
              <div className="text-sm text-gray-400">
                Онлайн прямо сейчас
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-4">
                <div className="text-2xl font-bold text-white mb-1">99.8%</div>
                <div className="text-xs text-gray-400">Uptime</div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-4">
                <div className="text-2xl font-bold text-white mb-1">4.7s</div>
                <div className="text-xs text-gray-400">Ср. время</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Code Block Component with typing animation
function CodeBlock() {
  const [typedText, setTypedText] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  const codeText = `const response = await fetch(
  'https://api.veriffy.me/verify',
  {
    method: 'POST',
    headers: {
      'X-API-Key': 'your_api_key'
    },
    body: formData
  }
);

const result = await response.json();
// { status: 'APPROVED', ... }`;

  useEffect(() => {
    if (!isHovered) {
      setTypedText(codeText);
      return;
    }

    setTypedText('');
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= codeText.length) {
        setTypedText(codeText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <div
      className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 shadow-2xl hover:shadow-3xl transition-all overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}></div>
      </div>

      {/* Terminal header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full hover:scale-125 transition-transform cursor-pointer"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full hover:scale-125 transition-transform cursor-pointer"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full hover:scale-125 transition-transform cursor-pointer"></div>
        </div>
        <div className="text-xs text-gray-500 font-mono">api-example.js</div>
      </div>

      {/* Code content */}
      <div className="relative z-10">
        <pre className="text-green-400 text-xs md:text-sm font-mono overflow-x-auto max-w-full whitespace-pre-wrap break-words">
          {typedText}
          {isHovered && typedText.length < codeText.length && (
            <span className="inline-block w-2 h-4 bg-green-400 ml-1 animate-pulse"></span>
          )}
        </pre>
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-green-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </div>
  );
}

// Floating Particles Component
function FloatingParticles() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-gray-900/10 rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${15 + Math.random() * 10}s`
          }}
        />
      ))}
    </div>
  );
}

// Simple World Map Component
function WorldMap() {
  const [activePoints, setActivePoints] = useState([0, 1, 2]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePoints(prev => {
        const next = [...prev];
        const randomIdx = Math.floor(Math.random() * 8);
        if (!next.includes(randomIdx)) {
          next.push(randomIdx);
          if (next.length > 5) next.shift();
        }
        return next;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const points = [
    { x: '15%', y: '35%', city: 'London' },
    { x: '20%', y: '45%', city: 'Paris' },
    { x: '30%', y: '30%', city: 'Moscow' },
    { x: '70%', y: '50%', city: 'Singapore' },
    { x: '75%', y: '35%', city: 'Tokyo' },
    { x: '25%', y: '60%', city: 'Dubai' },
    { x: '18%', y: '50%', city: 'Berlin' },
    { x: '85%', y: '65%', city: 'Sydney' },
  ];

  return (
    <div className="relative w-full h-80 bg-white bg-opacity-5 rounded-xl p-6">
      {/* Simplified World Map SVG */}
      <svg viewBox="0 0 800 400" className="w-full h-full opacity-30">
        {/* Continents simplified shapes */}
        <path d="M100,150 Q150,100 250,120 T350,140 L380,180 L350,220 Q300,200 250,210 T150,200 Z" fill="white" opacity="0.3"/>
        <path d="M400,200 Q450,180 500,190 T600,210 L620,250 Q580,240 520,250 T450,240 Z" fill="white" opacity="0.3"/>
        <path d="M150,250 Q200,240 250,250 L270,300 Q220,290 180,280 Z" fill="white" opacity="0.3"/>
      </svg>

      {/* Activity Points */}
      {points.map((point, idx) => (
        <div
          key={idx}
          className="absolute"
          style={{ left: point.x, top: point.y }}
        >
          <div className={`relative transition-all duration-500 ${activePoints.includes(idx) ? 'scale-100' : 'scale-0'}`}>
            {/* Ripple Effect */}
            <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full animate-ping opacity-75"></div>
            {/* Point */}
            <div className="relative w-4 h-4 bg-green-500 rounded-full shadow-lg"></div>
            {/* Label */}
            {activePoints.includes(idx) && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-gray-900 text-xs px-2 py-1 rounded shadow-lg animate-fade-in">
                {point.city}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Connection Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {activePoints.map((idx, i) => {
          if (i === 0) return null;
          const from = points[activePoints[i - 1]];
          const to = points[idx];
          return (
            <line
              key={`${i}-${idx}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="rgba(34, 197, 94, 0.3)"
              strokeWidth="2"
              className="animate-fade-in"
            />
          );
        })}
      </svg>
    </div>
  );
}
