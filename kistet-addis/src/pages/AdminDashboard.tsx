import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  CheckCircle, 
  PieChart, 
  LogOut, 
  QrCode,
  Settings,
  X,
  User as UserIcon,
  Loader2,
  Plus,
  Trash2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { User, Event } from '../types';
import { toast } from 'sonner';
import EventCard from '../components/EventCard';

const AdminDashboard: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { user: currentUser, refreshProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'events' | 'organizers' | 'settings' | 'profile'>('overview');
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [eventsData, setEventsData] = useState<Event[] | null>(null);
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    totalRevenue: 0,
    totalBuyers: 0,
    activeEvents: 0,
    pendingPayments: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);

  const [isCreatingOrganizer, setIsCreatingOrganizer] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgEmail, setNewOrgEmail] = useState('');
  const [newOrgPassword, setNewOrgPassword] = useState('');

  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profilePassword, setProfilePassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setProfileEmail(currentUser.email || '');
      setProfileName(currentUser.name || '');
    }
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const [m, p] = await Promise.all([
          api.getMetrics(),
          api.getPendingPayments()
        ]);
        setMetrics(m);
        setPendingPayments(p);
      } else if (activeTab === 'payments') {
        const p = await api.getPendingPayments();
        setPendingPayments(p);
      } else if (activeTab === 'events') {
        const e = await api.getEvents();
        setEventsData(e);
      } else if (activeTab === 'organizers') {
        const o = await api.getOrganizers();
        const e = await api.getEvents();
        setOrganizers(o);
        setEventsData(e);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleCreateOrganizer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingOrganizer(true);
    try {
      await api.createOrganizer({ name: newOrgName, email: newOrgEmail, password: newOrgPassword });
      toast.success('Organizer created!');
      setNewOrgName(''); setNewOrgEmail(''); setNewOrgPassword('');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create organizer');
    } finally {
      setIsCreatingOrganizer(false);
    }
  };

  const handleVerify = async (paymentId: string) => {
    setIsVerifying(paymentId);
    try {
      await api.verifyPayment(paymentId, 'verified');
      toast.success(t('paymentApprovedToast'));
      fetchData();
    } catch (error) {
      toast.error(t('approveFailedToast'));
    } finally {
      setIsVerifying(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    const reason = window.prompt('Reason:');
    if (reason === null) return;
    setIsVerifying(paymentId);
    try {
      await api.verifyPayment(paymentId, 'rejected', reason);
      toast.success(t('paymentRejectToast'));
      fetchData();
    } catch (error) {
      toast.error(t('rejectFailedToast'));
    } finally {
      setIsVerifying(null);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsUpdatingProfile(true);
    try {
      await api.updateProfile({ name: profileName, email: profileEmail, password: profilePassword });
      await refreshProfile();
      setProfilePassword('');
      toast.success(t('profileUpdateSuccess'));
    } catch (error: any) {
      toast.error(error.message || t('profileUpdateFailed'));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col fixed h-full shadow-sm z-10">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-xl">K</span>
            </div>
            <span className="text-xl font-black text-gray-800 tracking-tight italic">Kistet Addis</span>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: 'overview', icon: LayoutDashboard, label: t('dashboard'), type: 'tab' },
            { id: 'payments', icon: CheckCircle, label: t('pendingApprovals'), type: 'tab' },
            { id: 'events', icon: Calendar, label: t('events'), type: 'tab' },
            { id: 'organizers', icon: Users, label: t('organizers'), type: 'tab' },
            { id: 'profile', icon: UserIcon, label: t('updateProfile'), type: 'tab' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
          <Link to="/scanner" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-50 font-bold text-sm">
            <QrCode className="w-5 h-5" />
            {t('scanTicket')}
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-bold text-sm">
            <LogOut className="w-5 h-5" /> {t('logout')}
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-72 p-10">
        <header className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-black text-gray-900 capitalize">{activeTab === 'overview' ? t('dashboard') : activeTab === 'profile' ? t('myProfile') : t(activeTab)}</h1>
          {activeTab === 'events' && <Link to="/admin/events/create" className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2"><Plus className="w-5 h-5" /> Create Event</Link>}
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-gray-500 font-bold">Loading...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-3xl border border-red-100 flex flex-col items-center gap-2">
            <X className="w-8 h-8" />
            <p className="font-black">Error loading data</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[ 
                  { label: t('totalRevenue'), value: `${t('currency')} ${metrics.totalRevenue.toLocaleString()}`, icon: PieChart, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: t('totalBuyers'), value: metrics.totalBuyers.toLocaleString(), icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
                  { label: t('activeEvents'), value: metrics.activeEvents.toString(), icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: t('pendingApprovals'), value: metrics.pendingPayments.toString(), icon: CheckCircle, color: 'text-red-600', bg: 'bg-red-50' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100">
                    <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}><stat.icon className="w-6 h-6" /></div>
                    <p className="text-xs font-black text-gray-400 uppercase">{stat.label}</p>
                    <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase">{t('buyer')}</th>
                      <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase">{t('transactionId')}</th>
                      <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase">{t('amount')}</th>
                      <th className="px-8 py-5 text-right text-xs font-black text-gray-400 uppercase">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPayments.map((p) => (
                      <tr key={p.id}>
                        <td className="px-8 py-5"><p className="font-bold">{p.user_name}</p><p className="text-xs">{p.user_email}</p></td>
                        <td className="px-8 py-5 font-mono text-xs">{p.transaction_id}</td>
                        <td className="px-8 py-5 font-black">{t('currency')} {p.amount}</td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleReject(p.id)} className="p-2 text-red-600"><X className="w-5 h-5"/></button>
                            <button onClick={() => handleVerify(p.id)} className={`bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black ${isVerifying === p.id ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={isVerifying === p.id}>{isVerifying === p.id ? '...' : t('verify')}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pendingPayments.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-10 text-center text-gray-400 font-bold">No pending payments</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'events' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventsData && eventsData.length > 0 ? (
                  eventsData.map((ev) => (
                    <EventCard key={ev.id} event={ev} onClick={() => navigate(`/event/${ev.id}`)} />
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center">
                    <p className="text-gray-400 font-bold text-lg">No events found.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'organizers' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <h3 className="text-xl font-black mb-6">Add Organizer</h3>
                  <form onSubmit={handleCreateOrganizer} className="space-y-4">
                    <input className="w-full p-4 bg-gray-50 rounded-2xl outline-none" placeholder="Name" value={newOrgName} onChange={e => setNewOrgName(e.target.value)} required />
                    <input className="w-full p-4 bg-gray-50 rounded-2xl outline-none" placeholder="Email" value={newOrgEmail} onChange={e => setNewOrgEmail(e.target.value)} required />
                    <input className="w-full p-4 bg-gray-50 rounded-2xl outline-none" type="password" placeholder="Password" value={newOrgPassword} onChange={e => setNewOrgPassword(e.target.value)} required />
                    <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black disabled:opacity-50" disabled={isCreatingOrganizer}>{isCreatingOrganizer ? 'Creating...' : 'Create'}</button>
                  </form>
                </div>
                <div className="md:col-span-2 bg-white rounded-3xl border border-gray-100 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50"><tr><th className="px-6 py-4 text-left font-black text-xs uppercase text-gray-400">Organizer</th><th className="px-6 py-4 text-left font-black text-xs uppercase text-gray-400">Event</th></tr></thead>
                    <tbody>
                      {organizers.map(org => (
                        <tr key={org.id} className="border-t border-gray-50">
                          <td className="px-6 py-4"><p className="font-bold text-gray-800">{org.name}</p><p className="text-xs text-gray-500">{org.email}</p></td>
                          <td className="px-6 py-4 font-bold text-sm text-gray-600">{org.event_title || 'No event'}</td>
                        </tr>
                      ))}
                      {organizers.length === 0 && (
                        <tr>
                          <td colSpan={2} className="px-6 py-10 text-center text-gray-400 font-bold">No organizers found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="max-w-xl mx-auto bg-white p-10 rounded-3xl border border-gray-100">
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase px-2">{t('name')}</label>
                    <input className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-transparent focus:border-blue-500 transition-all outline-none" value={profileName} onChange={e => setProfileName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase px-2">{t('email')}</label>
                    <input className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-transparent focus:border-blue-500 transition-all outline-none" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase px-2">{t('password')}</label>
                    <input className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-transparent focus:border-blue-500 transition-all outline-none" type="password" placeholder="New Password" value={profilePassword} onChange={e => setProfilePassword(e.target.value)} />
                  </div>
                  <button className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black disabled:opacity-50" disabled={isUpdatingProfile}>{isUpdatingProfile ? 'Saving...' : 'Save Profile'}</button>
                </form>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;