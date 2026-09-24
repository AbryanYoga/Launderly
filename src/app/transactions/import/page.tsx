"use client";

import { useState, useRef, useId } from "react";
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
} from "lucide-react";
import * as XLSX from "xlsx";

export interface ParsedRow {
  namaPelanggan: string;
  nomorHp: string;
  layanan: string;
  berat: number;
  total: number;
  tanggal: string;
  statusBayar: string;
  isValid: boolean;
  errors: string[];
}

export default function ImportTransactionsPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Nama Pelanggan": "Budi Santoso",
        "Nomor HP": "081234567891",
        "Layanan": "Cuci Komplit",
        "Berat": 3.5,
        "Total": 28000,
        "Tanggal": new Date().toISOString().split("T")[0],
        "Status Bayar": "Lunas",
      },
      {
        "Nama Pelanggan": "Siti Rahma",
        "Nomor HP": "085678901234",
        "Layanan": "Cuci Kering",
        "Berat": 2,
        "Total": 12000,
        "Tanggal": new Date().toISOString().split("T")[0],
        "Status Bayar": "Belum Lunas",
      },
      {
        "Nama Pelanggan": "Ahmad Dani",
        "Nomor HP": "081987654321",
        "Layanan": "Bed Cover",
        "Berat": 1,
        "Total": 25000,
        "Tanggal": new Date().toISOString().split("T")[0],
        "Status Bayar": "Lunas",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Transaksi");

    worksheet["!cols"] = [
      { wch: 22 },
      { wch: 18 },
      { wch: 16 },
      { wch: 10 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
    ];

    XLSX.writeFile(workbook, "template_transaksi_laundry.xlsx");
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

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: "",
        });

        if (!rawJson || rawJson.length === 0) {
          setErrorMessage("File kosong atau tidak memiliki baris data.");
          setParsedRows([]);
          setIsProcessing(false);
          return;
        }

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
          const layanan = findKey([
            "layanan",
            "paket",
            "service",
            "jenis layanan",
          ]);
          const beratRaw = findKey(["berat", "qty", "kuantitas", "weight"]);
          const totalRaw = findKey(["total", "biaya", "harga", "grand total"]);
          const tanggalRaw = findKey(["tanggal", "date", "tgl"]);
          const statusBayarRaw = findKey([
            "status bayar",
            "status",
            "payment",
            "payment status",
          ]);

          const berat = parseFloat(beratRaw) || 0;
          const total = parseFloat(totalRaw.replace(/[^0-9.-]+/g, "")) || 0;
          const statusBayar =
            statusBayarRaw.toLowerCase() === "lunas" ||
            statusBayarRaw.toLowerCase() === "paid"
              ? "Lunas"
              : "Belum Lunas";

          const errors: string[] = [];
          if (!nama) errors.push("Nama pelanggan kosong");
          if (!hp) errors.push("Nomor HP kosong");
          if (!layanan) errors.push("Layanan kosong");
          if (berat <= 0) errors.push("Berat/Qty harus > 0");
          if (total <= 0) errors.push("Total biaya harus > 0");

          return {
            namaPelanggan: nama,
            nomorHp: hp,
            layanan: layanan || "-",
            berat,
            total,
            tanggal: tanggalRaw || new Date().toISOString().split("T")[0],
            statusBayar,
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

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
            Upload spreadsheet Excel (.xlsx, .xls) atau CSV untuk mengekstrak data pesanan
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-dark shadow-xs hover:bg-gray-50 hover:border-primary/40 transition-all self-start sm:self-auto"
        >
          <Download className="h-4 w-4 text-primary" />
          Unduh Template Excel
        </button>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4 text-xs text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
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

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-danger hover:border-danger/30 hover:bg-danger/5 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Ganti File
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 py-4">
            <div className="rounded-lg bg-dashboard p-3 border border-gray-100 text-center">
              <span className="text-[11px] text-gray-500">Total Baris</span>
              <p className="text-base font-bold text-dark">{parsedRows.length}</p>
            </div>
            <div className="rounded-lg bg-success/5 p-3 border border-success/20 text-center">
              <span className="text-[11px] text-success font-medium">Baris Valid</span>
              <p className="text-base font-bold text-success">{validCount}</p>
            </div>
            <div className="rounded-lg bg-danger/5 p-3 border border-danger/20 text-center">
              <span className="text-[11px] text-danger font-medium">Perlu Koreksi</span>
              <p className="text-base font-bold text-danger">{invalidCount}</p>
            </div>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="flex items-center justify-center p-8 bg-white rounded-xl border border-gray-200/80">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <span>Sedang membaca dan memvalidasi spreadsheet...</span>
          </div>
        </div>
      )}

      {parsedRows.length > 0 && !isProcessing && (
        <div className="rounded-xl border border-gray-200/80 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-[#F8F9FA]">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-bold text-dark uppercase tracking-wider">
                Pratinjau Data Ekstraksi ({parsedRows.length} Baris)
              </h2>
            </div>
            {invalidCount > 0 && (
              <span className="text-[11px] font-semibold text-danger flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {invalidCount} baris memiliki kolom yang kosong/tidak valid
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50/70 text-[11px] font-bold text-dark uppercase">
                <tr>
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Nama Pelanggan</th>
                  <th className="py-3 px-4">Nomor HP</th>
                  <th className="py-3 px-4">Layanan</th>
                  <th className="py-3 px-4">Berat/Qty</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Status Bayar</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parsedRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      !row.isValid
                        ? "bg-danger/5 hover:bg-danger/10"
                        : "hover:bg-gray-50/60"
                    }`}
                  >
                    <td className="py-3 px-4 font-mono text-gray-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-dark">
                      {row.namaPelanggan || (
                        <span className="text-danger italic text-[11px]">
                          [Kosong]
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600">
                      {row.nomorHp || (
                        <span className="text-danger italic text-[11px]">
                          [Kosong]
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-700">{row.layanan}</td>
                    <td className="py-3 px-4 text-gray-700">
                      {row.berat > 0 ? (
                        `${row.berat} kg`
                      ) : (
                        <span className="text-danger font-semibold">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-dark">
                      {row.total > 0 ? (
                        formatRupiah(row.total)
                      ) : (
                        <span className="text-danger font-semibold">0</span>
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
                    <td className="py-3 px-4 text-center">
                      {row.isValid ? (
                        <span
                          title="Baris valid"
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-success"
                        >
                          <Check className="h-3 w-3" />
                        </span>
                      ) : (
                        <span
                          title={row.errors.join(", ")}
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-danger/15 text-danger cursor-help"
                        >
                          <X className="h-3 w-3" />
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
