import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { businessProfileService } from '../services/businessProfile.service';
import {
  Building2,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Globe,
  Mail,
  Phone,
  MapPin,
  FileSpreadsheet,
  Coins,
  ShieldAlert,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const profile = user?.businessProfile;

  // Form state initialized from current user profile
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    taxVatNumber: '',
    invoicePrefix: 'INV-',
    defaultCurrency: 'BDT',
    logoUrl: '',
  });

  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        businessName: profile.businessName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        website: profile.website || '',
        taxVatNumber: profile.taxVatNumber || '',
        invoicePrefix: profile.invoicePrefix || 'INV-',
        defaultCurrency: profile.defaultCurrency || 'BDT',
        logoUrl: profile.logoUrl || '',
      });
    }
  }, [profile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setValidationError(null);
    setInfoMessage(null);
    try {
      await refreshProfile();
      setInfoMessage('Business profile data refreshed from server.');
    } catch {
      setValidationError('Failed to reload profile data.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setInfoMessage(null);

    // Client-side Validation
    if (!formData.businessName.trim()) {
      setValidationError('Business Name is required.');
      return;
    }

    if (!formData.invoicePrefix.trim()) {
      setValidationError('Invoice Prefix is required (e.g., INV-).');
      return;
    }

    setSaving(true);
    try {
      await businessProfileService.updateProfile(formData);
      await refreshProfile();
      setInfoMessage('Business profile updated successfully!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update business profile.';
      setValidationError(msg);
    } finally {
      setSaving(false);
    }
  };

  const { language, t } = useLanguage();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {t('settingsTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {t('settingsSubtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing || saving}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium transition-colors shadow-sm disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? (language === 'bn' ? 'রিফ্রেশ হচ্ছে...' : 'Refreshing...') : t('refreshFromServer')}
        </button>
      </div>

      {/* Alert Notifications */}
      {validationError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1 font-medium">{validationError}</div>
        </div>
      )}

      {infoMessage && (
        <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-sky-600 mt-0.5" />
          <div className="flex-1 font-medium">{infoMessage}</div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Business Information Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {t('generalBusinessInfo')}
              </h3>
              <p className="text-xs text-gray-500">
                {t('generalBusinessInfoDesc')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                {t('businessNameField')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="Acme Corp"
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                {t('businessEmailField')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="billing@acme.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                {t('phoneField')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                {t('websiteField')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Globe className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                {t('addressField')}
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3.5 pointer-events-none text-gray-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Market St, Suite 400, San Francisco, CA"
                  className="w-full pl-10 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Financial & Invoicing Defaults Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {t('financialConfig')}
              </h3>
              <p className="text-xs text-gray-500">
                {t('financialConfigDesc')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                {t('defaultCurrencyField')} <span className="text-rose-500">*</span>
              </label>
              <select
                name="defaultCurrency"
                value={formData.defaultCurrency}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              >
                <option value="BDT">BDT - Bangladeshi Taka (Tk / ৳)</option>
                <option value="USD">USD - US Dollar ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="GBP">GBP - British Pound (£)</option>
                <option value="CAD">CAD - Canadian Dollar ($)</option>
                <option value="AUD">AUD - Australian Dollar ($)</option>
                <option value="INR">INR - Indian Rupee (₹)</option>
                <option value="JPY">JPY - Japanese Yen (¥)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                {t('invoicePrefixField')} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="invoicePrefix"
                  value={formData.invoicePrefix}
                  onChange={handleChange}
                  placeholder="INV-"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                {t('taxVatField')}
              </label>
              <input
                type="text"
                name="taxVatNumber"
                value={formData.taxVatNumber}
                onChange={handleChange}
                placeholder="TRAD/DNCC/123456"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* User Account Details Read-Only Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {language === 'bn' ? 'অ্যাকাউন্ট মালিকানা' : 'Account Ownership'}
              </h3>
              <p className="text-xs text-gray-500">
                {language === 'bn' ? 'এই ব্যবসায়িক প্রোফাইলের সাথে যুক্ত মূল তথ্য' : 'Master credentials tied to this business profile'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="text-gray-400 block mb-1">{language === 'bn' ? 'মালিকের নাম' : 'Owner Name'}</span>
              <span className="font-semibold text-gray-800">{user?.name}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="text-gray-400 block mb-1">{language === 'bn' ? 'ইউজার ইমেইল' : 'User Email'}</span>
              <span className="font-semibold text-gray-800">{user?.email}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="text-gray-400 block mb-1">{language === 'bn' ? 'নিবন্ধনের তারিখ' : 'Registered Since'}</span>
              <span className="font-semibold text-gray-800 font-mono">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-sky-600/20 transition-colors disabled:opacity-60"
          >
            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            {saving ? t('savingChanges') : t('saveChangesBtn')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;

