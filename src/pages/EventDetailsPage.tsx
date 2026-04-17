import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Ticket,
  Clock,
  ChevronLeft,
  Share2,
  Loader2,
  Info,
  ExternalLink,
} from "lucide-react";

import { useLanguage } from "../context/LanguageContext";
import { api } from "../lib/api";
import { Event } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import TicketPurchaseFlow from "../components/TicketPurchaseFlow";

const EventDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPurchase, setShowPurchase] = useState(false);

  // ================= FETCH EVENT =================
  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;

      try {
        setLoading(true);

        // FIX: correct API function name
        const data = await api.getEvent(id);

        setEvent(data);
      } catch (err) {
        console.error(err);
        toast.error("Event not found");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, navigate]);

  // ================= LOCALIZATION =================
  const getText = (val: any) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    return val?.[language] || val?.en || "";
  };

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  // ================= NO EVENT =================
  if (!event) {
    return (
      <div className="p-10 text-center text-gray-500">
        Event not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* ================= HEADER ================= */}
      <div className="relative h-[300px] md:h-[500px] w-full">
        <img
          src={event.image_url}
          alt={getText(event.title)}
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* BACK */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 bg-white/20 text-white p-3 rounded-full"
        >
          <ChevronLeft />
        </button>

        {/* SHARE */}
        <button className="absolute top-6 right-6 bg-white/20 text-white p-3 rounded-full">
          <Share2 />
        </button>

        {/* TITLE */}
        <div className="absolute bottom-8 left-6 right-6 text-white">
          <span className="bg-blue-600 px-3 py-1 rounded-full text-xs font-bold">
            {event.event_type}
          </span>

          <h1 className="text-4xl font-black mt-3">
            {getText(event.title)}
          </h1>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="max-w-7xl mx-auto px-4 -mt-10">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">

            {/* ABOUT */}
            <div className="bg-white rounded-3xl p-8 shadow">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Info /> {t("aboutEvent")}
              </h2>

              <p className="mt-4 text-gray-600">
                {getText(event.description)}
              </p>
            </div>

            {/* DATE + LOCATION */}
            <div className="bg-white rounded-3xl p-8 shadow grid md:grid-cols-2 gap-4">

              <div className="flex items-center gap-3">
                <Calendar className="text-blue-500" />
                <div>
                  <p className="font-bold">{t("date")}</p>
                  <p>{new Date(event.date).toDateString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="text-red-500" />
                <div>
                  <p className="font-bold">{t("location")}</p>
                  <p>{event.location}</p>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT */}
          <div>
            <div className="bg-white rounded-3xl p-6 shadow sticky top-24">

              <div className="flex justify-between mb-6">
                <span className="font-bold">{t("price")}</span>
                <span className="text-2xl font-black text-blue-600">
                  {event.price} ETB
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex gap-2">
                  <Ticket className="text-blue-500" />
                  {event.total_tickets} tickets
                </div>

                <div className="flex gap-2">
                  <Clock className="text-orange-500" />
                  {new Date(event.selling_deadline).toDateString()}
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => setShowPurchase(true)}
              >
                {t("buyTicket")}
              </Button>

            </div>
          </div>

        </div>
      </div>

      {/* ================= PURCHASE MODAL ================= */}
      <AnimatePresence>
        {showPurchase && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <TicketPurchaseFlow
              event={event}
              onClose={() => setShowPurchase(false)}
            />
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default EventDetailsPage;