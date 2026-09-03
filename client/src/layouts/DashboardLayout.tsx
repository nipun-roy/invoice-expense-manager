import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Users,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  User as UserIcon,
  BarChart3,
  Globe,
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  interface NavItem {
    label: string;
    to: string;
    icon: any;
    disabled: boolean;
    badge?: string;
  }

  const navItems: NavItem[] = [
    {
      label: t('dashboard'),
      to: '/dashboard',
      icon: LayoutDashboard,
      disabled: false,
    },
    {
      label: t('invoices'),
      to: '/invoices',
      icon: FileText,
      disabled: false,
    },
    {
      label: t('customers'),
      to: '/customers',
      icon: Users,
      disabled: false,
    },
    {
      label: t('products'),
      to: '/products',
      icon: Package,
      disabled: false,
    },
    {
      label: t('expenses'),
      to: '/expenses',
      icon: Receipt,
      disabled: false,
    },
    {
      label: t('reports'),
      to: '/reports',
      icon: BarChart3,
      disabled: false,
    },
    {
      label: t('settings'),
      to: '/settings',
      icon: Settings,
      disabled: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center font-bold text-white shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-sm tracking-wide text-white block">
                {language === 'bn' ? 'ইনভয়েস ম্যানেজার' : 'Invoice Manager'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                {language === 'bn' ? 'বিজনেস প্ল্যাটফর্ম' : 'MERN SaaS'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            if (item.disabled) {
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-slate-500 cursor-not-allowed select-none"
                  title="Will be enabled in subsequent phase"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-600" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-sky-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar User / Profile Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-semibold">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 rounded-md transition-colors border border-rose-800/40"
          >
            <LogOut className="w-3.5 h-3.5" />
            {loggingOut ? t('loggingOut') : t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">
                {user?.businessProfile?.businessName || 'My Business'}
              </h2>
              <p className="text-[11px] text-gray-400 hidden sm:block">
                {language === 'bn' ? 'মুদ্রা:' : 'Currency:'} {user?.businessProfile?.defaultCurrency || 'BDT'} &bull; {language === 'bn' ? 'প্রিফিক্স:' : 'Prefix:'} {user?.businessProfile?.invoicePrefix || 'INV-'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher Pill */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors shadow-sm bg-white"
              title={language === 'bn' ? 'Switch to English' : 'বাংলা ভাষায় পরিবর্তন করুন'}
            >
              <Globe className="w-3.5 h-3.5 text-sky-600" />
              <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>

            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-gray-800">{user?.name}</p>
              <p className="text-[11px] text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title={t('logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

