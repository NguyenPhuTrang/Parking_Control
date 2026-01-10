import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import AppShell from "../components/layout/AppShell";
import api from "../api/interceptor";

const videoConstraints = {
  width: 720,
  height: 720,
  facingMode: "environment",
};

const normalizePlate = (v) =>
  (v || "").toString().trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

const dataURLtoFile = (dataurl, filename) => {
  if (!dataurl) return null;
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export default function Check() {
  const inputRef = useRef(null);
  const webcamRef = useRef(null);

  const [plate, setPlate] = useState("");
  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const busy = loading || ocrLoading;

  const doCheck = async (opts = {}) => {
    const p = normalizePlate(opts.plate ?? plate);

    if (!p) return;
    setPlate(p);
    setLoading(true);
    setResult(null);

    try {
      const payload = {
        plate: p,
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

      if (!showCamera) inputRef.current?.select();
    } catch (err) {
      console.error("Backend Check Error:", err);
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
      if (!showCamera) inputRef.current?.select();
    } finally {
      setLoading(false);
    }
  };

  const handleScanCheck = async (file) => {
    if (!file) return;

    setOcrLoading(true);
    setResult(null);

    const previewUrl = URL.createObjectURL(file);

    try {
      const form = new FormData();
      form.append("file", file);

      // Gọi Server AI (Port 8001)
      const ocrRes = await api.post("http://localhost:8001/alpr/frame", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = ocrRes.data;
      let rawPlate = "";
      let confidence = 0;

      if (data.plate) {
        rawPlate = data.plate;
        confidence = data.confidence;
      } else if (data.results && data.results.length > 0) {
        rawPlate = data.results[0].plate;
        confidence = data.results[0].confidence;
      } else if (data.best?.plate) {
        rawPlate = data.best.plate;
      }

      const cleanPlate = normalizePlate(rawPlate);

      if (!cleanPlate) {
        setResult({
          allowed: false,
          reason: "UNREADABLE",
          plate: "-",
          message: "No license plate found in image",
          imageUrl: previewUrl,
        });
        return;
      }

      setPlate(cleanPlate);
      await doCheck({
        plate: cleanPlate,
        source: "Python OCR",
        imageUrl: previewUrl,
        confidence: confidence,
      });

    } catch (err) {
      console.error("OCR Workflow Error:", err);
      setResult({
        allowed: false,
        reason: "CONNECTION ERROR",
        plate: "-",
        message: "Could not connect to AI Service (8001)",
        imageUrl: previewUrl,
      });
    } finally {
      setOcrLoading(false);
    }
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      const file = dataURLtoFile(imageSrc, "scan.jpg");
      setShowCamera(false);
      handleScanCheck(file);
    }
  }, [webcamRef]);

  const clear = () => {
    setPlate("");
    setResult(null);
    inputRef.current?.focus();
  };

  return (
    <AppShell title="License Plate Checker">
      <div className="grid grid-cols-12 gap-4 lg:gap-6">

        <div className="col-span-12 lg:col-span-5 order-1">
          <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6 sticky top-4">

            {showCamera ? (
              <div className="flex flex-col gap-4">
                <div className="relative rounded-xl overflow-hidden bg-black aspect-square lg:aspect-video shadow-inner group">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={videoConstraints}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border-2 border-white/50 m-6 sm:m-8 rounded-lg flex items-center justify-center pointer-events-none">
                    <span className="bg-black/50 text-white text-[10px] sm:text-xs px-2 py-1 rounded backdrop-blur-sm">
                      Align Plate Here
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={capture}
                    className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white py-3 sm:py-4 rounded-xl font-bold shadow-lg transition-transform active:scale-95"
                  >
                    📸 CAPTURE
                  </button>
                  <button
                    onClick={() => setShowCamera(false)}
                    className="px-4 sm:px-6 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-sm font-semibold text-gray-700 mb-2">Enter License Plate</div>
                <input
                  ref={inputRef}
                  value={plate}
                  disabled={busy}
                  onChange={(e) => setPlate(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doCheck()}
                  placeholder="EX: 29A88888"
                  className="w-full border rounded-xl px-4 py-3 sm:py-4 text-lg sm:text-xl font-mono focus:ring-2 focus:ring-blue-500 uppercase disabled:bg-gray-50 transition-all"
                />

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => doCheck()}
                    disabled={busy}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 sm:py-4 rounded-xl font-semibold shadow-sm transition-all active:scale-[0.98]"
                  >
                    {loading ? "Checking..." : "Check Now"}
                  </button>
                  <button
                    onClick={clear}
                    disabled={busy}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed text-gray-900 py-3 sm:py-4 rounded-xl font-semibold transition-colors"
                  >
                    Clear
                  </button>
                </div>

                <div className="mt-6 border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    disabled={busy}
                    className="w-full py-4 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                  >
                    {ocrLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xl">📷</span>
                        <span>Open Camera Scan</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7 order-2">
          <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6 min-h-[200px] lg:min-h-[300px]">
            <div className="text-sm font-semibold text-gray-700 mb-4">Check Results</div>

            {!result ? (
              <div className="flex flex-col items-center justify-center h-48 sm:h-[14rem] text-gray-400 border-2 border-dashed rounded-xl bg-gray-50">
                <span className="text-sm sm:text-base">Waiting for data ...</span>
              </div>
            ) : (
              <div className={`rounded-2xl p-4 sm:p-6 text-white shadow-lg transition-all duration-300 ${result.allowed ? "bg-green-600" : "bg-red-600"}`}>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5">
                  <div className="bg-white/20 p-3 sm:p-4 rounded-full backdrop-blur-sm self-start">
                    <span className="text-3xl sm:text-4xl">{result.allowed ? "✅" : "⛔"}</span>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm opacity-90 uppercase font-bold tracking-wide">Access Right</div>
                    <div className="text-2xl sm:text-3xl font-extrabold leading-tight">
                      {result.allowed ? "ALLOWED" : "DENIED"}
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-black/10 rounded-xl p-4 border border-white/10">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-left">

                    <div className="border-b border-white/10 sm:border-0 pb-3 sm:pb-0">
                      <div className="text-[10px] sm:text-xs opacity-75 uppercase mb-1">Plate Number</div>
                      <div className="text-xl sm:text-2xl font-mono font-bold tracking-wider truncate" title={result.plate}>
                        {result.plate}
                      </div>
                    </div>

                    <div className="border-b border-white/10 sm:border-0 pb-3 sm:pb-0">
                      <div className="text-[10px] sm:text-xs opacity-75 uppercase mb-1">Reason / Note</div>
                      <div className="text-lg sm:text-xl font-bold break-words leading-tight" title={result.reason}>
                        {result.reason}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] sm:text-xs opacity-75 uppercase mb-1">Vehicle Owner</div>
                      <div className="text-lg sm:text-xl font-bold truncate" title={result.owner}>
                        {result.owner || "-"}
                      </div>
                    </div>

                  </div>
                </div>

                {(typeof result.confidence === 'number' || result.source) && (
                  <div className="mt-3 flex flex-wrap justify-between text-[10px] sm:text-xs opacity-80 px-1 gap-2">
                    {result.source && <span>Source: {result.source}</span>}
                    {typeof result.confidence === 'number' && (
                      <span>AI Confidence: <b>{Math.round(result.confidence * 100)}%</b></span>
                    )}
                  </div>
                )}

                {result.reason === "ERROR" && result.message && (
                  <div className="mt-4 p-3 bg-red-900/50 rounded-lg text-sm border border-red-400/30 flex gap-2 items-start">
                    <span>⚠️</span>
                    <span className="break-words">{result.message}</span>
                  </div>
                )}

                {result.imageUrl && (
                  <div className="mt-5 pt-4 border-t border-white/20">
                    <div className="text-[10px] sm:text-xs opacity-75 uppercase mb-2">Captured Image</div>
                    <img
                      src={result.imageUrl}
                      alt="Captured"
                      className="w-full h-40 sm:h-56 object-cover rounded-lg bg-black/50 border border-white/20"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}