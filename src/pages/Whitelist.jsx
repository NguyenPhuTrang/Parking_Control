import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/layout/AppShell";
import api from "../api/interceptor";
import { getUser } from "../auth/auth";


const normalizePlate = (v) => (v || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

export default function Whitelist() {
    const user = getUser();
    const canEdit = user?.role === "ADMIN"; // ✅ Only ADMIN can edit

    const [tab, setTab] = useState("ALL"); // ALL | ACTIVE | EXPIRED | INACTIVE
    const [search, setSearch] = useState("");

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal state
    const [openAdd, setOpenAdd] = useState(false);
    const [plateInput, setPlateInput] = useState("");
    const [ownerInput, setOwnerInput] = useState("");
    const [activeInput, setActiveInput] = useState(true);
    const [validToInput, setValidToInput] = useState(""); // yyyy-mm-dd
    const [saving, setSaving] = useState(false);
    const [addError, setAddError] = useState("");

    const statusMap = {
        ALL: "all",
        ACTIVE: "active",
        EXPIRED: "expired",
        INACTIVE: "inactive",
    };

    const fetchList = async () => {
        setLoading(true);
        try {
            const res = await api.get("/whitelist", {
                params: {
                    search: search || undefined,
                    status: statusMap[tab],
                },
            });
            setRows(res.data || []);
        } catch (err) {
            console.error("Load whitelist failed", err);
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList();
    }, [tab]);

    useEffect(() => {
        const t = setTimeout(fetchList, 400);
        return () => clearTimeout(t);
    }, [search]);

    const openAddModal = () => {
        if (!canEdit) return;
        setAddError("");
        setPlateInput("");
        setOwnerInput("");
        setActiveInput(true);
        setValidToInput("");
        setOpenAdd(true);
    };

    const closeAddModal = () => {
        if (saving) return;
        setOpenAdd(false);
    };

    const add = async () => {
        if (!canEdit) return;
        setAddError("");

        const p = normalizePlate(plateInput);
        if (!p) {
            setAddError("Please enter a license plate");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                plate: p,
                owner: ownerInput?.trim() || "-",
                active: activeInput,
                validTo: validToInput ? new Date(validToInput).toISOString() : undefined,
            };

            Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

            await api.post("/whitelist", payload);

            setOpenAdd(false);
            fetchList();
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "Failed to add to whitelist";
            setAddError(Array.isArray(msg) ? msg.join(", ") : String(msg));
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (id) => {
        if (!canEdit) return;
        try {
            await api.patch(`/whitelist/${id}/toggle`);
            fetchList();
        } catch (err) {
            alert("Could not change status");
        }
    };

    const del = async (id) => {
        if (!canEdit) return;
        if (!window.confirm("Delete this license plate?")) return;
        try {
            await api.delete(`/whitelist/${id}`);
            fetchList();
        } catch (err) {
            alert("Delete failed");
        }
    };

    const filtered = useMemo(() => rows, [rows]);

    return (
        <AppShell title="Whitelist Management">
            {/* Toolbar */}
            <div className="bg-white rounded-2xl shadow-sm border p-4 md:p-6">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {[
                                { key: "ALL", label: "All" },
                                { key: "ACTIVE", label: "Active" },
                                { key: "EXPIRED", label: "Expired" },
                                { key: "INACTIVE", label: "Disabled" },
                            ].map((x) => (
                                <button
                                    key={x.key}
                                    type="button"
                                    onClick={() => setTab(x.key)}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors w-full ${tab === x.key
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                                        }`}
                                >
                                    {x.label}
                                </button>
                            ))}
                        </div>

                        <div className="w-full lg:w-[360px]">
                            <input
                                className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Search by plate..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Row 2: Add button (ADMIN only) */}
                    <div className="flex justify-end items-center gap-3">
                        {!canEdit && (
                            <div className="text-xs text-gray-500">
                                You are logged in as <b>STAFF</b> → View-only access.
                            </div>
                        )}

                        {canEdit && (
                            <button
                                type="button"
                                onClick={openAddModal}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold whitespace-nowrap transition-colors"
                            >
                                + Add New Plate
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border mt-6 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-700">
                            <tr>
                                <th className="text-left text-blue-700 px-6 py-4">LICENSE PLATE</th>
                                <th className="text-left text-blue-700 px-6 py-4">OWNER</th>
                                <th className="text-left text-blue-700 px-6 py-4">STATUS</th>
                                {canEdit && <th className="text-left text-blue-700 px-6 py-4">ACTIONS</th>}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={canEdit ? 4 : 3} className="px-6 py-10 text-center text-gray-500">
                                        Loading whitelist data...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={canEdit ? 4 : 3} className="px-6 py-10 text-center text-gray-500">
                                        No records found.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((r) => (
                                    <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900">{r.plate}</td>
                                        <td className="px-6 py-4 text-gray-600">{r.owner}</td>
                                        <td className="px-6 py-4">
                                            {r.validTo && new Date(r.validTo) < new Date() ? (
                                                <span className="inline-flex px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-bold text-xs">
                                                    EXPIRED
                                                </span>
                                            ) : r.active ? (
                                                <span className="inline-flex px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold text-xs">
                                                    ACTIVE
                                                </span>
                                            ) : (
                                                <span className="inline-flex px-3 py-1 rounded-full bg-gray-200 text-gray-700 font-bold text-xs">
                                                    DISABLED
                                                </span>
                                            )}
                                        </td>

                                        {canEdit && (
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => toggleActive(r._id)}
                                                        className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-black transition-colors"
                                                    >
                                                        {r.active ? "Disable" : "Enable"}
                                                    </button>
                                                    <button
                                                        onClick={() => del(r._id)}
                                                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Add (ADMIN only) */}
            {openAdd && canEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeAddModal} />
                    <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-xl border p-6">
                        <div className="text-lg font-extrabold text-gray-900">Add to Whitelist</div>
                        <div className="text-sm text-gray-500 mt-1">Please enter the details below.</div>

                        <div className="grid grid-cols-12 gap-4 mt-6">
                            <div className="col-span-12 md:col-span-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">License Plate</label>
                                <input
                                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="ABC-1234"
                                    value={plateInput}
                                    onChange={(e) => setPlateInput(e.target.value)}
                                />
                            </div>

                            <div className="col-span-12 md:col-span-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Owner Name</label>
                                <input
                                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="John Doe"
                                    value={ownerInput}
                                    onChange={(e) => setOwnerInput(e.target.value)}
                                />
                            </div>

                            <div className="col-span-12 md:col-span-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Initial Status</label>
                                <label className="flex items-center gap-2 text-sm text-gray-700 select-none cursor-pointer border rounded-xl px-4 py-2.5">
                                    <input
                                        type="checkbox"
                                        checked={activeInput}
                                        onChange={(e) => setActiveInput(e.target.checked)}
                                        className="h-4 w-4"
                                    />
                                    Active
                                </label>
                            </div>

                            <div className="col-span-12 md:col-span-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Valid Until (Optional)
                                </label>
                                <input
                                    type="date"
                                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={validToInput}
                                    onChange={(e) => setValidToInput(e.target.value)}
                                />
                            </div>

                            {addError && (
                                <div className="col-span-12 text-sm text-red-600">• {addError}</div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                type="button"
                                onClick={closeAddModal}
                                className="px-4 py-2.5 rounded-xl border font-semibold hover:bg-gray-50 transition-colors"
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={add}
                                disabled={saving}
                                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold transition-colors"
                            >
                                {saving ? "Saving..." : "Add Plate"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
}