"use client";

import { useState, useEffect, useRef, useId, useMemo } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  ArrowLeft,
  AlertTriangle,
  FileText,
  Trash2,
  Calendar,
  Check,
  X,
  Database,
  CheckCircle2,
  Loader2,
  Filter,
} from "lucide-react";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { supabase } from "@/lib/supabase/client";
import type { Service, PaymentMethod, Category } from "@/types";

export interface ParsedRow {
  namaPelanggan: string;
  nomorHp: string;
  kategori: string;
  layanan: string;
  berat: number;
  total: number;
  tanggal: string;
  statusBayar: string;
  metodeBayar: string;
  resolvedPaymentName: string;
  isPaymentDefaulted: boolean;
  isValid: boolean;
  errors: string[];
}

const defaultPaymentMethods: PaymentMethod[] = [
  {
    id: "pm-1",
    name: "Cash",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "pm-2",
    name: "Transfer Bank",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "pm-3",
    name: "QRIS",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "pm-4",
    name: "E-Wallet",
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

export default function ImportTransactionsPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [filterTab, setFilterTab] = useState<"all" | "valid" | "invalid">("all");
  const [paymentMethods, setPaymentMethods] =
    useState<PaymentMethod[]>(defaultPaymentMethods);

  const [saveProgress, setSaveProgress] = useState<{
    current: number;
    total: number;
    stage: string;
  } | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadPaymentMethods() {
      try {
        const { data } = await supabase
          .from("payment_methods")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: true });

        if (data && data.length > 0) {
          setPaymentMethods(data as PaymentMethod[]);
        }
      } catch {
        // Use defaultPaymentMethods
      }
    }
    loadPaymentMethods();
  }, []);

  const validRows = useMemo(
    () => parsedRows.filter((r) => r.isValid),
    [parsedRows]
  );
  const invalidRows = useMemo(
    () => parsedRows.filter((r) => !r.isValid),
    [parsedRows]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatRupiah = (val: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);
  };

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      const [categoriesRes, servicesRes, paymentsRes] = await Promise.all([
        supabase
          .from("categories")
          .select("name")
          .eq("is_active", true)
          .order("name", { ascending: true }),
        supabase
          .from("services")
          .select("name")
          .eq("is_active", true)
          .order("name", { ascending: true }),
        supabase
          .from("payment_methods")
          .select("name")
          .eq("is_active", true)
          .order("created_at", { ascending: true }),
      ]);

      const categoriesList = (categoriesRes.data || [])
        .map((c: { name: string }) => c.name.trim())
        .filter(Boolean);
      const servicesList = (servicesRes.data || [])
        .map((s: { name: string }) => s.name.trim())
        .filter(Boolean);
      const paymentsList = (paymentsRes.data || [])
        .map((p: { name: string }) => p.name.trim())
        .filter(Boolean);
      const statusBayarList = ["Lunas", "Belum Lunas"];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Template Transaksi");

      worksheet.columns = [
        { header: "Nama Pelanggan", key: "nama", width: 22 },
        { header: "Nomor HP", key: "hp", width: 18 },
        { header: "Kategori", key: "kategori", width: 16 },
        { header: "Layanan", key: "layanan", width: 18 },
        { header: "Berat", key: "berat", width: 10 },
        { header: "Total", key: "total", width: 14 },
        { header: "Tanggal", key: "tanggal", width: 14 },
        { header: "Status Bayar", key: "status_bayar", width: 16 },
        { header: "Metode Pembayaran", key: "metode_bayar", width: 20 },
      ];

      // Make header row bold
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };

      const categoryValidation =
        categoriesList.length > 0
          ? {
              type: "list" as const,
              allowBlank: true,
              formulae: [`"${categoriesList.join(",")}"`],
            }
          : null;

      const serviceValidation =
        servicesList.length > 0
          ? {
              type: "list" as const,
              allowBlank: true,
              formulae: [`"${servicesList.join(",")}"`],
            }
          : null;

      const statusValidation = {
        type: "list" as const,
        allowBlank: true,
        formulae: [`"${statusBayarList.join(",")}"`],
      };

      const paymentValidation =
        paymentsList.length > 0
          ? {
              type: "list" as const,
              allowBlank: true,
              formulae: [`"${paymentsList.join(",")}"`],
            }
          : null;

      for (let r = 2; r <= 500; r++) {
        const row = worksheet.getRow(r);
        if (categoryValidation) {
          row.getCell(3).dataValidation = categoryValidation;
        }
        if (serviceValidation) {
          row.getCell(4).dataValidation = serviceValidation;
        }
        if (statusValidation) {
          row.getCell(8).dataValidation = statusValidation;
        }
        if (paymentValidation) {
          row.getCell(9).dataValidation = paymentValidation;
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "template_transaksi_laundry.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal mengunduh template.";
      setErrorMessage(`Gagal men-generate template: ${msg}`);
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const parseFile = (file: File) => {
    const validExtensions = [".xlsx", ".xls", ".csv"];
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!validExtensions.includes(fileExt)) {
      setErrorMessage(
        "Format file tidak didukung. Harap upload file .xlsx, .xls, atau .csv"
      );
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);
    setFileName(file.name);
    setFileSize(formatFileSize(file.size));
    setSavedCount(null);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: Record<string, unknown>[] = XLSX.utils.sheet_to_json(
          worksheet,
          { defval: "" }
        );

        if (!rawJson || rawJson.length === 0) {
          setErrorMessage("File kosong atau tidak memiliki baris data.");
          setParsedRows([]);
          setIsProcessing(false);
          return;
        }

        const activePMs =
          paymentMethods.length > 0 ? paymentMethods : defaultPaymentMethods;
        const defaultPM = activePMs[0];

        const normalized: ParsedRow[] = rawJson.map((row) => {
          const findKey = (candidates: string[]): string => {
            const keys = Object.keys(row);
            const found = keys.find((k) =>
              candidates.includes(k.trim().toLowerCase())
            );
            return found ? String(row[found]).trim() : "";
          };

          const nama = findKey([
            "nama pelanggan",
            "nama",
            "pelanggan",
            "customer",
            "customer name",
          ]);
          const hp = findKey([
            "nomor hp",
            "no hp",
            "telepon",
            "phone",
            "whatsapp",
            "no. hp",
          ]);
          const kategoriRaw = findKey([
            "kategori",
            "category",
            ...(findKey(["layanan", "nama layanan", "paket", "service"])
              ? ["jenis layanan"]
              : []),
          ]);
          const layanan = findKey([
            "layanan",
            "nama layanan",
            "paket",
            "service",
            ...(!findKey(["kategori", "category"]) ? ["jenis layanan"] : []),
          ]);
          const beratRaw = findKey(["berat", "qty", "kuantitas", "weight"]);
          const totalRaw = findKey(["total", "biaya", "harga", "grand total"]);
          const tanggalRaw = findKey(["tanggal", "date", "tgl"]);
          const statusBayarRaw = findKey([
            "status bayar",
            "status pembayaran",
            "status",
            "payment status",
          ]);
          const metodeBayarRaw = findKey([
            "metode pembayaran",
            "metode bayar",
            "payment method",
            "metode_pembayaran",
            "metode_bayar",
            "payment_method",
            "cara bayar",
          ]);

          const berat = parseFloat(beratRaw) || 0;
          const total = parseFloat(totalRaw.replace(/[^0-9.-]+/g, "")) || 0;
          const statusBayar =
            statusBayarRaw.toLowerCase() === "lunas" ||
            statusBayarRaw.toLowerCase() === "paid"
              ? "Lunas"
              : "Belum Lunas";

          // Match payment method
          const matchedPM = activePMs.find(
            (p) =>
              metodeBayarRaw &&
              (p.name.toLowerCase().includes(metodeBayarRaw.toLowerCase()) ||
                metodeBayarRaw.toLowerCase().includes(p.name.toLowerCase()))
          );

          const resolvedPaymentName = matchedPM
            ? matchedPM.name
            : defaultPM.name;
          const isPaymentDefaulted = !matchedPM;

          const errors: string[] = [];
          if (!nama) errors.push("Nama pelanggan kosong");
          if (!hp) {
            errors.push("Nomor HP kosong");
          } else if (!/^[0-9+ -]{8,16}$/.test(hp)) {
            errors.push("Format nomor HP tidak valid");
          }
          if (!layanan) errors.push("Layanan kosong");
          if (berat <= 0) errors.push("Berat/Qty harus > 0");
          if (total <= 0) errors.push("Total biaya harus > 0");

          return {
            namaPelanggan: nama,
            nomorHp: hp,
            kategori: kategoriRaw,
            layanan: layanan || "-",
            berat,
            total,
            tanggal: tanggalRaw || new Date().toISOString().split("T")[0],
            statusBayar,
            metodeBayar: metodeBayarRaw,
            resolvedPaymentName,
            isPaymentDefaulted,
            isValid: errors.length === 0,
            errors,
          };
        });

        setParsedRows(normalized);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gagal memproses file.";
        setErrorMessage(`Terjadi kesalahan saat membaca spreadsheet: ${msg}`);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorMessage("Gagal membaca file dari komputer Anda.");
      setIsProcessing(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      parseFile(file);
    }
  };

  const handleClear = () => {
    setFileName(null);
    setFileSize(null);
    setParsedRows([]);
    setErrorMessage(null);
    setSavedCount(null);
    setSaveProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleBatchSave = async () => {
    if (validRows.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setSaveProgress({
      current: 0,
      total: validRows.length,
      stage: "Menyiapkan master layanan dan metode pembayaran...",
    });

    try {
      let activeServices: Service[] = [];
      let activePaymentMethods: PaymentMethod[] = [];
      let activeCategories: Category[] = [];

      const [servicesRes, paymentsRes, categoriesRes] = await Promise.all([
        supabase.from("services").select("*").eq("is_active", true),
        supabase
          .from("payment_methods")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: true }),
        supabase.from("categories").select("*").eq("is_active", true),
      ]);

      if (servicesRes.data && servicesRes.data.length > 0) {
        activeServices = servicesRes.data as Service[];
      } else {
        activeServices = [
          {
            id: "serv-1",
            name: "Cuci Komplit",
            unit: "kg",
            price: 8000,
            is_active: true,
            created_at: new Date().toISOString(),
          },
        ];
      }

      if (paymentsRes.data && paymentsRes.data.length > 0) {
        activePaymentMethods = paymentsRes.data as PaymentMethod[];
      } else if (paymentMethods.length > 0) {
        activePaymentMethods = paymentMethods;
      } else {
        activePaymentMethods = defaultPaymentMethods;
      }

      if (categoriesRes.data && categoriesRes.data.length > 0) {
        activeCategories = categoriesRes.data as Category[];
      }

      setSaveProgress({
        current: 0,
        total: validRows.length,
        stage: "Menyelaraskan data pelanggan...",
      });

      const uniquePhones = Array.from(
        new Set(validRows.map((r) => r.nomorHp.trim()))
      );

      const customerMap = new Map<string, string>();

      const { data: existingCustomers } = await supabase
        .from("customers")
        .select("id, phone")
        .in("phone", uniquePhones);

      existingCustomers?.forEach((c) => {
        if (c.phone) customerMap.set(c.phone, c.id);
      });

      const newCustomersToInsert = uniquePhones
        .filter((phone) => !customerMap.has(phone))
        .map((phone) => {
          const match = validRows.find((r) => r.nomorHp.trim() === phone);
          return {
            name: match ? match.namaPelanggan : "Pelanggan",
            phone,
          };
        });

      if (newCustomersToInsert.length > 0) {
        const { data: inserted, error: insertCustErr } = await supabase
          .from("customers")
          .insert(newCustomersToInsert)
          .select("id, phone");

        if (insertCustErr) throw insertCustErr;

        inserted?.forEach((c) => {
          if (c.phone) customerMap.set(c.phone, c.id);
        });
      }

      const CHUNK_SIZE = 5;
      let insertedCount = 0;
      const reservedInvoices = new Set<string>();

      const getUniqueInvoiceForBatch = async (): Promise<string> => {
        let candidate = generateInvoice();
        const maxRetries = 3;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          if (!reservedInvoices.has(candidate)) {
            const { data: existingTx, error: checkError } = await supabase
              .from("transactions")
              .select("id")
              .eq("invoice", candidate)
              .maybeSingle();

            if (checkError) throw checkError;

            if (!existingTx && !reservedInvoices.has(candidate)) {
              reservedInvoices.add(candidate);
              return candidate;
            }
          }

          if (attempt < maxRetries) {
            candidate = generateInvoice();
          }
        }

        throw new Error(
          "Nomor nota bentrok dan gagal mendapatkan nomor unik setelah 3 kali percobaan."
        );
      };

      for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
        const chunk = validRows.slice(i, i + CHUNK_SIZE);

        await Promise.all(
          chunk.map(async (row) => {
            const customerId = customerMap.get(row.nomorHp.trim());
            if (!customerId) return;

            // Match service with optional category prioritization
            let matchedService: Service | undefined;

            if (row.kategori && row.kategori.trim()) {
              const normKategori = row.kategori.trim().toLowerCase();
              const matchedCategory = activeCategories.find(
                (c) =>
                  c.name.toLowerCase().includes(normKategori) ||
                  normKategori.includes(c.name.toLowerCase())
              );

              if (matchedCategory) {
                const servicesInCategory = activeServices.filter(
                  (s) => s.category_id === matchedCategory.id
                );
                matchedService = servicesInCategory.find(
                  (s) =>
                    s.name.toLowerCase().includes(row.layanan.toLowerCase()) ||
                    row.layanan.toLowerCase().includes(s.name.toLowerCase())
                );
              }
            }

            // Fallback to matching by service name across all services
            if (!matchedService) {
              matchedService = activeServices.find(
                (s) =>
                  s.name.toLowerCase().includes(row.layanan.toLowerCase()) ||
                  row.layanan.toLowerCase().includes(s.name.toLowerCase())
              );
            }

            const finalService = matchedService || activeServices[0];

            const matchedPayment =
              activePaymentMethods.find(
                (p) =>
                  row.metodeBayar &&
                  (p.name.toLowerCase().includes(row.metodeBayar.toLowerCase()) ||
                    row.metodeBayar.toLowerCase().includes(p.name.toLowerCase()))
              ) || activePaymentMethods[0];

            const inv = await getUniqueInvoiceForBatch();
            const pStatus = row.statusBayar === "Lunas" ? "paid" : "unpaid";

            let rowDateIso = new Date().toISOString();
            try {
              const d = new Date(row.tanggal);
              if (!isNaN(d.getTime())) {
                rowDateIso = d.toISOString();
              }
            } catch {
              // fallback to current date
            }

            const { error: rpcErr } = await supabase.rpc(
              "create_transaction_with_item",
              {
                p_invoice: inv,
                p_customer_id: customerId,
                p_total_weight: row.berat,
                p_total_amount: row.total,
                p_payment_status: pStatus,
                p_payment_method_id: matchedPayment?.id || null,
                p_order_status: "pending",
                p_notes: "Import Batch Spreadsheet",
                p_created_at: rowDateIso,
                p_service_id: finalService ? finalService.id : null,
                p_qty: row.berat,
                p_subtotal: row.total,
              }
            );

            if (rpcErr) throw rpcErr;
            insertedCount++;
          })
        );

        setSaveProgress({
          current: Math.min(insertedCount, validRows.length),
          total: validRows.length,
          stage: `Menyimpan transaksi ${Math.min(
            insertedCount,
            validRows.length
          )} dari ${validRows.length}...`,
        });
      }

      setSavedCount(insertedCount);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan batch.";
      setErrorMessage(`Terjadi kesalahan saat batch insert: ${msg}`);
    } finally {
      setIsProcessing(false);
      setSaveProgress(null);
    }
  };

  const displayedRows = useMemo(() => {
    if (filterTab === "valid") return validRows;
    if (filterTab === "invalid") return invalidRows;
    return parsedRows;
  }, [filterTab, parsedRows, validRows, invalidRows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/"
              className="text-gray-400 hover:text-dark transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl font-bold text-dark">Import Batch Transaksi</h1>
          </div>
          <p className="text-xs text-gray-500">
            Upload spreadsheet Excel (.xlsx, .xls) atau CSV untuk mengekstrak dan
            menyimpan data transaksi secara batch
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadTemplate}
          disabled={isDownloadingTemplate}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-dark shadow-xs hover:bg-gray-50 hover:border-primary/40 disabled:opacity-50 transition-all self-start sm:self-auto"
        >
          {isDownloadingTemplate ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Menyiapkan Template...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4 text-primary" />
              <span>Unduh Template Excel</span>
            </>
          )}
        </button>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4 text-xs text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {savedCount !== null && (
        <div className="rounded-xl border border-success/30 bg-success/10 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success text-white shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-dark">
                  Batch Simpan Berhasil!
                </h3>
                <p className="text-xs text-gray-600">
                  Sebanyak <span className="font-bold text-dark">{savedCount}</span>{" "}
                  data transaksi valid berhasil disimpan ke database Supabase.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg bg-white border border-gray-200 px-3.5 py-2 text-xs font-semibold text-dark shadow-xs hover:bg-gray-50 transition-colors"
              >
                Upload File Lain
              </button>
              <Link
                href="/"
                className="rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 transition-colors"
              >
                Kembali ke Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {!fileName ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-primary bg-primary/5 scale-[1.005]"
              : "border-gray-200 bg-white hover:border-primary/50 hover:bg-gray-50/50"
          }`}
        >
          <input
            id={fileInputId}
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 shadow-xs">
            <UploadCloud className="h-7 w-7" />
          </div>
          <h3 className="text-sm font-bold text-dark mb-1">
            Klik untuk memilih file atau drag & drop ke sini
          </h3>
          <p className="text-xs text-gray-500 mb-4 max-w-sm">
            Mendukung format spreadsheet <span className="font-semibold text-dark">.xlsx</span>,{" "}
            <span className="font-semibold text-dark">.xls</span>, dan{" "}
            <span className="font-semibold text-dark">.csv</span>
          </p>
          <div className="flex items-center gap-4 text-[11px] text-gray-400">
            <span>Maksimal 10 MB</span>
            <span>•</span>
            <span>Parsing langsung di browser</span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-dark">{fileName}</h3>
                <p className="text-[11px] text-gray-400">
                  {fileSize} • {parsedRows.length} baris terdeteksi
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleClear}
                disabled={isProcessing}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-danger hover:border-danger/30 hover:bg-danger/5 disabled:opacity-50 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Ganti File
              </button>

              <button
                type="button"
                onClick={handleBatchSave}
                disabled={isProcessing || validRows.length === 0}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4" />
                    Simpan Data Valid ({validRows.length})
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 py-4">
            <div className="rounded-lg bg-dashboard p-3 border border-gray-100 text-center">
              <span className="text-[11px] text-gray-500">Total Baris</span>
              <p className="text-base font-bold text-dark">{parsedRows.length}</p>
            </div>
            <div className="rounded-lg bg-success/5 p-3 border border-success/20 text-center">
              <span className="text-[11px] text-success font-medium">
                Baris Valid
              </span>
              <p className="text-base font-bold text-success">
                {validRows.length}
              </p>
            </div>
            <div className="rounded-lg bg-danger/5 p-3 border border-danger/20 text-center">
              <span className="text-[11px] text-danger font-medium">
                Baris Error
              </span>
              <p className="text-base font-bold text-danger">
                {invalidRows.length}
              </p>
            </div>
          </div>

          {saveProgress && (
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-dark">{saveProgress.stage}</span>
                <span className="font-bold text-primary">
                  {Math.round((saveProgress.current / saveProgress.total) * 100)}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{
                    width: `${Math.round(
                      (saveProgress.current / saveProgress.total) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {fileName && isProcessing && parsedRows.length === 0 && (
        <div className="rounded-xl border border-gray-200/80 bg-white shadow-xs overflow-hidden animate-pulse">
          <div className="p-4 border-b border-gray-100 bg-[#F8F9FA] flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-4 w-48 bg-gray-200 rounded"></div>
              <div className="h-3 w-64 bg-gray-100 rounded"></div>
            </div>
            <div className="h-7 w-28 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="p-4 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-2 border-b border-gray-100">
                <div className="h-3.5 w-6 bg-gray-200 rounded"></div>
                <div className="h-3.5 w-28 bg-gray-200 rounded"></div>
                <div className="h-3.5 w-24 bg-gray-200 rounded"></div>
                <div className="h-3.5 w-20 bg-gray-100 rounded"></div>
                <div className="h-3.5 w-16 bg-gray-100 rounded"></div>
                <div className="h-3.5 w-20 bg-gray-200 rounded"></div>
                <div className="h-3.5 w-16 bg-gray-100 rounded"></div>
                <div className="h-5 w-14 bg-gray-200 rounded-full"></div>
                <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {parsedRows.length > 0 && !saveProgress && (
        <div className="rounded-xl border border-gray-200/80 bg-white shadow-xs overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-gray-100 bg-[#F8F9FA] gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="text-xs font-bold text-dark uppercase tracking-wider">
                  Pratinjau Data Ekstraksi ({parsedRows.length} Baris)
                </h2>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Pastikan kolom data sudah sesuai. Baris dengan metode bayar kosong/tidak cocok otomatis menggunakan metode default.
              </p>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white p-1 rounded-lg border border-gray-200 text-xs">
              <Filter className="h-3.5 w-3.5 text-gray-400 ml-1.5" />
              <button
                type="button"
                onClick={() => setFilterTab("all")}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                  filterTab === "all"
                    ? "bg-dark text-white"
                    : "text-gray-600 hover:text-dark"
                }`}
              >
                Semua ({parsedRows.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("valid")}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                  filterTab === "valid"
                    ? "bg-success text-white"
                    : "text-gray-600 hover:text-success"
                }`}
              >
                Valid ({validRows.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("invalid")}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                  filterTab === "invalid"
                    ? "bg-danger text-white"
                    : "text-gray-600 hover:text-danger"
                }`}
              >
                Error ({invalidRows.length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto min-w-full max-h-[480px]">
            <table className="w-full text-left text-xs min-w-[1000px]">
              <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 text-[11px] font-bold text-dark uppercase shadow-xs">
                <tr>
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Nama Pelanggan</th>
                  <th className="py-3 px-4">Nomor HP</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Layanan</th>
                  <th className="py-3 px-4">Berat/Qty</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Status Bayar</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4 text-center">Status / Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      !row.isValid
                        ? "bg-danger/5 border-l-4 border-l-danger hover:bg-danger/10"
                        : "hover:bg-gray-50/60"
                    }`}
                  >
                    <td className="py-3 px-4 font-mono text-gray-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-dark">
                      {row.namaPelanggan ? (
                        row.namaPelanggan
                      ) : (
                        <span className="text-danger italic font-semibold">
                          [Nama Kosong]
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {!row.nomorHp ? (
                        <span className="text-danger italic font-semibold">
                          [HP Kosong]
                        </span>
                      ) : !/^[0-9+ -]{8,16}$/.test(row.nomorHp) ? (
                        <span className="text-danger font-semibold flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          {row.nomorHp}
                        </span>
                      ) : (
                        <span className="text-gray-600">{row.nomorHp}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {row.kategori ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                          {row.kategori}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {row.layanan && row.layanan !== "-" ? (
                        <span className="text-gray-700">{row.layanan}</span>
                      ) : (
                        <span className="text-danger italic font-semibold">
                          [Layanan Kosong]
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {row.berat > 0 ? (
                        <span className="text-gray-700">{row.berat} kg</span>
                      ) : (
                        <span className="text-danger font-bold bg-danger/10 px-1.5 py-0.5 rounded">
                          0 kg
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {row.total > 0 ? (
                        <span className="text-dark">{formatRupiah(row.total)}</span>
                      ) : (
                        <span className="text-danger font-bold bg-danger/10 px-1.5 py-0.5 rounded">
                          Rp 0
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span>{row.tanggal}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.statusBayar === "Lunas"
                            ? "bg-success/10 text-success"
                            : "bg-warning/10 text-warning"
                        }`}
                      >
                        {row.statusBayar}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5 items-start">
                        <span className="font-semibold text-dark">
                          {row.resolvedPaymentName}
                        </span>
                        {row.isPaymentDefaulted && (
                          <span
                            title="Metode pembayaran tidak dicantumkan atau tidak cocok, otomatis menggunakan default"
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-warning/15 text-[#c2841d] border border-warning/30"
                          >
                            Default
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.isValid ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span
                            title="Baris valid"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-success/15 text-success"
                          >
                            <Check className="h-3 w-3" />
                            Valid
                          </span>
                          {row.isPaymentDefaulted && (
                            <span className="text-[9px] text-gray-400">
                              (Metode default)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span
                          title={row.errors.join(", ")}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-danger/15 text-danger"
                        >
                          <X className="h-3 w-3" />
                          {row.errors[0]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
