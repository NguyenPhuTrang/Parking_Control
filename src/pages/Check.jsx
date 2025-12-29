import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import api from "../api/interceptor";

const normalizePlate = (v) =>
  (v || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

const API_BASE =
  api.defaults.baseURL?.replace(/\/$/, "") || "http://localhost:4000";
const toAbsUrl = (p) => (p?.startsWith("http") ? p : `${API_BASE}${p}`);

export default function Check() {
  const inputRef = useRef(null);
  const fileRef = useRef(null);

  const [plate, setPlate] = useState("");
  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

  const doCheck = async (opts = {}) => {
    const p = normalizePlate(opts.plate ?? plate);
    if (!p) return;

    setLoading(true);
    setResult(null);

    try {
      const payload = {
        plate: p,
        source: opts.source,
        imageUrl: opts.imageUrl,
        confidence: opts.confidence,
      };
      Object.keys(payload).forEach(
        (k) => payload[k] === undefined && delete payload[k]
      );

      const res = await api.post("/check", payload);

      setResult({
        ...res.data,
        source: res.data?.source ?? opts.source,
        imageUrl: res.data?.imageUrl ?? opts.imageUrl,
        confidence: res.data?.confidence ?? opts.confidence,
      });

      setPlate(p);
      inputRef.current?.select();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Check failed";

      setResult({
        allowed: false,
        reason: "ERROR",
        plate: p,
        owner: null,
        message: Array.isArray(msg) ? msg.join(", ") : String(msg),
        source: opts.source,
        imageUrl: opts.imageUrl,
        confidence: opts.confidence,
      });

      inputRef.current?.select();
    } finally {
      setLoading(false);
    }
  };

  const onPickImage = () => fileRef.current?.click();

  const onUploadImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setResult({
        allowed: false,
        reason: "ERROR",
        plate: normalizePlate(plate) || "-",
        owner: null,
        message: "File is not an image",
      });
      return;
    }

    setOcrLoading(true);
    setResult(null);

    try {
      const form = new FormData();
      form.append("image", file);

      const ocrRes = await api.post("/alpr/recognize", form);
      const imageUrl = ocrRes.data?.imageUrl;
      const best = ocrRes.data?.result?.best;

      const bestPlate = best?.plate ? normalizePlate(best.plate) : "";
      const confidence = typeof best?.confidence === "number" ? best.confidence : undefined;

      if (bestPlate) setPlate(bestPlate);

      if (!bestPlate) {
        setResult({
          allowed: false,
          reason: "ERROR",
          plate: "-",
          owner: null,
          message: "OCR could not read the plate (try a clearer image).",
          imageUrl,
          source: "OCR",
          confidence,
        });
        return;
      }

      await doCheck({
        plate: bestPlate,
        source: "OCR",
        imageUrl,
        confidence,
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "OCR upload failed";

      setResult({
        allowed: false,
        reason: "ERROR",
        plate: normalizePlate(plate) || "-",
        owner: null,
        message: Array.isArray(msg) ? msg.join(", ") : String(msg),
      });
    } finally {
      setOcrLoading(false);
    }
  };

  const clear = () => {
    setPlate("");
    setResult(null);
    inputRef.current?.focus();
  };

  const busy = loading || ocrLoading;

  return (
    <AppShell title="Vehicle Check">
      <div className="grid grid-cols-12 gap-6">
        {/* Left */}
        <div className="col-span-12 lg:col-span-5">
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="text-sm font-semibold text-gray-700 mb-2">
              License Plate
            </div>

            <input
              ref={inputRef}
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doCheck()}
              placeholder="Enter license plate..."
              className="w-full border rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => doCheck()}
                disabled={busy}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                {loading ? "Checking..." : "Check Now"}
              </button>

              <button
                onClick={clear}
                disabled={busy}
                className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-60 text-gray-900 py-3 rounded-xl font-semibold transition-colors"
              >
                Clear
              </button>
            </div>

            {/* OCR Upload */}
            <div className="mt-4">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onUploadImage}
              />

              <button
                type="button"
                onClick={onPickImage}
                disabled={busy}
                className="w-full bg-gray-900 hover:bg-black disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                {ocrLoading ? "Scanning Image (OCR)..." : "📷 Upload Image to Scan Plate"}
              </button>

              <div className="mt-2 text-xs text-gray-500">
                Images are saved on the server (<code>/uploads</code>) and URLs are recorded in history.
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="col-span-12 lg:col-span-7">
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="text-sm font-semibold text-gray-700 mb-4">
              Results
            </div>

            {!result ? (
              <div className="text-gray-500">
                Enter a license plate and click <b>Check Now</b>, or <b>Upload an image</b> for OCR.
              </div>
            ) : (
              <div
                className={`rounded-2xl p-6 text-white ${result.allowed ? "bg-green-600" : "bg-red-600"
                  }`}
              >
                <div className="text-3xl font-extrabold">
                  {result.allowed ? "✓ ACCESS GRANTED" : "✕ ACCESS DENIED"}
                </div>

                <div className="mt-4 text-lg">
                  Plate: <span className="font-bold">{result.plate}</span>
                </div>

                <div className="mt-1 text-sm opacity-90">
                  Reason: <b>{result.reason}</b>
                </div>

                {result.owner && (
                  <div className="mt-4 text-sm">
                    Owner: <b>{result.owner}</b>
                  </div>
                )}

                {(result.source || result.imageUrl || result.confidence) && (
                  <div className="mt-4 text-xs opacity-90 space-y-1">
                    {result.source && (
                      <div>
                        Source: <b>{result.source}</b>
                      </div>
                    )}
                    {typeof result.confidence === "number" && (
                      <div>
                        Confidence: <b>{Math.round(result.confidence * 100)}%</b>
                      </div>
                    )}
                    {result.imageUrl && (
                      <div className="pt-2">
                        <div className="mb-2">Image:</div>
                        <img
                          src={toAbsUrl(result.imageUrl)}
                          alt="plate"
                          className="w-full max-w-sm rounded-xl border bg-white"
                        />
                      </div>
                    )}
                  </div>
                )}

                {result.reason === "ERROR" && result.message && (
                  <div className="mt-4 text-xs opacity-90">
                    Error Details: <b>{result.message}</b>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 text-xs text-gray-500">
              Note: System returns MATCHED / NOT_FOUND / INACTIVE / EXPIRED status.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}