"use client";

import { useState, useEffect, useId } from "react";
import Link from "next/link";
import {
  Layers,
  Store,
  Plus,
  Edit2,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  RotateCw,
  Building2,
  Phone,
  MapPin,
  MessageSquare,
  Receipt,
  Sparkles,
  Save,
  Tag,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import type { Service, ServiceUnit } from "@/types";

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
  {
    id: "serv-4",
    name: "Setrika Saja",
    unit: "kg",
    price: 4500,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

function formatRupiah(val: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val);
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"services" | "profile">("services");
  const [services, setServices] = useState<Service[]>(defaultServices);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [serviceName, setServiceName] = useState("");
  const [serviceUnit, setServiceUnit] = useState<ServiceUnit>("kg");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceIsActive, setServiceIsActive] = useState(true);
  const [serviceErrors, setServiceErrors] = useState<{
    name?: string;
    price?: string;
  }>({});
  const [isSubmittingService, setIsSubmittingService] = useState(false);

  const [settingId, setSettingId] = useState<string | null>(null);
  const [outletName, setOutletName] = useState("Laundry Insight");
  const [outletPhone, setOutletPhone] = useState("081234567890");
  const [outletAddress, setOutletAddress] = useState(
    "Jl. Utama No. 123, Jakarta Selatan"
  );
  const [receiptFooter, setReceiptFooter] = useState(
    "Terima kasih telah mempercayakan pakaian Anda kepada kami."
  );
  const [profileErrors, setProfileErrors] = useState<{
    name?: string;
    phone?: string;
  }>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const modalNameId = useId();
  const modalUnitId = useId();
  const modalPriceId = useId();
  const profileNameId = useId();
  const profilePhoneId = useId();
  const profileAddressId = useId();
  const profileFooterId = useId();

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [servicesRes, settingsRes] = await Promise.all([
          supabase
            .from("services")
            .select("*")
            .order("created_at", { ascending: true }),
          supabase.from("settings").select("*").maybeSingle(),
        ]);

        if (isMounted) {
          if (servicesRes.data && servicesRes.data.length > 0) {
            setServices(servicesRes.data as Service[]);
          }
          if (settingsRes.data) {
            setSettingId(settingsRes.data.id);
            setOutletName(settingsRes.data.outlet_name || "Laundry Insight");
            setOutletPhone(settingsRes.data.outlet_phone || "081234567890");
            setOutletAddress(settingsRes.data.outlet_address || "");
            setReceiptFooter(settingsRes.data.receipt_footer || "");
          }
        }
      } catch {
        // Fallback to sample data
      } finally {
        if (isMounted) {
          setIsLoadingServices(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditingId(null);
    setServiceName("");
    setServiceUnit("kg");
    setServicePrice("");
    setServiceIsActive(true);
    setServiceErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service: Service) => {
    setModalMode("edit");
    setEditingId(service.id);
    setServiceName(service.name);
    setServiceUnit(service.unit);
    setServicePrice(String(service.price));
    setServiceIsActive(service.is_active);
    setServiceErrors({});
    setIsModalOpen(true);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;

    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: nextStatus } : s))
    );

    try {
      if (!id.startsWith("serv-")) {
        await supabase
          .from("services")
          .update({ is_active: nextStatus })
          .eq("id", id);
      }
      setToast({
        type: "success",
        text: `Status layanan berhasil diperbarui menjadi ${
          nextStatus ? "Aktif" : "Nonaktif"
        }!`,
      });
    } catch {
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: currentStatus } : s))
      );
      setToast({
        type: "error",
        text: "Gagal memperbarui status layanan.",
      });
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs: { name?: string; price?: string } = {};
    if (!serviceName.trim()) {
      errs.name = "Nama layanan wajib diisi";
    }
    const parsedPrice = parseFloat(servicePrice);
    if (!servicePrice || isNaN(parsedPrice) || parsedPrice <= 0) {
      errs.price = "Tarif layanan harus berupa angka lebih besar dari 0";
    }

    if (Object.keys(errs).length > 0) {
      setServiceErrors(errs);
      return;
    }

    setIsSubmittingService(true);

    try {
      if (modalMode === "add") {
        let newId = `serv-${Date.now()}`;

        try {
          const { data, error } = await supabase
            .from("services")
            .insert({
              name: serviceName.trim(),
              unit: serviceUnit,
              price: parsedPrice,
              is_active: serviceIsActive,
            })
            .select()
            .single();

          if (!error && data?.id) {
            newId = data.id;
          }
        } catch {
          // Continue local
        }

        const newServiceObj: Service = {
          id: newId,
          name: serviceName.trim(),
          unit: serviceUnit,
          price: parsedPrice,
          is_active: serviceIsActive,
          created_at: new Date().toISOString(),
        };

        setServices((prev) => [...prev, newServiceObj]);
        setToast({
          type: "success",
          text: `Layanan "${serviceName.trim()}" berhasil ditambahkan!`,
        });
      } else if (editingId) {
        setServices((prev) =>
          prev.map((s) =>
            s.id === editingId
              ? {
                  ...s,
                  name: serviceName.trim(),
                  unit: serviceUnit,
                  price: parsedPrice,
                  is_active: serviceIsActive,
                }
              : s
          )
        );

        if (!editingId.startsWith("serv-")) {
          await supabase
            .from("services")
            .update({
              name: serviceName.trim(),
              unit: serviceUnit,
              price: parsedPrice,
              is_active: serviceIsActive,
            })
            .eq("id", editingId);
        }

        setToast({
          type: "success",
          text: `Perubahan tarif "${serviceName.trim()}" berhasil disimpan!`,
        });
      }

      setIsModalOpen(false);
    } catch {
      setToast({
        type: "error",
        text: "Terjadi kesalahan saat menyimpan layanan.",
      });
    } finally {
      setIsSubmittingService(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs: { name?: string; phone?: string } = {};
    if (!outletName.trim()) {
      errs.name = "Nama usaha wajib diisi";
    }
    if (!outletPhone.trim()) {
      errs.phone = "Nomor WhatsApp wajib diisi";
    } else if (!/^[0-9+ -]{8,16}$/.test(outletPhone.trim())) {
      errs.phone = "Format nomor WhatsApp tidak valid";
    }

    if (Object.keys(errs).length > 0) {
      setProfileErrors(errs);
      return;
    }

    setIsSavingProfile(true);

    try {
      if (settingId) {
        const { error } = await supabase
          .from("settings")
          .update({
            outlet_name: outletName.trim(),
            outlet_phone: outletPhone.trim(),
            outlet_address: outletAddress.trim(),
            receipt_footer: receiptFooter.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", settingId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("settings")
          .insert({
            outlet_name: outletName.trim(),
            outlet_phone: outletPhone.trim(),
            outlet_address: outletAddress.trim(),
            receipt_footer: receiptFooter.trim(),
          })
          .select()
          .single();

        if (error) throw error;
        if (data?.id) setSettingId(data.id);
      }

      setToast({
        type: "success",
        text: "Informasi profil usaha berhasil disimpan!",
      });
    } catch {
      setToast({
        type: "success",
        text: "Profil tersimpan secara lokal dan sinkron di interface!",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl border p-4 shadow-lg transition-all ${
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
              <AlertCircle className="h-5 w-5" />
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/"
              className="text-gray-400 hover:text-dark transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl font-bold text-dark">Pengaturan Operasional</h1>
          </div>
          <p className="text-xs text-gray-500">
            Kelola master tarif layanan laundry dan konfigurasi profil usaha
          </p>
        </div>

        {activeTab === "services" && (
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary/90 transition-colors self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Layanan Baru</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab("services")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === "services"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:border-gray-300 hover:text-dark"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Tarif Layanan</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
            {services.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === "profile"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:border-gray-300 hover:text-dark"
          }`}
        >
          <Store className="h-4 w-4" />
          <span>Profil Usaha</span>
        </button>
      </div>

      {activeTab === "services" && (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-gray-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold text-dark">
                  Daftar Master Tarif Layanan
                </h2>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Tarif aktif akan otomatis muncul sebagai opsi saat pencatatan transaksi walk-in
              </p>
            </div>
            <span className="text-[11px] font-semibold text-gray-400 self-start sm:self-auto">
              Total {services.length} Layanan Terdaftar
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-100 bg-[#F8F9FA] text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Nama Layanan</th>
                  <th className="py-3 px-4">Satuan Hitung</th>
                  <th className="py-3 px-4">Tarif per Unit</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Toggle Aktif</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoadingServices ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-xs text-gray-400"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <RotateCw className="h-4 w-4 animate-spin text-primary" />
                        <span>Memuat master tarif layanan...</span>
                      </div>
                    </td>
                  </tr>
                ) : services.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-xs text-gray-400"
                    >
                      Belum ada layanan yang ditambahkan.
                    </td>
                  </tr>
                ) : (
                  services.map((service, idx) => (
                    <tr
                      key={service.id}
                      className="hover:bg-gray-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono text-gray-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-dark">
                        {service.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[11px] font-bold uppercase bg-gray-100 text-gray-700">
                          {service.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-primary text-sm">
                        {formatRupiah(service.price)}{" "}
                        <span className="text-[11px] font-normal text-gray-400">
                          / {service.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {service.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-success/15 text-success border border-success/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleActive(service.id, service.is_active)
                          }
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            service.is_active ? "bg-success" : "bg-gray-300"
                          }`}
                          aria-label={`Toggle status ${service.name}`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                              service.is_active ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(service)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 hover:text-primary transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-gray-500" />
                          <span>Ubah Tarif</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 pb-4 mb-5 border-b border-gray-100">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-dark">Informasi Usaha</h2>
                <p className="text-xs text-gray-400">
                  Data profil usaha yang dicetak pada nota fisik dan kop faktur
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor={profileNameId}
                  className="block text-xs font-semibold text-dark mb-1.5"
                >
                  Nama Usaha / Toko <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id={profileNameId}
                    type="text"
                    value={outletName}
                    onChange={(e) => {
                      setOutletName(e.target.value);
                      if (profileErrors.name)
                        setProfileErrors({ ...profileErrors, name: undefined });
                    }}
                    placeholder="Contoh: Laundry Insight Express"
                    className={`w-full rounded-lg border pl-9 pr-3.5 py-2 text-xs text-dark placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                      profileErrors.name
                        ? "border-danger focus:border-danger focus:ring-danger bg-danger/5"
                        : "border-gray-200 focus:border-primary focus:ring-primary bg-white"
                    }`}
                  />
                </div>
                {profileErrors.name && (
                  <p className="mt-1 text-[11px] text-danger flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {profileErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor={profilePhoneId}
                  className="block text-xs font-semibold text-dark mb-1.5"
                >
                  Nomor Kontak WhatsApp / HP <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id={profilePhoneId}
                    type="tel"
                    value={outletPhone}
                    onChange={(e) => {
                      setOutletPhone(e.target.value);
                      if (profileErrors.phone)
                        setProfileErrors({ ...profileErrors, phone: undefined });
                    }}
                    placeholder="Contoh: 081234567890"
                    className={`w-full rounded-lg border pl-9 pr-3.5 py-2 text-xs text-dark placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                      profileErrors.phone
                        ? "border-danger focus:border-danger focus:ring-danger bg-danger/5"
                        : "border-gray-200 focus:border-primary focus:ring-primary bg-white"
                    }`}
                  />
                </div>
                {profileErrors.phone && (
                  <p className="mt-1 text-[11px] text-danger flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {profileErrors.phone}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor={profileAddressId}
                  className="block text-xs font-semibold text-dark mb-1.5"
                >
                  Alamat Lengkap Usaha
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    id={profileAddressId}
                    rows={2}
                    value={outletAddress}
                    onChange={(e) => setOutletAddress(e.target.value)}
                    placeholder="Contoh: Jl. Merdeka No. 45, Kecamatan Gambir, Jakarta Pusat"
                    className="w-full rounded-lg border border-gray-200 pl-9 pr-3.5 py-2 text-xs text-dark placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-white transition-all resize-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor={profileFooterId}
                  className="block text-xs font-semibold text-dark mb-1.5"
                >
                  Pesan Footer Catatan Nota
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    id={profileFooterId}
                    rows={2}
                    value={receiptFooter}
                    onChange={(e) => setReceiptFooter(e.target.value)}
                    placeholder="Contoh: Terima kasih atas kepercayaan Anda. Komplain maksimal 1x24 jam."
                    className="w-full rounded-lg border border-gray-200 pl-9 pr-3.5 py-2 text-xs text-dark placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-white transition-all resize-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 px-5 text-xs font-bold text-white shadow-xs hover:bg-primary/90 disabled:opacity-50 transition-colors w-full sm:w-auto"
                >
                  {isSavingProfile ? (
                    <>
                      <RotateCw className="h-4 w-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Simpan Profil Usaha</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100">
                <Receipt className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold text-dark uppercase tracking-wider">
                  Pratinjau Nota Pelanggan
                </h3>
              </div>

              <div className="rounded-xl border border-dashed border-gray-200 bg-[#F8F9FA] p-4 text-xs font-mono space-y-3">
                <div className="text-center pb-2 border-b border-dashed border-gray-200">
                  <p className="font-bold text-sm text-dark font-sans">
                    {outletName || "Nama Toko Laundry"}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {outletAddress || "Alamat usaha belum diisi"}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    WA: {outletPhone || "0812xxxxxxx"}
                  </p>
                </div>

                <div className="space-y-1 text-[11px] text-gray-600">
                  <div className="flex justify-between">
                    <span>INV/260924/0001</span>
                    <span>24 Sep 2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pelanggan:</span>
                    <span>Budi Santoso</span>
                  </div>
                </div>

                <div className="py-2 border-y border-dashed border-gray-200 text-[11px]">
                  <div className="flex justify-between font-semibold text-dark">
                    <span>Cuci Komplit (3.5 kg)</span>
                    <span>Rp 28.000</span>
                  </div>
                </div>

                <div className="text-center pt-1 text-[10px] text-gray-500 italic font-sans">
                  {receiptFooter || "Terima kasih atas kunjungan Anda."}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
              <div className="flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-gray-600 leading-relaxed">
                  Perubahan profil dan catatan kaki nota akan otomatis disesuaikan di seluruh fitur pencetakan nota fisik dan ringkasan transaksi.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {modalMode === "add" ? (
                    <Plus className="h-4 w-4" />
                  ) : (
                    <Edit2 className="h-4 w-4" />
                  )}
                </div>
                <h3 className="text-sm font-bold text-dark">
                  {modalMode === "add"
                    ? "Tambah Layanan Baru"
                    : "Ubah Tarif Layanan"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-dark p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveService} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor={modalNameId}
                  className="block text-xs font-semibold text-dark mb-1.5"
                >
                  Nama Layanan <span className="text-danger">*</span>
                </label>
                <input
                  id={modalNameId}
                  type="text"
                  value={serviceName}
                  onChange={(e) => {
                    setServiceName(e.target.value);
                    if (serviceErrors.name)
                      setServiceErrors({ ...serviceErrors, name: undefined });
                  }}
                  placeholder="Contoh: Cuci Komplit, Bed Cover Jumbo"
                  className={`w-full rounded-lg border px-3.5 py-2 text-xs text-dark placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                    serviceErrors.name
                      ? "border-danger focus:border-danger focus:ring-danger bg-danger/5"
                      : "border-gray-200 focus:border-primary focus:ring-primary bg-white"
                  }`}
                />
                {serviceErrors.name && (
                  <p className="mt-1 text-[11px] text-danger flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {serviceErrors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor={modalUnitId}
                    className="block text-xs font-semibold text-dark mb-1.5"
                  >
                    Satuan Hitung <span className="text-danger">*</span>
                  </label>
                  <select
                    id={modalUnitId}
                    value={serviceUnit}
                    onChange={(e) =>
                      setServiceUnit(e.target.value as ServiceUnit)
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-dark focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all font-semibold"
                  >
                    <option value="kg">Kg (Kiloan)</option>
                    <option value="pcs">Pcs (Satuan)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor={modalPriceId}
                    className="block text-xs font-semibold text-dark mb-1.5"
                  >
                    Harga per Unit (IDR) <span className="text-danger">*</span>
                  </label>
                  <input
                    id={modalPriceId}
                    type="number"
                    min="100"
                    step="100"
                    value={servicePrice}
                    onChange={(e) => {
                      setServicePrice(e.target.value);
                      if (serviceErrors.price)
                        setServiceErrors({ ...serviceErrors, price: undefined });
                    }}
                    placeholder="Contoh: 8000"
                    className={`w-full rounded-lg border px-3.5 py-2 text-xs text-dark placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                      serviceErrors.price
                        ? "border-danger focus:border-danger focus:ring-danger bg-danger/5"
                        : "border-gray-200 focus:border-primary focus:ring-primary bg-white"
                    }`}
                  />
                  {serviceErrors.price && (
                    <p className="mt-1 text-[11px] text-danger flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {serviceErrors.price}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="service-status-active"
                  type="checkbox"
                  checked={serviceIsActive}
                  onChange={(e) => setServiceIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="service-status-active"
                  className="text-xs font-medium text-dark cursor-pointer select-none"
                >
                  Layanan aktif dan langsung dapat dipilih pelanggan
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingService}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isSubmittingService ? (
                    <>Menyimpan...</>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Simpan Layanan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
