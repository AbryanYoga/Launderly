"use client";

import { useState, useEffect, useId } from "react";
import Link from "next/link";
import {
  Receipt,
  User,
  Phone,
  Scale,
  CreditCard,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Sparkles,
  FileText,
  AlertCircle,
  Printer,
  RotateCcw,
  X,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import type { Service, PaymentStatus } from "@/types";

interface ToastMessage {
  type: "success" | "error";
  text: string;
}

const defaultServices: Service[] = [
  {
    id: "serv-1",
    name: "Cuci Komplit",
    unit: "kg",
    price: 8000,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "serv-2",
    name: "Cuci Kering",
    unit: "kg",
    price: 6000,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "serv-3",
    name: "Bed Cover",
    unit: "pcs",
    price: 25000,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

function generateInvoice(): string {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV/${yy}${mm}${dd}/${rand}`;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function getEstimatedCompletion(): string {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function NewTransactionPage() {
  const [services, setServices] = useState<Service[]>(defaultServices);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    defaultServices[0].id
  );
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [qty, setQty] = useState<string>("1");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("unpaid");
  const [notes, setNotes] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoice);

  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    qty?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState("");
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const nameInputId = useId();
  const phoneInputId = useId();
  const serviceSelectId = useId();
  const qtyInputId = useId();
  const notesInputId = useId();
  const addressInputId = useId();

  useEffect(() => {
    async function loadServices() {
      try {
        const { data, error } = await supabase
          .from("services")
          .select("*")
          .eq("is_active", true);

        if (!error && data && data.length > 0) {
          setServices(data as Service[]);
          setSelectedServiceId(data[0].id);
        }
      } catch {
        // Fallback to default services
      }
    }
    loadServices();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const currentService =
    services.find((s) => s.id === selectedServiceId) || services[0];
  const parsedQty = Math.max(0, parseFloat(qty) || 0);
  const subtotal = parsedQty * (currentService ? currentService.price : 0);
  const grandTotal = subtotal;
  const estimatedDate = getEstimatedCompletion();

  const validate = () => {
    const errs: { name?: string; phone?: string; qty?: string } = {};

    if (!customerName.trim()) {
      errs.name = "Nama pelanggan wajib diisi";
    }

    if (!customerPhone.trim()) {
      errs.phone = "Nomor WhatsApp/HP wajib diisi";
    } else if (!/^[0-9+ -]{8,16}$/.test(customerPhone.trim())) {
      errs.phone = "Nomor telepon tidak valid";
    }

    if (!qty || parseFloat(qty) <= 0 || isNaN(parseFloat(qty))) {
      errs.qty = "Jumlah atau berat harus lebih besar dari 0";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      let customerId: string | null = null;

      const { data: existingCustomer, error: findError } = await supabase
        .from("customers")
        .select("id")
        .eq("phone", customerPhone.trim())
        .maybeSingle();

      if (findError) throw findError;

      if (existingCustomer?.id) {
        customerId = existingCustomer.id;
      } else {
        const { data: newCustomer, error: insertCustomerError } = await supabase
          .from("customers")
          .insert({
            name: customerName.trim(),
            phone: customerPhone.trim(),
            address: customerAddress.trim() || null,
          })
          .select("id")
          .single();

        if (insertCustomerError) throw insertCustomerError;
        customerId = newCustomer.id;
      }

      const { data: newTx, error: insertTxError } = await supabase
        .from("transactions")
        .insert({
          invoice: invoiceNumber,
          customer_id: customerId,
          total_weight: parsedQty,
          total_amount: grandTotal,
          payment_status: paymentStatus,
          order_status: "pending",
          notes: notes.trim() || null,
        })
        .select("id")
        .single();

      if (insertTxError) throw insertTxError;

      const { error: insertItemError } = await supabase
        .from("transaction_items")
        .insert({
          transaction_id: newTx.id,
          service_id: currentService.id,
          qty: parsedQty,
          subtotal,
        });

      if (insertItemError) throw insertItemError;

      setCreatedInvoice(invoiceNumber);
      setIsSuccess(true);
      setToast({
        type: "success",
        text: `Transaksi ${invoiceNumber} berhasil disimpan ke database!`,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal menghubungkan ke database Supabase.";
      setToast({
        type: "error",
        text: `Gagal menyimpan transaksi: ${message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setQty("1");
    setNotes("");
    setPaymentStatus("unpaid");
    setInvoiceNumber(generateInvoice());
    setErrors({});
    setIsSuccess(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl border p-4 shadow-lg transition-all no-print ${
            toast.type === "success"
              ? "border-success/30 bg-white text-dark shadow-success/10"
              : "border-danger/30 bg-white text-dark shadow-danger/10"
          }`}
        >
          {toast.type === "success" ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-danger/10 text-danger">
              <AlertTriangle className="h-5 w-5" />
            </div>
          )}
          <span className="text-xs font-semibold">{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-gray-400 hover:text-dark ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/"
              className="text-gray-400 hover:text-dark transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl font-bold text-dark">Input Transaksi Manual</h1>
          </div>
          <p className="text-xs text-gray-500">
            Pencatatan langsung cucian walk-in dengan penyimpanan otomatis ke Supabase
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Nota #{invoiceNumber}
          </span>
        </div>
      </div>

      {isSuccess && (
        <div className="rounded-xl border border-success/30 bg-success/10 p-5 no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success text-white">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-dark">
                  Transaksi Berhasil Disimpan!
                </h3>
                <p className="text-xs text-gray-600">
                  Nomor nota <span className="font-semibold text-dark">{createdInvoice}</span> telah tersimpan di database Supabase.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-lg bg-white border border-gray-200 px-3.5 py-2 text-xs font-semibold text-dark shadow-xs hover:bg-gray-50 transition-colors"
              >
                <Printer className="h-4 w-4 text-primary" />
                Cetak Nota
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded-lg bg-white border border-gray-200 px-3.5 py-2 text-xs font-semibold text-dark shadow-xs hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Form
              </button>
              <Link
                href="/"
                className="rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 transition-colors"
              >
                Lihat di Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200/80 p-6 shadow-xs no-print">
          <div className="flex items-center gap-2 pb-4 mb-5 border-b border-gray-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-dark">Formulir Pesanan</h2>
              <p className="text-[11px] text-gray-400">
                Data akan langsung terhubung ke database Supabase
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label
                htmlFor={nameInputId}
                className="block text-xs font-semibold text-dark mb-1.5"
              >
                Nama Pelanggan <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id={nameInputId}
                  type="text"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  placeholder="Contoh: Ibu Rina Susanti"
                  className={`w-full rounded-lg border pl-9 pr-3.5 py-2 text-xs text-dark placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                    errors.name
                      ? "border-danger focus:border-danger focus:ring-danger bg-danger/5"
                      : "border-gray-200 focus:border-primary focus:ring-primary bg-white"
                  }`}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-[11px] text-danger flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={phoneInputId}
                  className="block text-xs font-semibold text-dark mb-1.5"
                >
                  Nomor WhatsApp / HP <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id={phoneInputId}
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      if (errors.phone)
                        setErrors({ ...errors, phone: undefined });
                    }}
                    placeholder="Contoh: 081234567890"
                    className={`w-full rounded-lg border pl-9 pr-3.5 py-2 text-xs text-dark placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                      errors.phone
                        ? "border-danger focus:border-danger focus:ring-danger bg-danger/5"
                        : "border-gray-200 focus:border-primary focus:ring-primary bg-white"
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-[11px] text-danger flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor={addressInputId}
                  className="block text-xs font-semibold text-dark mb-1.5"
                >
                  Alamat <span className="text-gray-400 font-normal">(Opsional)</span>
                </label>
                <input
                  id={addressInputId}
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Contoh: Jl. Merdeka No. 45"
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2 text-xs text-dark placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label
                  htmlFor={serviceSelectId}
                  className="block text-xs font-semibold text-dark mb-1.5"
                >
                  Pilihan Layanan <span className="text-danger">*</span>
                </label>
                <select
                  id={serviceSelectId}
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-dark focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} ({formatRupiah(service.price)} /{" "}
                      {service.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor={qtyInputId}
                  className="block text-xs font-semibold text-dark mb-1.5"
                >
                  {currentService?.unit === "pcs"
                    ? "Kuantitas (Pcs)"
                    : "Berat (Kg)"}{" "}
                  <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <Scale className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id={qtyInputId}
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={qty}
                    onChange={(e) => {
                      setQty(e.target.value);
                      if (errors.qty) setErrors({ ...errors, qty: undefined });
                    }}
                    placeholder="Contoh: 3.5"
                    className={`w-full rounded-lg border pl-9 pr-12 py-2 text-xs text-dark placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                      errors.qty
                        ? "border-danger focus:border-danger focus:ring-danger bg-danger/5"
                        : "border-gray-200 focus:border-primary focus:ring-primary bg-white"
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 uppercase">
                    {currentService?.unit || "kg"}
                  </span>
                </div>
                {errors.qty && (
                  <p className="mt-1 text-[11px] text-danger flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.qty}
                  </p>
                )}
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold text-dark mb-1.5">
                Status Pembayaran <span className="text-danger">*</span>
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentStatus("unpaid")}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold transition-all ${
                    paymentStatus === "unpaid"
                      ? "border-warning bg-warning/10 text-[#c2841d] ring-1 ring-warning"
                      : "border-gray-200 bg-gray-50/50 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  Belum Lunas
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus("paid")}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold transition-all ${
                    paymentStatus === "paid"
                      ? "border-success bg-success/10 text-success ring-1 ring-success"
                      : "border-gray-200 bg-gray-50/50 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  Lunas
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor={notesInputId}
                className="block text-xs font-semibold text-dark mb-1.5"
              >
                Catatan Khusus <span className="text-gray-400 font-normal">(Opsional)</span>
              </label>
              <textarea
                id={notesInputId}
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Pakaian putih dipisah, parfum aroma lavender"
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2 text-xs text-dark placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-white transition-all resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 px-4 text-xs font-bold text-white shadow-xs hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? (
                  <>Menyimpan ke Supabase...</>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Simpan Transaksi & Terbitkan Nota
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div
            id="printable-receipt"
            className="rounded-xl border border-gray-200/80 bg-white p-6 shadow-xs relative overflow-hidden"
          >
            <div className="absolute -right-6 -bottom-6 text-gray-50/80 pointer-events-none select-none no-print">
              <Receipt className="h-40 w-40" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between pb-3 border-b border-dashed border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar text-white">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-dark">
                      Nota Transaksi
                    </h3>
                    <span className="text-[10px] text-gray-400">Laundry Insight</span>
                  </div>
                </div>
                <span className="font-mono text-[11px] font-bold text-primary">
                  {invoiceNumber}
                </span>
              </div>

              <div className="py-3 space-y-2 text-xs border-b border-dashed border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-500">Pelanggan:</span>
                  <span className="font-semibold text-dark">
                    {customerName.trim() || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Nomor Telepon:</span>
                  <span className="font-mono text-dark">
                    {customerPhone.trim() || "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Status Bayar:</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      paymentStatus === "paid"
                        ? "bg-success/10 text-success"
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    {paymentStatus === "paid" ? "LUNAS" : "BELUM LUNAS"}
                  </span>
                </div>
              </div>

              <div className="py-3 border-b border-dashed border-gray-200">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Rincian Item
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-medium text-dark">{currentService?.name}</p>
                    <p className="text-[11px] text-gray-400">
                      {parsedQty} {currentService?.unit} x{" "}
                      {formatRupiah(currentService?.price || 0)}
                    </p>
                  </div>
                  <span className="font-bold text-dark">
                    {formatRupiah(subtotal)}
                  </span>
                </div>
              </div>

              <div className="py-3 space-y-2 border-b border-gray-200">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-dark pt-1">
                  <span>Total Tagihan</span>
                  <span className="text-base text-primary font-extrabold">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>
              </div>

              <div className="pt-3 space-y-2">
                <div className="flex items-center gap-2 rounded-lg bg-[#F8F9FA] p-2.5 text-xs text-gray-600 border border-gray-100">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400">
                      Estimasi Selesai (+2 Hari):
                    </p>
                    <p className="text-[11px] font-semibold text-dark">
                      {estimatedDate}
                    </p>
                  </div>
                </div>

                {notes.trim() && (
                  <div className="rounded-lg bg-gray-50 p-2.5 text-[11px] text-gray-500 border border-gray-100">
                    <span className="font-semibold text-dark">Catatan: </span>
                    {notes}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-dashed border-gray-200 no-print flex gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50/80 py-2 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Printer className="h-3.5 w-3.5 text-gray-500" />
                Cetak Lembar Nota
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
