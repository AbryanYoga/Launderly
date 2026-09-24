export default function Home() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dark">Dashboard Overview</h1>
          <p className="text-xs text-gray-500">
            Selamat datang di panel operasional Laundry Insight
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white font-bold text-lg">
            LI
          </div>
          <div>
            <h2 className="text-base font-semibold text-dark">Dashboard Shell Siap</h2>
            <p className="text-xs text-gray-500">
              Navigasi Skote, Breadcrumb dinamis, dan layout wrapper telah aktif.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg bg-dashboard p-4 border border-gray-100">
            <span className="text-xs text-gray-500 font-medium">Tema Visual</span>
            <div className="flex items-center gap-2 mt-2">
              <span className="h-3 w-3 rounded bg-sidebar" title="Sidebar/Dark (#2A3042)"></span>
              <span className="h-3 w-3 rounded bg-primary" title="Primary (#0284C7)"></span>
              <span className="h-3 w-3 rounded bg-success" title="Success (#34C38F)"></span>
              <span className="h-3 w-3 rounded bg-warning" title="Warning (#F1B44C)"></span>
              <span className="h-3 w-3 rounded bg-danger" title="Danger (#F46A6A)"></span>
              <span className="text-xs text-gray-600 font-medium ml-1">Skote Navy & Slate</span>
            </div>
          </div>
          <div className="rounded-lg bg-dashboard p-4 border border-gray-100">
            <span className="text-xs text-gray-500 font-medium">Status Integrasi</span>
            <div className="flex items-center gap-2 mt-2">
              <span className="h-2.5 w-2.5 rounded-full bg-success"></span>
              <span className="text-xs font-semibold text-dark">Supabase Client & DDL Migrations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
