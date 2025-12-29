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
  }

  if (range === "7D") {
    const start = new Date();
    start.setDate(start.getDate() - 7);
    from = start.toISOString();
  }

  if (range === "30D") {
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
  const [range, setRange] = useState("TODAY"); // TODAY | 7D | 30D
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("ALL"); // ALL | MANUAL | OCR
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { from, to } = buildDateRange(range);

      const res = await api.get("/history", {
        params: {
          page: 1,
          limit: 50,
          search: search || undefined,
          from,
          to,
          source: source === "ALL" ? undefined : source,
        },
      });

      setItems(res.data.items || []);
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
    const t = setTimeout(fetchHistory, 400);
    return () => clearTimeout(t);
  }, [search]);

  const rows = useMemo(() => items, [items]);

  return (
    <AppShell title="Check History">
      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          {/* Range Buttons */}
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

          {/* Search + Source Select */}
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

        <div className="mt-3 text-xs text-gray-500">
          Range: <span className="font-medium text-gray-700">{range}</span> • Source: <span className="font-medium text-gray-700">{source}</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border mt-6 overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-gray-50 text-gray-700 border-b">
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
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    No history records found.
                  </td>
                </tr>
              ) : (
                rows.map((l) => {
                  const isAllowed = l.result === "ALLOWED";
                  return (
                    <tr key={l._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        {l.createdAt ? new Date(l.createdAt).toLocaleString() : "-"}
                      </td>

                      <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">
                        {l.plate || "-"}
                      </td>

                      <td className="px-6 py-4">
                        {isAllowed ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold text-xs">
                            ✓ ALLOWED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold text-xs">
                            ✕ DENIED
                          </span>
                        )}
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
    </AppShell>
  );
}