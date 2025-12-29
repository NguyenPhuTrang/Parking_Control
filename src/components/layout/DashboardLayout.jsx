import { useState } from "react";
import { Outlet } from "react-router-dom";
import SideNav from "../SideNav";

export default function DashboardLayout() {
    const [open, setOpen] = useState(false);

    return (
        <div className="h-screen bg-gray-50 overflow-hidden">
            <div className="hidden lg:flex h-full">
                <aside className="w-64 h-screen flex-shrink-0 border-r bg-white sticky top-0">
                    <SideNav />
                </aside>
                <main className="flex-1 h-full overflow-y-auto">
                    <div className="p-6">
                        <Outlet />
                    </div>
                </main>
            </div>
            <div className="lg:hidden h-full flex flex-col">
                <div className="h-14 bg-white border-b flex items-center px-4">
                    <button
                        onClick={() => setOpen(true)}
                        className="px-3 py-2 rounded-lg border font-semibold"
                    >
                        ☰
                    </button>
                    <div className="ml-3 font-extrabold">Parking Control</div>
                </div>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-4">
                    <Outlet />
                </main>

                {/* Drawer menu */}
                {open && (
                    <div className="fixed inset-0 z-50">
                        <div
                            className="absolute inset-0 bg-black/40"
                            onClick={() => setOpen(false)}
                        />
                        <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
                            <SideNav onClose={() => setOpen(false)} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
