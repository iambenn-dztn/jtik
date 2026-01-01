import React, { useState } from "react";
import {
  Wand2,
  Link as LinkIcon,
  Loader2,
  Copy,
  Check,
  Sparkles,
  X,
  Share2,
  Phone,
  CreditCard,
} from "lucide-react";

import { transformLink, saveInfo } from "./services/shoppeService";

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [phone, setPhone] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);

  const handleProcessLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !url.startsWith("http")) {
      setError(
        "Vui lòng nhập một URL hợp lệ (bắt đầu bằng http:// hoặc https://)"
      );
      return;
    }

    const transformedLink = await transformLink(url);
    console.log("Processing URL:", transformedLink);

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      setResult(transformedLink);
      setUrl("");
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi trong quá trình xử lý liên kết.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    console.log("Opening URL:", result);

    const shopeeLink = result;

    // Try to open in Shopee app (works on mobile)
    window.location.href = shopeeLink;

    // window.open(result);
    // navigator.clipboard.writeText(result);
    // setCopied(true);
    // setTimeout(() => setCopied(false), 500);
  };

  const handleBankInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = {
      phone,
      bankName,
      accountNumber,
      accountName,
      orderId,
    };
    console.log("Bank Information Submitted:", formData);

    const res = await saveInfo(formData);

    // Show success snackbar
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 3000);

    // Reset form
    setPhone("");
    setBankName("");
    setAccountNumber("");
    setAccountName("");
    setOrderId("");

    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff5eb] via-[#ffe8d1] to-[#ffd4a8] text-gray-900 selection:bg-orange-500/30">
      <div className="flex items-center pt-8 pl-8">
        <img
          src="/assets/logo.png"
          alt="JTik Logo"
          className="w-16 md:w-24 lg:w-32 object-contain"
        />
      </div>
      <div className="fixed top-0 left-0 w-full z-50 px-8 py-6 flex justify-end items-center">
        <div className="flex items-center gap-8 text-sm font-semibold text-zinc-400">
          {/* <a href="#" className="hover:text-orange-400 transition-all">
            Sản phẩm
          </a>
          <a href="#" className="hover:text-orange-400 transition-all">
            Blog
          </a> */}
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 rounded-xl border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 transition-all"
          >
            Hoàn tiền
          </button>
        </div>
      </div>

      {/* Vùng Hành Động Chính */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-blue-600/10 blur-[120px] -z-10 rounded-full pointer-events-none"></div>

        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold mb-8 tracking-widest uppercase">
            <Sparkles size={12} /> Hoàn tiền Shoppee
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight">
            <span className="gradient-text">Tạo Link Hoàn Tiền</span>
          </h1>

          <form onSubmit={handleProcessLink} className="relative mb-12">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/50 to-red-500/50 rounded-2xl blur-lg opacity-20 group-focus-within:opacity-100 transition duration-500"></div>
              <div className="relative flex items-center bg-gradient-to-r from-orange-100 to-orange-50 p-2 rounded-2xl border-orange-300/40 focus-within:border-orange-500/60 transition-all shadow-lg">
                <div className="pl-4 text-orange-600">
                  <LinkIcon size={22} />
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Dán link sản phẩm tại đây..."
                  className="w-full bg-transparent border-none focus:ring-0 text-gray-900 px-4 py-4 text-lg placeholder:text-orange-400/60"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !url}
                  className="bg-orange-500 text-white font-bold px-8 py-4 rounded-xl hover:bg-orange-600 transition-all flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-xl shadow-orange-500/30"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={22} />
                  ) : (
                    <Wand2 size={22} />
                  )}
                  <span className="hidden sm:inline font-bold uppercase tracking-wider text-sm text-nowrap">
                    Chuyển Hóa
                  </span>
                </button>
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
              result
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-4 scale-95 pointer-events-none absolute"
            }`}
          >
            {result && (
              <div className="glass p-6 rounded-3xl border-blue-500/30 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                <button
                  onClick={() => setResult(null)}
                  className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 mb-4">
                    <Share2 size={32} />
                  </div>

                  <div className="w-full bg-black/50 border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <div className="text-left overflow-hidden w-full">
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">
                        Liên Kết Chuyển Đổi Mới
                      </p>
                      <p className="text-lg font-mono text-white truncate">
                        jtik.io/{result}
                      </p>
                    </div>
                    <button
                      onClick={handleCopy}
                      className="whitespace-nowrap bg-blue-500 hover:bg-blue-400 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold transition-all w-full sm:w-auto justify-center"
                    >
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                      {copied ? "Đã Chép!" : "Sao Chép"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trạng Thái Trống */}
      {!loading && !result && (
        <div className="flex flex-col items-center justify-center pt-10 text-zinc-700 opacity-50">
          <p className="text-sm tracking-widest uppercase font-bold">...</p>
        </div>
      )}

      <footer className="mt-20 border-t border-white/5 py-10 text-center text-zinc-600 text-[10px] uppercase tracking-[0.2em]">
        <p>&copy; Copyright &bull; JTik 2026</p>
      </footer>

      {/* Bank Information Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold text-white mb-6 pr-8">
              Thông Tin Nhận Hoàn Tiền
            </h2>

            <form onSubmit={handleBankInfoSubmit} className="space-y-4">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400">
                  <Phone size={18} />
                </div>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Mã đơn hàng"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-12 py-3 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400">
                  <Phone size={18} />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Số điện thoại"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-12 py-3 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400">
                  <CreditCard size={18} />
                </div>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Tên ngân hàng"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-12 py-3 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400">
                  <CreditCard size={18} />
                </div>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Số tài khoản"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-12 py-3 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400">
                  <CreditCard size={18} />
                </div>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Tên chủ tài khoản"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-12 py-3 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-all active:scale-95"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-lg"
                >
                  Gửi Thông Tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Snackbar */}
      {showSnackbar && (
        <div className="fixed top-8 right-8 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
            <Check size={24} className="flex-shrink-0" />
            <p className="font-semibold">Thông tin đã được lưu thành công!</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
