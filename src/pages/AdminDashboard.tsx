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
  X,
  User as UserIcon,
  Loader2,
  Plus,
  ExternalLink,
  Search,
  Check,
  CreditCard,
  Edit,
  Trash2,
  Save,
  ChevronDown,
  Phone
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Event, Ticket, PaymentAccount, User } from '../types';
import { toast } from 'sonner';
import EventCard from '../components/EventCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Switch } from '../components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../components/ui/command';

const AdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user: currentUser, refreshProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'events' | 'organizers' | 'profile' | 'payment-settings'>('overview');
  const [pendingTickets, setPendingTickets] = useState<Ticket[]>([]);
  const [eventsData, setEventsData] = useState<Event[] | null>(null);
  const [organizers, setOrganizers] = useState<User[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
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
  const [newOrgPhone, setNewOrgPhone] = useState('');
  const [newOrgPassword, setNewOrgPassword] = useState('');
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);

  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [newAccount, setNewAccount] = useState<Partial<PaymentAccount>>({
    method_name: '',
    account_number: '',
    account_name: '',
    description: '',
    is_active: true
  });
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingAccountData, setEditingAccountData] = useState<Partial<PaymentAccount>>({});

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
          api.getPendingTickets()
        ]);
        setMetrics(m);
        setPendingTickets(p);
      } else if (activeTab === 'payments') {
        const p = await api.getPendingTickets();
        setPendingTickets(p);
      } else if (activeTab === 'events') {
        const e = await api.getEvents();
        setEventsData(e);
      } else if (activeTab === 'organizers') {
        const [o, e] = await Promise.all([
          api.getOrganizers(),
          api.getEvents()
        ]);
        setOrganizers(o);
        setEventsData(e);
      } else if (activeTab === 'payment-settings') {
        const accounts = await api.getPaymentAccounts();
        setPaymentAccounts(accounts);
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
    if (selectedEventIds.length === 0) {
      toast.error('Please assign at least one event to the organizer');
      return;
    }
    setIsCreatingOrganizer(true);
    try {
      await api.createOrganizer({
        name: newOrgName, 
        email: newOrgEmail, 
        phone: newOrgPhone,
        password: newOrgPassword, 
        event_ids: selectedEventIds 
      });
      toast.success('Organizer created and events assigned!');
      setNewOrgName(''); 
      setNewOrgEmail(''); 
      setNewOrgPhone('');
      setNewOrgPassword('');
      setSelectedEventIds([]);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create organizer');
    } finally {
      setIsCreatingOrganizer(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPaymentAccount(newAccount);
      toast.success('Payment account added!');
      setNewAccount({
        method_name: '',
        account_number: '',
        account_name: '',
        description: '',
        is_active: true
      });
      setIsCreatingAccount(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    }
  };

  const handleUpdateAccount = async (id: string) => {
    try {
      await api.updatePaymentAccount(id, editingAccountData);
      toast.success('Payment account updated!');
      setEditingAccountId(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update account');
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this payment account?')) return;
    try {
      await api.deletePaymentAccount(id);
      toast.success('Payment account deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete account');
    }
  };

  const handleVerify = async (ticketId: string) => {
    setIsVerifying(ticketId);
    try {
      await api.approveTicket(ticketId);
      toast.success(t('paymentApprovedToast') || 'Ticket approved!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || t('approveFailedToast') || 'Approval failed');
    } finally {
      setIsVerifying(null);
    }
  };

  const handleReject = async (ticketId: string) => {
    if (!window.confirm('Are you sure you want to reject this ticket?')) return;
    setIsVerifying(ticketId);
    try {
      await api.rejectTicket(ticketId);
      toast.success(t('paymentRejectToast') || 'Ticket rejected');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || t('rejectFailedToast') || 'Rejection failed');
    } finally {
      setIsVerifying(null);
    }
  };

  const getVerificationLink = (p: Ticket) => {
    if (!p.transaction_id) return '#';
    if (p.payment_method === 'Telebirr') return `https://transactioninfo.ethiotelecom.et/receipt/${p.transaction_id}`;
    if (p.payment_method === 'CBE') return `https://apps.cbe.com.et:100/?id=${p.transaction_id}`;
    if (p.payment_method === 'M-Pesa') return `https://mpesa.com/transaction/${p.transaction_id}`;
    return '#';
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsUpdatingProfile(true);
    try {
      await api.updateProfile({ name: profileName, email: profileEmail, password: profilePassword });
      await refreshProfile();
      setProfilePassword('');
      toast.success(t('profileUpdateSuccess') || 'Profile updated!');
    } catch (error: any) {
      toast.error(error.message || t('profileUpdateFailed') || 'Update failed');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const toggleEventSelection = (id: string) => {
    setSelectedEventIds(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-gray-100 flex-col fixed h-full shadow-sm z-20">
        <div className="p-8">
          <div className="flex items-center gap-3 font-black italic text-xl tracking-tight text-blue-600">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white not-italic">K</div>
            <span>Kistet Addis</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
            { id: 'payments', icon: CheckCircle, label: 'Approvals' },
            { id: 'events', icon: Calendar, label: 'Manage Events' },
            { id: 'organizers', icon: Users, label: 'Organizers' },
            { id: 'payment-settings', icon: CreditCard, label: 'Payment Settings' },
            { id: 'profile', icon: UserIcon, label: 'Account' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all font-black text-sm ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' 
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-gray-400'}`} />
              {item.label}
            </button>
          ))}
          <Link to="/scanner" className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-gray-400 hover:bg-gray-50 hover:text-gray-900 font-black text-sm">
            <QrCode className="w-5 h-5" />
            Scanner Mode
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-red-500 hover:bg-red-50 font-black text-sm transition-colors">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-72 p-6 md:p-12 min-h-screen">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Admin Panel</p>
            <h1 className="text-4xl font-black text-gray-900 capitalize">
              {activeTab === 'overview' ? 'Dashboard Overview' : 
               activeTab === 'payments' ? 'Manual Approvals' : 
               activeTab === 'payment-settings' ? 'Payment Settings' : 
               activeTab === 'organizers' ? 'Manage Organizers' :
               activeTab}
            </h1>
          </div>
          {activeTab === 'events' && (
            <Link to="/admin/events/create" className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">
              <Plus className="w-5 h-5" /> Create Event
            </Link>
          )}
          {activeTab === 'payment-settings' && (
            <Button onClick={() => setIsCreatingAccount(true)} className="bg-blue-600 text-white px-8 py-7 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all border-none">
              <Plus className="w-5 h-5" /> Add New Method
            </Button>
          )}
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
            <p className="text-gray-400 font-black uppercase tracking-widest animate-pulse">Synchronizing Data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-10 rounded-[2.5rem] border-2 border-red-100 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <p className="text-xl font-black">Connection Error</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
            <button onClick={() => fetchData()} className="mt-4 px-8 py-3 bg-red-600 text-white rounded-xl font-black">Retry Fetch</button>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[ 
                  { label: 'Total Revenue', value: `${metrics.totalRevenue.toLocaleString()} ETB`, icon: PieChart, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Total Buyers', value: metrics.totalBuyers.toLocaleString(), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Active Events', value: metrics.activeEvents.toString(), icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: 'Pending Approvals', value: metrics.pendingPayments.toString(), icon: CheckCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className={`${stat.bg} ${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm`}><stat.icon className="w-7 h-7" /></div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-3xl font-black text-gray-900">{stat.value}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                   <h3 className="text-xl font-black">Ticket Verification Queue</h3>
                   <div className="bg-gray-50 px-4 py-2 rounded-xl flex items-center gap-2 text-gray-400">
                     <Search className="w-4 h-4" />
                     <input type="text" placeholder="Search transaction..." className="bg-transparent border-none outline-none text-xs font-bold" />
                   </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Buyer</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Method</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction ID</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantity</th>
                        <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {pendingTickets.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <p className="font-black text-gray-900">{t.user_name}</p>
                            <p className="text-xs text-gray-400 font-bold">{t.email || t.phone}</p>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${t.payment_method === 'Telebirr' ? 'bg-blue-100 text-blue-600' : t.payment_method === 'CBE' ? 'bg-purple-100 text-purple-600' : 'bg-red-100 text-red-600'}`}>
                              {t.payment_method}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <code className="bg-gray-100 px-3 py-1 rounded-lg text-xs font-bold text-gray-600 uppercase">{t.transaction_id}</code>
                              <a 
                                href={getVerificationLink(t)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                                title="Verify receipt"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </td>
                          <td className="px-8 py-6 font-black text-gray-900">{t.quantity} Tickets</td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-3">
                              <button 
                                onClick={() => handleReject(t.id)} 
                                className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all"
                                title="Reject"
                              >
                                <X className="w-5 h-5"/>
                              </button>
                              <button 
                                onClick={() => handleVerify(t.id)} 
                                disabled={isVerifying === t.id} 
                                className={`bg-emerald-500 text-white px-6 py-2 rounded-xl text-xs font-black shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all flex items-center gap-2 ${isVerifying === t.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {isVerifying === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                {isVerifying === t.id ? 'Approving...' : 'Approve'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {pendingTickets.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-8 py-20 text-center">
                             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-gray-200" />
                             </div>
                             <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Queue is clear. No pending tickets.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'events' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {eventsData && eventsData.length > 0 ? (
                  eventsData.map((ev) => (
                    <EventCard key={ev.id} event={ev} onClick={() => navigate(`/event/${ev.id}`)} />
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                    <p className="text-gray-400 font-black uppercase tracking-widest">Launch your first event</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'organizers' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm h-fit">
                  <h3 className="text-2xl font-black mb-8">Add Organizer</h3>
                  <form onSubmit={handleCreateOrganizer} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase px-2">Full Name</label>
                      <input className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-blue-600 transition-all" placeholder="e.g. Kuriftu Resort" value={newOrgName} onChange={e => setNewOrgName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase px-2">Email Address</label>
                      <input className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-blue-600 transition-all" type="email" placeholder="org@example.com" value={newOrgEmail} onChange={e => setNewOrgEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase px-2">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input className="w-full p-5 pl-12 bg-gray-50 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-blue-600 transition-all" placeholder="0911..." value={newOrgPhone} onChange={e => setNewOrgPhone(e.target.value)} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase px-2">Password</label>
                      <input className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-blue-600 transition-all" type="password" placeholder="Minimum 8 chars" value={newOrgPassword} onChange={e => setNewOrgPassword(e.target.value)} required />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase px-2">Assign Events</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full p-7 bg-gray-50 rounded-2xl border-none justify-between font-bold hover:bg-gray-100 h-auto">
                            <span className="truncate">
                              {selectedEventIds.length > 0 
                                ? `${selectedEventIds.length} Events Selected` 
                                : "Select Events..."}
                            </span>
                            <ChevronDown className="ml-2 h-4 w-4 opacity-50 flex-shrink-0" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search events..." />
                            <CommandList>
                              <CommandEmpty>No events found.</CommandEmpty>
                              <CommandGroup className="max-h-64 overflow-y-auto">
                                {eventsData?.map((ev) => (
                                  <CommandItem
                                    key={ev.id}
                                    onSelect={() => toggleEventSelection(ev.id)}
                                    className="flex items-center gap-2 p-3"
                                  >
                                    <Checkbox 
                                      checked={selectedEventIds.includes(ev.id)}
                                      onCheckedChange={() => toggleEventSelection(ev.id)}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-bold text-sm line-clamp-1">{typeof ev.title === 'string' ? ev.title : ev.title.en}</span>
                                      <span className="text-[10px] text-gray-400">{new Date(ev.date).toLocaleDateString()}</span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedEventIds.map(id => {
                          const ev = eventsData?.find(e => e.id === id);
                          if (!ev) return null;
                          return (
                            <Badge key={id} variant="secondary" className="bg-blue-50 text-blue-600 border-none px-3 py-1 font-bold text-[10px]">
                              {typeof ev.title === 'string' ? ev.title : (typeof ev.title === 'string'
  ? ev.title
  : (ev.title as any)?.en || 'Untitled Event')}
                              <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => toggleEventSelection(id)} />
                            </Badge>
                          );
                        })}
                      </div>
                    </div>

                    <button className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-blue-100 disabled:opacity-50 hover:bg-blue-700 transition-all" disabled={isCreatingOrganizer}>{isCreatingOrganizer ? 'Generating Account...' : 'Create Organizer'}</button>
                  </form>
                </div>
                <div className="md:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-gray-50 font-black text-xl">Platform Organizers</div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-8 py-5 text-left font-black text-[10px] uppercase text-gray-400 tracking-widest">Entity</th>
                          <th className="px-8 py-5 text-left font-black text-[10px] uppercase text-gray-400 tracking-widest">Events</th>
                          <th className="px-8 py-5 text-left font-black text-[10px] uppercase text-gray-400 tracking-widest">Permission</th>
                          <th className="px-8 py-5 text-right font-black text-[10px] uppercase text-gray-400 tracking-widest">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {organizers.map(org => (
                          <tr key={org.id} className="hover:bg-gray-50/30 transition-colors">
                            <td className="px-8 py-5">
                              <p className="font-black text-gray-800">{org.name}</p>
                              <p className="text-xs text-gray-400 font-medium">{org.email} {org.phone && `• ${org.phone}`}</p>
                            </td>
                            <td className="px-8 py-5">
                              <Badge variant="outline" className="bg-blue-50/30 text-blue-600 border-none font-bold text-[10px]">
                                {org.assignedEventIds?.length || 0} Events
                              </Badge>
                            </td>
                            <td className="px-8 py-5">
                              <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full">{org.role}</span>
                            </td>
                            <td className="px-8 py-5 text-right">
                               <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                            </td>
                          </tr>
                        ))}
                        {organizers.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-8 py-20 text-center text-gray-400 font-black uppercase tracking-widest text-sm">No organizers found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payment-settings' && (
              <div className="space-y-8">
                {isCreatingAccount && (
                  <Card className="rounded-[2.5rem] border-blue-100 bg-blue-50/30">
                    <CardHeader>
                      <CardTitle className="font-black text-2xl">New Payment Method</CardTitle>
                      <CardDescription>Configure a new bank or mobile money account</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleCreateAccount}>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Method Name</Label>
                          <Input 
                            placeholder="e.g. Telebirr, CBE, Awash Bank" 
                            className="p-6 rounded-2xl bg-white border-none shadow-sm font-bold"
                            value={newAccount.method_name} 
                            onChange={e => setNewAccount({...newAccount, method_name: e.target.value})} 
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Account Number</Label>
                          <Input 
                            placeholder="Enter number..." 
                            className="p-6 rounded-2xl bg-white border-none shadow-sm font-bold"
                            value={newAccount.account_number} 
                            onChange={e => setNewAccount({...newAccount, account_number: e.target.value})} 
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Account Name</Label>
                          <Input 
                            placeholder="e.g. Kistet Addis PLC" 
                            className="p-6 rounded-2xl bg-white border-none shadow-sm font-bold"
                            value={newAccount.account_name} 
                            onChange={e => setNewAccount({...newAccount, account_name: e.target.value})} 
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Description (Optional)</Label>
                          <Input 
                            placeholder="Add some notes..." 
                            className="p-6 rounded-2xl bg-white border-none shadow-sm font-bold"
                            value={newAccount.description} 
                            onChange={e => setNewAccount({...newAccount, description: e.target.value})} 
                          />
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsCreatingAccount(false)} className="rounded-xl font-bold">Cancel</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black px-8">Save Method</Button>
                      </CardFooter>
                    </form>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paymentAccounts.map((account) => (
                    <Card key={account.id} className="rounded-[2rem] border-gray-100 shadow-sm overflow-hidden flex flex-col">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-blue-600">
                            <CreditCard className="w-6 h-6" />
                          </div>
                          <Badge className={account.is_active ? 'bg-emerald-50 text-emerald-600 border-none' : 'bg-gray-100 text-gray-400 border-none'}>
                            {account.is_active ? 'Active' : 'Disabled'}
                          </Badge>
                        </div>
                        {editingAccountId === account.id ? (
                          <Input 
                            className="mt-4 font-black text-xl border-gray-200"
                            value={editingAccountData.method_name}
                            onChange={e => setEditingAccountData({...editingAccountData, method_name: e.target.value})}
                          />
                        ) : (
                          <CardTitle className="mt-4 font-black text-xl">{account.method_name}</CardTitle>
                        )}
                      </CardHeader>
                      <CardContent className="flex-grow space-y-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase">Account Number</p>
                          {editingAccountId === account.id ? (
                            <Input 
                              className="font-bold border-gray-200"
                              value={editingAccountData.account_number}
                              onChange={e => setEditingAccountData({...editingAccountData, account_number: e.target.value})}
                            />
                          ) : (
                            <p className="font-bold text-gray-900">{account.account_number}</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase">Account Holder</p>
                          {editingAccountId === account.id ? (
                            <Input 
                              className="font-bold border-gray-200"
                              value={editingAccountData.account_name}
                              onChange={e => setEditingAccountData({...editingAccountData, account_name: e.target.value})}
                            />
                          ) : (
                            <p className="font-bold text-gray-900">{account.account_name}</p>
                          )}
                        </div>
                        {account.description && !editingAccountId && (
                          <p className="text-sm text-gray-400 italic line-clamp-2">{account.description}</p>
                        )}
                        {editingAccountId === account.id && (
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-gray-400 uppercase">Description</p>
                              <Textarea 
                                className="font-bold border-gray-200"
                                value={editingAccountData.description}
                                onChange={e => setEditingAccountData({...editingAccountData, description: e.target.value})}
                              />
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                              <Switch 
                                checked={editingAccountData.is_active}
                                onCheckedChange={(checked) => setEditingAccountData({...editingAccountData, is_active: checked})}
                              />
                              <Label className="text-[10px] font-black text-gray-400 uppercase">Active</Label>
                            </div>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="border-t border-gray-50 pt-6 flex justify-between">
                        {editingAccountId === account.id ? (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setEditingAccountId(null)} 
                              className="rounded-xl font-bold"
                            >
                              Cancel
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleUpdateAccount(account.id)} 
                              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black gap-2"
                            >
                              <Save className="w-4 h-4" /> Save
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setEditingAccountId(account.id);
                                setEditingAccountData(account);
                              }} 
                              className="rounded-xl font-bold text-gray-400 hover:text-blue-600"
                            >
                              <Edit className="w-4 h-4 mr-2" /> Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteAccount(account.id)} 
                              className="rounded-xl font-bold text-gray-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </Button>
                          </>
                        )}
                      </CardFooter>
                    </Card>
                  ))}

                  {paymentAccounts.length === 0 && !isCreatingAccount && (
                    <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                        <CreditCard className="w-8 h-8 text-gray-200" />
                      </div>
                      <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No payment methods configured</p>
                      <Button onClick={() => setIsCreatingAccount(true)} variant="outline" className="rounded-xl font-bold">Add First Method</Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="max-w-2xl mx-auto bg-white p-12 rounded-[3rem] border border-gray-100 shadow-sm">
                <div className="flex flex-col items-center mb-10">
                   <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mb-4">
                      <UserIcon className="w-12 h-12" />
                   </div>
                   <h3 className="text-2xl font-black">Account Settings</h3>
                   <p className="text-gray-400 font-bold">Manage your administrative profile</p>
                </div>
                
                <form onSubmit={handleUpdateProfile} className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase px-4">Full Administrator Name</label>
                    <input className="w-full p-6 bg-gray-50 rounded-3xl font-black border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all outline-none text-lg" value={profileName} onChange={e => setProfileName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase px-4">Contact Email</label>
                    <input className="w-full p-6 bg-gray-50 rounded-3xl font-black border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all outline-none text-lg" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase px-4">Update Password</label>
                    <input className="w-full p-6 bg-gray-50 rounded-3xl font-black border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all outline-none text-lg" type="password" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" value={profilePassword} onChange={e => setProfilePassword(e.target.value)} />
                  </div>
                  <button className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black shadow-xl shadow-blue-100 disabled:opacity-50 hover:bg-blue-700 transition-all text-xl" disabled={isUpdatingProfile}>{isUpdatingProfile ? 'Processing...' : 'Save Changes'}</button>
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