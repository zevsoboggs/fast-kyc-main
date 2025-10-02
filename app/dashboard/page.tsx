'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalVerifications = projects.reduce((sum, p) => sum + (p._count?.verifications || 0), 0);
  const activeProjects = projects.filter(p => p.isActive).length;
  const approvedVerifications = projects.reduce((sum, p) => {
    const approvedCount = p.verifications?.filter((v: any) => v.status === 'APPROVED').length || 0;
    return sum + approvedCount;
  }, 0);
  const recentProjects = projects.slice(0, 3);

  return (
    <DashboardLayout currentPage="projects">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Главная</h1>
        <p className="text-sm md:text-base text-gray-600">Управление проектами и статистика верификации</p>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Total Projects */}
        <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{projects.length}</p>
          <p className="text-sm text-gray-600 font-medium">Всего проектов</p>
        </div>

        {/* Total Verifications */}
        <div className="bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{totalVerifications}</p>
          <p className="text-sm text-gray-600 font-medium">Верификаций</p>
        </div>

        {/* Active Projects */}
        <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{activeProjects}</p>
          <p className="text-sm text-gray-600 font-medium">Активных</p>
        </div>

        {/* Success Rate */}
        <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-100 rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
            {totalVerifications > 0 ? Math.round((approvedVerifications / totalVerifications) * 100) : 0}%
          </p>
          <p className="text-sm text-gray-600 font-medium">Успешных</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 md:mb-8">
        <Link href="/dashboard/projects/new" className="group bg-white border-2 border-dashed border-gray-300 hover:border-gray-900 rounded-xl p-6 transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 group-hover:bg-gray-900 rounded-xl flex items-center justify-center transition-colors">
              <svg className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Новый проект</h3>
              <p className="text-sm text-gray-600">Создать KYC проект</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/integration" className="group bg-white border border-gray-200 hover:border-gray-900 rounded-xl p-6 transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 group-hover:bg-gray-900 rounded-xl flex items-center justify-center transition-colors">
              <svg className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Интеграция</h3>
              <p className="text-sm text-gray-600">Код для встраивания</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/documentation" className="group bg-white border border-gray-200 hover:border-gray-900 rounded-xl p-6 transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 group-hover:bg-gray-900 rounded-xl flex items-center justify-center transition-colors">
              <svg className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Документация</h3>
              <p className="text-sm text-gray-600">API справочник</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Projects List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 md:p-6 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900">Проекты</h2>
            <p className="text-sm text-gray-600 mt-1">{projects.length} {projects.length === 1 ? 'проект' : projects.length < 5 ? 'проекта' : 'проектов'}</p>
          </div>
          <Link href="/dashboard/projects/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors shadow-sm text-center whitespace-nowrap">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Создать проект
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-14 h-14 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm font-medium text-gray-600">Загрузка проектов...</p>
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Нет проектов</h3>
            <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">Создайте свой первый проект для начала верификации пользователей</p>
            <Link href="/dashboard/projects/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Создать первый проект
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="block p-5 md:p-6 hover:bg-gray-50 transition-all group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3 md:gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <svg className="w-6 h-6 md:w-7 md:h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base md:text-lg text-gray-900 mb-1 truncate group-hover:text-gray-700 transition-colors">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-1">{project.description}</p>
                      )}
                      <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-500 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">{project._count?.verifications || 0}</span>
                          <span>верификаций</span>
                        </div>
                        <span className="hidden sm:inline text-gray-300">•</span>
                        <div className="hidden sm:flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{new Date(project.createdAt).toLocaleDateString('ru-RU')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${project.isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                      {project.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
