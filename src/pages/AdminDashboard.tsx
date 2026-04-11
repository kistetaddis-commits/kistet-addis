import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Loader2,
} from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Event } from '../types';
import { toast } from 'sonner';
import EventCard from '../components/EventCard';

const AdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'events' | 'organizers' | 'profile'>('overview');
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [eventsData, setEventsData] = useState<Event[]>([]);
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    totalRevenue: 0,
    totalBuyers: 0,
    activeEvents: 0,
    pendingPayments: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ HANDLE TOKEN ERRORS
  const handleAuthError = (err: any) => {
    if (
      err.message?.includes("No token") ||
      err.message?.includes("Invalid token")
    ) {
      toast.error("Session expired. Please login again.");
      signOut();
      navigate('/login');
    }
  };

  // ✅ FETCH DATA
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'overview') {
        const [m, p] = await Promise.all([
          api.getMetrics(),
          api.getPendingPayments(),
        ]);
        setMetrics(m || {});
        setPendingPayments(p || []);
      }

      if (activeTab === 'payments') {
        const p = await api.getPendingPayments();
        setPendingPayments(p || []);
      }

      if (activeTab === 'events') {
        const e = await api.getEvents();
        setEventsData(e || []);
      }

      if (activeTab === 'organizers') {
        const o = await api.getOrganizers();
        setOrganizers(o || []);
      }

    } catch (err: any) {
      console.error("❌ FETCH ERROR:", err);
      handleAuthError(err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r fixed h-full">
        <div className="p-6 font-black text-xl">Kistet Addis</div>

        <nav className="space-y-2 px-4">
          {['overview', 'payments', 'events', 'organizers', 'profile'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-500'
              }`}
            >
              {tab}
            </button>
          ))}

          <Link to="/scanner" className="block px-4 py-3 text-gray-500">
            Scan Ticket
          </Link>
        </nav>

        <div className="p-4">
          <button onClick={handleLogout} className="text-red-500 font-bold">
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 ml-72 p-8">

        <h1 className="text-3xl font-black mb-6 capitalize">
          {activeTab}
        </h1>

        {/* LOADING */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin w-10 h-10" />
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="bg-red-100 text-red-600 p-6 rounded-xl">
            <p className="font-bold">Error loading data</p>
            <p>{error}</p>
          </div>
        )}

        {/* CONTENT */}
        {!loading && !error && (
          <>
            {activeTab === 'overview' && (
              <div className="grid grid-cols-2 gap-4">
                <div>Total Revenue: {metrics.totalRevenue || 0}</div>
                <div>Total Buyers: {metrics.totalBuyers || 0}</div>
                <div>Events: {metrics.activeEvents || 0}</div>
                <div>Pending: {metrics.pendingPayments || 0}</div>
              </div>
            )}

            {activeTab === 'events' && (
              <div className="grid grid-cols-3 gap-4">
                {eventsData.map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    onClick={() => navigate(`/event/${e.id}`)} // ✅ FIXED HERE
                  />
                ))}
              </div>
            )}

            {activeTab === 'organizers' && (
              <div>
                {organizers.map((o) => (
                  <div key={o.id}>{o.name}</div>
                ))}
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;