import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/layout/AppShell";
import api from "../api/interceptor";
import { getUser } from "../auth/auth";

import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";

const normalizePlate = (v) => (v || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

const PAGE_SIZE = 50;
const FETCH_LIMIT = 500;

export default function Whitelist() {
    const user = getUser();
    const canEdit = user?.role === "ADMIN";
    const [tab, setTab] = useState("ALL");
    const [search, setSearch] = useState("");
    const [allRows, setAllRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [openAdd, setOpenAdd] = useState(false);
    const [plateInput, setPlateInput] = useState("");
    const [ownerInput, setOwnerInput] = useState("");
    const [activeInput, setActiveInput] = useState(true);
    const [validToInput, setValidToInput] = useState("");
    const [saving, setSaving] = useState(false);
    const [addError, setAddError] = useState("");

    const [openEdit, setOpenEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editPlate, setEditPlate] = useState("");
    const [editOwner, setEditOwner] = useState("");
    const [editActive, setEditActive] = useState(true);
    const [editValidTo, setEditValidTo] = useState("");
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState("");

    const [toast, setToast] = useState({ open: false, type: "success", message: "" });
    const showToast = (type, message) => {
        setToast({ open: true, type, message });
        window.clearTimeout(showToast._t);
        showToast._t = window.setTimeout(() => setToast((t) => ({ ...t, open: false })), 2400);
    };

    const [confirm, setConfirm] = useState({
        open: false,
        title: "",
        message: "",
        danger: false,
        loading: false,
        onConfirm: null,
    });

    const openConfirm = ({ title, message, danger = false, onConfirm }) => {
        setConfirm({ open: true, title, message, danger, loading: false, onConfirm });
    };

    const closeConfirm = () => {
        if (confirm.loading) return;
        setConfirm((c) => ({ ...c, open: false }));
    };

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
                    limit: FETCH_LIMIT,
                    page: 1,
                },
            });

            const data = res.data?.data || [];
            setAllRows(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Load whitelist failed.", err);
            setAllRows([]);
            showToast("error", "Unable to load whitelist.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
        fetchList();
    }, [tab]);

    useEffect(() => {
        const t = setTimeout(() => {
            setPage(1);
            fetchList();
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    const total = allRows.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [totalPages]);

    const filtered = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        return allRows.slice(start, end);
    }, [allRows, page]);

    const startIndex = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const endIndex = Math.min(page * PAGE_SIZE, total);

    function StatusBadge({ row }) {
        const expired = row?.validTo && new Date(row.validTo) < new Date();
        if (expired) {
            return (
                <span className="inline-flex px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-bold text-xs">
                    EXPIRED
                </span>
            );
        }
        if (row?.active) {
            return (
                <span className="inline-flex px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold text-xs">
                    ACTIVE
                </span>
            );
        }
        return (
            <span className="inline-flex px-3 py-1 rounded-full bg-gray-200 text-gray-700 font-bold text-xs">
                DISABLED
            </span>
        );
    }

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
            setAddError("Please enter the license plate number.");
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
            showToast("success", `License plate ${p} has been successfully added.`);

            setPage(1);
            fetchList();
        } catch (err) {
            const msg = err?.response?.data?.message || "Unable to add whitelist";
            const m = Array.isArray(msg) ? msg.join(", ") : String(msg);
            setAddError(m);
            showToast("error", m);
        } finally {
            setSaving(false);
        }
    };

    const openEditModal = (row) => {
        if (!canEdit) return;

        setEditError("");
        setEditId(row._id);

        setEditPlate(row.plate || "");
        setEditOwner(row.owner || "");
        setEditActive(!!row.active);

        const d = row.validTo ? new Date(row.validTo) : null;
        setEditValidTo(d ? d.toISOString().slice(0, 10) : "");

        setOpenEdit(true);
    };

    const closeEditModal = () => {
        if (editSaving) return;
        setOpenEdit(false);
    };

    const saveEdit = async () => {
        if (!canEdit || !editId) return;
        setEditError("");

        const p = normalizePlate(editPlate);
        if (!p) {
            setEditError("Plate is invalid");
            return;
        }

        const payload = {
            plate: p,
            owner: (editOwner || "").trim() || "-",
            active: !!editActive,
            validTo: editValidTo ? new Date(editValidTo).toISOString() : undefined,
        };
        Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

        setEditSaving(true);
        try {
            const res = await api.patch(`/whitelist/${editId}`, payload);

            const updated = res.data;
            setAllRows((prev) => prev.map((x) => (x._id === editId ? { ...x, ...updated } : x)));

            setOpenEdit(false);
            showToast("success", "Updated successfully !");
        } catch (err) {
            const msg = err?.response?.data?.message || "Unable to update !";
            const m = Array.isArray(msg) ? msg.join(", ") : String(msg);
            setEditError(m);
            showToast("error", m);
        } finally {
            setEditSaving(false);
        }
    };

    const toggleActive = (row) => {
        if (!canEdit) return;

        openConfirm({
            title: row.active ? "Turn off license plate status ?" : "Turn on license plate status ?",
            message: `License plate: ${row.plate}\nCar owner: ${row.owner || "-"}`,
            danger: false,
            onConfirm: async () => {
                try {
                    setConfirm((c) => ({ ...c, loading: true }));
                    await api.patch(`/whitelist/${row._id}/toggle`);
                    showToast("success", `${row.active ? "Turned off !" : "Turned on !"} ${row.plate}`);
                    setConfirm((c) => ({ ...c, open: false, loading: false }));
                    fetchList();
                } catch (e) {
                    setConfirm((c) => ({ ...c, loading: false }));
                    showToast("error", "Unable to change status !");
                }
            },
        });
    };

    const del = (row) => {
        if (!canEdit) return;

        openConfirm({
            title: "Delete license plate ?",
            message: `Are you sure you want to delete?\n\nLicense plate: ${row.plate}\nCar owner: ${row.owner || "-"}`,
            danger: true,
            onConfirm: async () => {
                try {
                    setConfirm((c) => ({ ...c, loading: true }));
                    await api.delete(`/whitelist/${row._id}`);
                    showToast("success", `Deleted ${row.plate}`);
                    setConfirm((c) => ({ ...c, open: false, loading: false }));
                    fetchList();
                } catch (e) {
                    setConfirm((c) => ({ ...c, loading: false }));
                    showToast("error", "Unable to delete !");
                }
            },
        });
    };

    return (
        <AppShell title="Whitelist Management">
            <Toast
                open={toast.open}
                type={toast.type}
                message={toast.message}
                onClose={() => setToast((t) => ({ ...t, open: false }))}
            />

            <ConfirmDialog
                open={confirm.open}
                title={confirm.title}
                message={confirm.message}
                danger={confirm.danger}
                loading={confirm.loading}
                confirmText="Confirm"
                cancelText="Cancel"
                onClose={closeConfirm}
                onConfirm={confirm.onConfirm}
            />

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

                    <div className="flex justify-end items-center gap-3">
                        {!canEdit && (
                            <div className="text-xs text-gray-500">
                                You are logged in <b>STAFF</b> → Only view / search.
                            </div>
                        )}

                        {canEdit && (
                            <button
                                type="button"
                                onClick={openAddModal}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold"
                            >
                                + Add New Plate
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border mt-6 overflow-hidden">
                <div className="md:hidden">
                    {loading ? (
                        <div className="px-6 py-10 text-center text-gray-500">Loading whitelist data...</div>
                    ) : filtered.length === 0 ? (
                        <div className="px-6 py-10 text-center text-gray-500">No records found.</div>
                    ) : (
                        <div className="p-4 space-y-3">
                            {filtered.map((r) => {
                                const plateStr = r?.plate || "-";
                                const ownerStr = r?.owner || "-";
                                const validToStr = r?.validTo ? new Date(r.validTo).toLocaleDateString() : null;

                                return (
                                    <div key={r._id} className="border rounded-2xl p-4 shadow-sm bg-white">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="text-lg font-extrabold text-gray-900 tracking-wide truncate">
                                                    {plateStr}
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1 truncate">{ownerStr}</div>

                                                {validToStr && (
                                                    <div className="mt-2 inline-flex px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">
                                                        Valid to: {validToStr}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="shrink-0">
                                                <StatusBadge row={r} />
                                            </div>
                                        </div>

                                        {canEdit && <div className="my-3 h-px bg-gray-100" />}

                                        {canEdit && (
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(r)}
                                                    className="flex-1 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => toggleActive(r)}
                                                    className="flex-1 px-3 py-2 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-black"
                                                >
                                                    {r.active ? "Disable" : "Enable"}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => del(r)}
                                                    className="flex-1 px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="hidden md:block">
                    <div className="overflow-x-auto">
                        <div className="max-h-[520px] overflow-y-auto">
                            <table className="w-full text-sm border-separate border-spacing-0">
                                <thead className="bg-gray-50 text-gray-700 sticky top-0 z-10">
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
                                                    <StatusBadge row={r} />
                                                </td>

                                                {canEdit && (
                                                    <td className="px-6 py-4">
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditModal(r)}
                                                                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                                                            >
                                                                Edit
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => toggleActive(r)}
                                                                className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-black"
                                                            >
                                                                {r.active ? "Disable" : "Enable"}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => del(r)}
                                                                className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
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
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                    <div className="text-xs text-gray-500 italic">
                        {total === 0
                            ? "Showing 0 of 0 records"
                            : `Showing ${startIndex} - ${endIndex} of ${total} records (fetched up to ${FETCH_LIMIT})`}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="px-3 py-1.5 rounded-lg border bg-white text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>

                        <div className="text-xs font-bold text-gray-700 px-2">
                            Page {page} / {totalPages}
                        </div>

                        <button
                            type="button"
                            disabled={page >= totalPages || loading}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="px-3 py-1.5 rounded-lg border bg-white text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

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
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Valid Until (Optional)</label>
                                <input
                                    type="date"
                                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={validToInput}
                                    onChange={(e) => setValidToInput(e.target.value)}
                                />
                            </div>

                            {addError && <div className="col-span-12 text-sm text-red-600">• {addError}</div>}
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                type="button"
                                onClick={closeAddModal}
                                className="px-4 py-2.5 rounded-xl border font-semibold hover:bg-gray-50"
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={add}
                                disabled={saving}
                                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold"
                            >
                                {saving ? "Saving..." : "Add Plate"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {openEdit && canEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeEditModal} />
                    <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-xl border p-6">
                        <div className="text-lg font-extrabold text-gray-900">Edit Whitelist</div>
                        <div className="text-sm text-gray-500 mt-1">Update the details below.</div>

                        <div className="grid grid-cols-12 gap-4 mt-6">
                            <div className="col-span-12 md:col-span-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">License Plate</label>
                                <input
                                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editPlate}
                                    onChange={(e) => setEditPlate(e.target.value)}
                                />
                                <div className="text-xs text-gray-400 mt-1">Will be normalized (A-Z, 0-9).</div>
                            </div>

                            <div className="col-span-12 md:col-span-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Owner Name</label>
                                <input
                                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editOwner}
                                    onChange={(e) => setEditOwner(e.target.value)}
                                />
                            </div>

                            <div className="col-span-12 md:col-span-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                                <label className="flex items-center gap-2 text-sm text-gray-700 select-none cursor-pointer border rounded-xl px-4 py-2.5">
                                    <input
                                        type="checkbox"
                                        checked={editActive}
                                        onChange={(e) => setEditActive(e.target.checked)}
                                        className="h-4 w-4"
                                    />
                                    Active
                                </label>
                            </div>

                            <div className="col-span-12 md:col-span-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Valid Until (Optional)</label>
                                <input
                                    type="date"
                                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editValidTo}
                                    onChange={(e) => setEditValidTo(e.target.value)}
                                />
                            </div>

                            {editError && <div className="col-span-12 text-sm text-red-600">• {editError}</div>}
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                type="button"
                                onClick={closeEditModal}
                                className="px-4 py-2.5 rounded-xl border font-semibold hover:bg-gray-50"
                                disabled={editSaving}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={saveEdit}
                                disabled={editSaving}
                                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold"
                            >
                                {editSaving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
}
