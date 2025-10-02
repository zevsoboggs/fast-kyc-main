'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function BillingPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  return (
    <DashboardLayout currentPage="billing">
      <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Биллинг и тарифы</h1>
            <p className="text-sm text-gray-600">Управление подпиской и платежами</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Система биллинга скоро будет доступна</h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
              Мы работаем над добавлением различных тарифных планов, статистики использования API и интеграции с платёжными системами.
            </p>
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Вернуться к проектам
          </Link>
        </div>
    </DashboardLayout>
  );
}
