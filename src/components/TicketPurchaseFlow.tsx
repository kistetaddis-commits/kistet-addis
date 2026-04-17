import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, RefreshCw, ArrowLeft } from "lucide-react";
import { api } from "../lib/api";
import TicketQR from "./TicketQR";
import { Event } from "../types";
import { toast } from "sonner";

type Step = 1 | 2 | 3;

interface Props {
  event: Event;
  onClose: () => void;
}

const TicketPurchaseFlow: React.FC<Props> = ({ event, onClose }) => {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<any>(null);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    quantity: 1,
  });

  const [method, setMethod] = useState("Telebirr");
  const [txId, setTxId] = useState("");

  // STEP 1 VALIDATION
  const next = () => {
    if (!form.fullName || !form.phone) {
      toast.error("Fill required fields");
      return;
    }
    setStep(2);
  };

  // SUBMIT PAYMENT
  const submit = async () => {
    if (!txId) return toast.error("Enter transaction ID");

    try {
      setLoading(true);

      const res = await api.purchaseTicket({
        event_id: event.id,
        user_name: form.fullName,
        phone: form.phone,
        email: form.email,
        quantity: form.quantity,
        payment_method: method,
        transaction_id: txId,
        amount: form.quantity * (event.price || 0),
      });

      setTicket(res);
      setStep(3);

      toast.success("Submitted!");
    } catch (err: any) {
      toast.error(err.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  // CHECK STATUS
  const checkStatus = async () => {
    if (!ticket?.id) return;

    try {
      const res = await api.scanTicket(ticket.id);
      setTicket(res);
    } catch {
      toast.error("Failed to check");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">

      <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden">

        {/* HEADER */}
        <div className="p-4 border-b flex justify-between">
          <h2 className="font-bold">{event.title}</h2>
          <button onClick={onClose}>
            <ArrowLeft />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6">

          <AnimatePresence mode="wait">

            {/* STEP 1 */}
            {step === 1 && (
              <motion.div
                key="1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <input
                  className="input"
                  placeholder="Full Name"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                />

                <input
                  className="input"
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                />

                <input
                  className="input"
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: Number(e.target.value) })
                  }
                />

                <button
                  onClick={next}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <motion.div key="2" className="space-y-3">
                <div className="flex gap-2">
                  {["Telebirr", "CBE", "M-Pesa"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMethod(m)}
                      className={`px-3 py-2 border rounded-xl ${
                        method === m ? "bg-blue-600 text-white" : ""
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <input
                  className="input"
                  placeholder="Transaction ID"
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                />

                <button
                  onClick={submit}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl"
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </motion.div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <motion.div key="3" className="text-center space-y-4">

                {ticket?.status === "approved" ? (
                  <>
                    <CheckCircle2 className="mx-auto text-green-500 w-16 h-16" />

                    <TicketQR
                      ticketId={ticket.id}
                      eventId={event.id}
                      size={200}
                    />
                  </>
                ) : (
                  <>
                    <Clock className="mx-auto w-12 h-12 text-yellow-500" />

                    <button
                      onClick={checkStatus}
                      className="flex items-center gap-2 mx-auto text-blue-600"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Check Status
                    </button>
                  </>
                )}

              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};

export default TicketPurchaseFlow;