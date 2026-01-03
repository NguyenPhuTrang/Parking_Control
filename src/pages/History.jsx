import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/layout/AppShell";
import api from "../api/interceptor";

function buildDateRange(range) {
  const now = new Date();
  const to = now.toISOString();
  let from = null;

  if (range === "TODAY") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    from = start.toISOString();
  } else if (range === "7D") {
    const start = new Date();
    start.setDate(start.getDate() - 7);
    from = start.toISOString();
  } else if (range === "30D") {
    const start = new Date();
    start.setDate(start.getDate() - 30);
    from = start.toISOString();
  }

  return { from, to };
}

function getCheckerName(checkedBy) {
  if (checkedBy && typeof checkedBy === "object") {
    return checkedBy.username || checkedBy._id || "-";
  }
  return checkedBy || "-";
}

export default function History() {
  const [range, setRange] = useState("TODAY");
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("ALL");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;
  const limitServer = 1000;

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { from, to } = buildDateRange(range);

      const res = await api.get("/history", {
        params: {
          page: 1,
          limit: limitServer,
          search: search || undefined,
          from,
          to,
          source: source === "ALL" ? undefined : source,
        },
      });

      setItems(res.data.items || []);
      setCurrentPage(1);
    } catch (err) {
      console.error("Load history failed", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [range, source]);

  useEffect(() => {
    const t = setTimeout(() => fetchHistory(), 400);
    return () => clearTimeout(t);
  }, [search]);

  const totalPages = Math.ceil(items.length / rowsPerPage);

  const displayRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return items.slice(start, start + rowsPerPage);
  }, [items, currentPage]);

  function ResultBadge({ isAllowed }) {
    return isAllowed ? (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold text-xs">
        ✓ ALLOWED
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold text-xs">
        ✕ DENIED
      </span>
    );
  }

  return (
    <AppShell title="Check History">
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
            {[
              { key: "TODAY", label: "Today" },
              { key: "7D", label: "Last 7 Days" },
              { key: "30D", label: "Last 30 Days" },
            ].map((x) => (
              <button
                key={x.key}
                onClick={() => setRange(x.key)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors text-center ${range === x.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
              >
                {x.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="border rounded-xl px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="ALL">All Sources</option>
              <option value="MANUAL">Manual Input</option>
              <option value="OCR">OCR Scan</option>
            </select>

            <input
              className="border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Search by plate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border mt-6 overflow-hidden">
        <div className="md:hidden">
          {loading ? (
            <div className="px-6 py-10 text-center text-gray-500">Loading data...</div>
          ) : displayRows.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-500">No records found.</div>
          ) : (
            <div className="p-4 space-y-3">
              {displayRows.map((l) => {
                const resultStr = String(l.result ?? "").trim().toUpperCase();
                const isAllowed =
                  resultStr === "ALLOWED" ? true : resultStr === "DENIED" ? false : !!l.allowed;

                const timeStr = l.createdAt ? new Date(l.createdAt).toLocaleString() : "-";
                const plateStr = l.plate || "-";
                const sourceStr = l.source || "MANUAL";
                const checkerStr = getCheckerName(l.checkedBy);
                const reasonStr = l.reason || "-";

                return (
                  <div key={l._id} className="border rounded-2xl p-4 shadow-sm bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-lg font-extrabold text-gray-900 tracking-wide truncate">
                          {plateStr}
                        </div>

                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {timeStr}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <ResultBadge isAllowed={isAllowed} />
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                        <span className="text-gray-500 font-bold">SRC</span>
                        {sourceStr}
                      </span>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                        <span className="text-gray-500 font-bold">BY</span>
                        <span className="max-w-[220px] truncate">{checkerStr}</span>
                      </span>
                    </div>

                    <div className="my-3 h-px bg-gray-100" />

                    <div className="text-sm">
                      <div className="text-xs font-semibold text-gray-500 mb-1">Reason</div>
                      <div className="text-gray-800 leading-relaxed break-words">
                        {reasonStr}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>


        <div className="hidden md:block">
          <div className="w-full overflow-x-auto">
            <div className="max-h-[520px] overflow-y-auto">
              <table className="min-w-[900px] w-full text-sm border-separate border-spacing-0">
                <thead className="bg-gray-50 text-gray-700 border-b sticky top-0 z-10">
                  <tr>
                    <th className="text-left text-blue-700 px-6 py-4 font-semibold">TIME</th>
                    <th className="text-left text-blue-700 px-6 py-4 font-semibold">LICENSE PLATE</th>
                    <th className="text-left text-blue-700 px-6 py-4 font-semibold">RESULT</th>
                    <th className="text-left text-blue-700 px-6 py-4 font-semibold">REASON</th>
                    <th className="text-left text-blue-700 px-6 py-4 font-semibold">SOURCE</th>
                    <th className="text-left text-blue-700 px-6 py-4 font-semibold">CHECKED BY</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                        Loading data...
                      </td>
                    </tr>
                  ) : displayRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    displayRows.map((l) => {
                      const resultStr = String(l.result ?? "").trim().toUpperCase();
                      const isAllowed =
                        resultStr === "ALLOWED" ? true : resultStr === "DENIED" ? false : !!l.allowed;

                      return (
                        <tr key={l._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                            {l.createdAt ? new Date(l.createdAt).toLocaleString() : "-"}
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">
                            {l.plate || "-"}
                          </td>
                          <td className="px-6 py-4">
                            <ResultBadge isAllowed={isAllowed} />
                          </td>
                          <td className="px-6 py-4 text-gray-600">{l.reason || "-"}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-700 font-medium text-xs">
                              {l.source || "MANUAL"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                            {getCheckerName(l.checkedBy)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
          <div className="text-xs text-gray-500 italic">
            Displaying <b>{displayRows.length}</b> of <b>{items.length}</b> records (max {limitServer})
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="px-3 py-1.5 rounded-lg border bg-white text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="text-xs font-bold text-gray-700 px-2">
              Page {currentPage} / {totalPages || 1}
            </div>
            <button
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-3 py-1.5 rounded-lg border bg-white text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

    </AppShell>
  );
}