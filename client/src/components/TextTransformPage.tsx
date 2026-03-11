import {
  Check,
  Link as LinkIcon,
  Loader2,
  Share2,
  ShoppingCart,
  Sparkles,
  Wand2,
  X,
  ArrowLeft,
} from "lucide-react";
import React, { useState } from "react";
import { Link } from "react-router-dom";

import { transformText } from "../services/shoppeService";

function TextTransformPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transformedText, setTransformedText] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showSnackbar, setShowSnackbar] = useState(false);

  const handleProcessText = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text || text.trim().length === 0) {
      setError("Vui lòng nhập nội dung");
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setTransformedText("");

    try {
      const response = await transformText(text);
      console.log("Transform response:", response);

      if (response.success && response.data) {
        setTransformedText(response.data.transformedText || "");
        setResults(response.data.links || []);
      } else {
        setError("Không thể chuyển đổi link");
      }
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi trong quá trình xử lý.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (link: string) => {
    if (!link) return;
    console.log("Opening URL:", link);
    window.location.href = link;
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fcedde] via-[#ffe8d1] to-[#ffd4a8] text-gray-900 selection:bg-orange-500/30">
      <div className="flex items-center pt-8 pl-8">
        <img
          src="/assets/logo.png"
          alt="JTik Logo"
          className="w-16 md:w-24 lg:w-32 object-contain"
        />
      </div>
      <div className="fixed top-0 left-0 w-full z-50 px-8 py-6 flex justify-end items-center">
        <Link
          to="/"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold hover:from-gray-600 hover:to-gray-700 transition-all shadow-lg shadow-gray-500/30 hover:shadow-xl hover:shadow-gray-500/40 active:scale-95"
        >
          <ArrowLeft size={16} />
          Quay lại
        </Link>
      </div>

      {/* Vùng Hành Động Chính */}
      <section className="relative pt-20 pb-20 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-blue-600/10 blur-[120px] -z-10 rounded-full pointer-events-none"></div>

        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold mb-8 tracking-widest uppercase">
            <Sparkles size={12} /> Chuyển đổi văn bản
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight">
            <span className="gradient-text">Chuyển Đổi Văn Bản</span>
          </h1>

          <form onSubmit={handleProcessText} className="relative mb-12">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/50 to-red-500/50 rounded-2xl blur-lg opacity-20 group-focus-within:opacity-100 transition duration-500"></div>
              <div className="relative flex flex-col bg-gradient-to-r from-orange-100 to-orange-50 p-2 rounded-2xl border-orange-300/40 focus-within:border-orange-500/60 transition-all shadow-lg">
                <div className="flex items-center">
                  <div className="pl-4 text-orange-600">
                    <LinkIcon size={22} />
                  </div>
                  <div className="flex-1 px-4 py-2">
                    <p className="text-xs text-orange-600 font-semibold">
                      Nhập văn bản có chứa link (tự động phát hiện và chuyển đổi
                      link)
                    </p>
                  </div>
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="⭐️ SHOPEE VIP: https://s.shopee.vn/VzB6efplZ&#10;►     0H lưu dùng mã giảm 25% tối đa 200K/0Đ tại banner&#10;►     0H: Dùng loạt mã 22% Svip sẵn ví&#10;👉 Ai chưa đăng ký ShopeeVIP thì vào đây..."
                  className="w-full bg-transparent border-none focus:ring-0 text-gray-900 px-4 py-2 text-base placeholder:text-orange-400/60 resize-none"
                  disabled={loading}
                  rows={10}
                />
                <div className="flex justify-end p-2">
                  <button
                    type="submit"
                    disabled={loading || !text.trim()}
                    className="bg-orange-500 text-white font-bold px-8 py-4 rounded-xl hover:bg-orange-600 transition-all flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-xl shadow-orange-500/30"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={22} />
                    ) : (
                      <Wand2 size={22} />
                    )}
                    <span className="font-bold uppercase tracking-wider text-sm">
                      Chuyển Đổi
                    </span>
                  </button>
                </div>
              </div>
            </div>
            {error && (
              <p className="absolute -bottom-8 left-0 right-0 text-red-400 text-sm font-medium animate-pulse">
                {error}
              </p>
            )}
          </form>

          {/* Vùng Kết Quả */}
          <div
            className={`transition-all duration-700 transform ${
              transformedText || results.length > 0
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-4 scale-95 pointer-events-none absolute"
            }`}
          >
            {(transformedText || results.length > 0) && (
              <div className="glass p-6 rounded-3xl border-blue-500/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                <button
                  onClick={() => {
                    setResults([]);
                    setTransformedText("");
                  }}
                  className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center mb-6">
                  <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 mb-4">
                    <Share2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    ✅ Đã chuyển đổi {results.length} link
                  </h3>
                </div>

                {/* Transformed Text Section */}
                {transformedText && (
                  <div className="mb-6">
                    <div className="bg-black/50 border border-white/5 p-6 rounded-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest">
                          📝 Nội dung đã chuyển đổi
                        </h4>
                        <button
                          onClick={() => handleCopyToClipboard(transformedText)}
                          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all text-sm"
                        >
                          <LinkIcon size={16} />
                          Copy tất cả
                        </button>
                      </div>
                      <div className="bg-gray-900/50 p-4 rounded-xl max-h-[300px] overflow-y-auto">
                        <pre className="text-sm text-gray-200 whitespace-pre-wrap break-words font-mono">
                          {transformedText}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Links List */}
                {results.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-3">
                      🔗 Danh sách link
                    </h4>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {results.map((result, index) => (
                        <div
                          key={index}
                          className="w-full bg-black/50 border border-white/5 p-4 rounded-2xl"
                        >
                          {result.shortLink ? (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div className="text-left overflow-hidden w-full">
                                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">
                                  Link #{index + 1}
                                </p>
                                <p className="text-xs text-gray-400 truncate mb-2">
                                  {result.originalLink}
                                </p>
                                <p className="text-sm font-mono text-white truncate">
                                  {result.shortLink}
                                </p>
                              </div>
                              <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                  onClick={() =>
                                    handleCopyToClipboard(result.shortLink)
                                  }
                                  className="flex-1 sm:flex-none bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all text-sm justify-center"
                                  title="Copy link"
                                >
                                  <LinkIcon size={16} />
                                  Copy
                                </button>
                                <button
                                  onClick={() => handleCopy(result.shortLink)}
                                  className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all text-sm justify-center"
                                >
                                  <ShoppingCart size={16} />
                                  Mua
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-left">
                              <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-1">
                                Link #{index + 1} - Lỗi
                              </p>
                              <p className="text-xs text-gray-400 truncate mb-1">
                                {result.originalLink}
                              </p>
                              <p className="text-sm text-red-400">
                                {result.error || "Không thể chuyển đổi"}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="mt-20 border-t border-white/5 py-10 text-center text-zinc-600 text-[10px] uppercase tracking-[0.2em]">
        <p>&copy; Copyright &bull; Just J 2026</p>
      </footer>

      {/* Snackbar for Copy Success */}
      {showSnackbar && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in">
          <div
            className="bg-teal-100 border-t-4 border-teal-500 rounded-b text-teal-900 px-4 py-3 shadow-md"
            role="alert"
          >
            <div className="flex items-center">
              <div className="py-1">
                <div className="fill-current h-6 w-6 text-teal-500 mr-4">
                  <Check size={24} strokeWidth={3} />
                </div>
              </div>
              <div>
                <p className="font-bold">Đã copy thành công!</p>
                <p className="text-sm">
                  Nội dung đã được sao chép vào clipboard của bạn.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TextTransformPage;
