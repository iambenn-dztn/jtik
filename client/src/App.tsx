import {
  Building2,
  Check,
  CreditCard,
  Link as LinkIcon,
  Loader2,
  Package,
  Phone,
  RefreshCw,
  Share2,
  ShoppingCart,
  Sparkles,
  User,
  Wand2,
  X,
} from "lucide-react";
import React, { useState } from "react";

import { saveInfo, transformLink } from "./services/shoppeService";

function App() {
  const [urls, setUrls] = useState(""); // Changed to textarea value
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]); // Changed to array of results

  // Form state
  const [phone, setPhone] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);

  const handleProcessLink = async (e: React.FormEvent) => {
    e.preventDefault();

    // Parse textarea into array of links (split by newline)
    const linkArray = urls
      .split("\n")
      .map((link) => link.trim())
      .filter((link) => link.length > 0);

    if (linkArray.length === 0) {
      setError("Vui lòng nhập ít nhất một link");
      return;
    }

    // Validate that all links start with http
    const invalidLinks = linkArray.filter((link) => !link.startsWith("http"));
    if (invalidLinks.length > 0) {
      setError(
        `${invalidLinks.length} link không hợp lệ. Mỗi link phải bắt đầu bằng http:// hoặc https://`,
      );
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await transformLink(linkArray);
      console.log("Transform response:", response);

      if (response.success && response.data) {
        setResults(response.data);
        setUrls(""); // Clear textarea after success
      } else {
        setError("Không thể chuyển đổi link");
      }
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi trong quá trình xử lý liên kết.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (link: string) => {
    if (!link) return;
    console.log("Opening URL:", link);
    window.location.href = link;
  };

  const handleCopyToClipboard = (link: string) => {
    navigator.clipboard.writeText(link);
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 2000);
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

    try {
      const res = await saveInfo(formData);

      // Reset form
      setPhone("");
      setBankName("");
      setAccountNumber("");
      setAccountName("");
      setOrderId("");

      setShowModal(false);

      // Show success modal
      setShowSuccessModal(true);
    } catch (err: any) {
      // Show error message to user in custom modal
      setErrorMessage(err.message || "Đã xảy ra lỗi khi lưu thông tin");
      setShowErrorModal(true);
      setShowModal(false);
    }
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
        <div className="flex items-center gap-4 text-sm font-semibold text-zinc-400">
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold hover:from-orange-600 hover:to-red-600 transition-all flex items-center gap-2 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 active:scale-95"
          >
            <RefreshCw size={16} />
            Hoàn tiền
          </button>
        </div>
      </div>

      {/* Vùng Hành Động Chính */}
      <section className="relative pt-20 pb-20 px-6">
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
              <div className="relative flex flex-col bg-gradient-to-r from-orange-100 to-orange-50 p-2 rounded-2xl border-orange-300/40 focus-within:border-orange-500/60 transition-all shadow-lg">
                <div className="flex items-center">
                  <div className="pl-4 text-orange-600">
                    <LinkIcon size={22} />
                  </div>
                  <div className="flex-1 px-4 py-2">
                    <p className="text-xs text-orange-600 font-semibold">
                      Nhập link sản phẩm (mỗi link một dòng)
                    </p>
                  </div>
                </div>
                <textarea
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  placeholder="https://s.shopee.vn/product1&#10;https://s.shopee.vn/product2&#10;https://s.shopee.vn/product3"
                  className="w-full bg-transparent border-none focus:ring-0 text-gray-900 px-4 py-2 text-base placeholder:text-orange-400/60 resize-none"
                  disabled={loading}
                  rows={5}
                />
                <div className="flex justify-end p-2">
                  <button
                    type="submit"
                    disabled={loading || !urls.trim()}
                    className="bg-orange-500 text-white font-bold px-8 py-4 rounded-xl hover:bg-orange-600 transition-all flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-xl shadow-orange-500/30"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={22} />
                    ) : (
                      <Wand2 size={22} />
                    )}
                    <span className="font-bold uppercase tracking-wider text-sm">
                      Chuyển Hóa{" "}
                      {urls.split("\n").filter((l) => l.trim()).length > 0 &&
                        `(${urls.split("\n").filter((l) => l.trim()).length})`}
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
              results.length > 0
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-4 scale-95 pointer-events-none absolute"
            }`}
          >
            {results.length > 0 && (
              <div className="glass p-6 rounded-3xl border-blue-500/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                <button
                  onClick={() => setResults([])}
                  className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center mb-4">
                  <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 mb-4">
                    <Share2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    ✅ Đã chuyển đổi {results.filter((r) => r.shortLink).length}
                    /{results.length} link
                  </h3>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto">
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
        </div>
      </section>

      <footer className="mt-20 border-t border-white/5 py-10 text-center text-zinc-600 text-[10px] uppercase tracking-[0.2em]">
        <p>&copy; Copyright &bull; Just J 2026</p>
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
                  <Package size={18} />
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
                  <Building2 size={18} />
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
                  <User size={18} />
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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black border border-green-500/20 rounded-3xl p-8 max-w-lg w-full shadow-2xl">
            {/* Success Icon */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-4 shadow-lg shadow-green-500/30">
                <Check size={40} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                🎉 Đăng Ký Thành Công!
              </h2>
              <p className="text-green-400 font-medium">
                Thông tin hoàn tiền đã được ghi nhận
              </p>
            </div>

            {/* Success Message */}
            <div className="bg-black/30 rounded-2xl p-6 mb-6 border border-white/10">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg mt-1">
                  <Package size={20} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">
                    Bước tiếp theo:
                  </h3>
                  <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
                    <p className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        1
                      </span>
                      Hoàn tất đặt hàng trên Shopee
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        2
                      </span>
                      Quay lại JPee để nhập thông tin hoàn tiền
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-yellow-500/20 rounded-lg">
                    <Sparkles size={16} className="text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="text-yellow-400 font-medium text-sm mb-1">
                      Lưu ý quan trọng:
                    </h4>
                    <p className="text-gray-300 text-sm">
                      Tiền hoàn chỉ được xử lý sau khi đơn hàng hoàn tất và được
                      xác nhận bởi Shopee. Thời gian xử lý từ{" "}
                      <strong className="text-white">
                        10-12 ngày làm việc
                      </strong>
                      . Tiền hoàn sẽ được chuyển vào tài khoản ngân hàng bạn đã
                      đăng ký.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
            >
              <Check size={20} />
              Đã hiểu, tiếp tục mua sắm
            </button>
          </div>
        </div>
      )}
      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-gradient-to-br from-red-900/90 via-gray-900 to-black border border-red-500/30 rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Error Icon */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-red-500 to-rose-500 rounded-full mb-4 shadow-lg shadow-red-500/30">
                <X size={40} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                ⚠️ Không Thể Ghi Nhận
              </h2>
              <p className="text-red-400 font-medium">Đơn hàng đã tồn tại</p>
            </div>

            {/* Error Message */}
            <div className="bg-black/30 rounded-2xl p-6 mb-6 border border-red-500/20">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-red-500/20 rounded-lg mt-1">
                  <Package size={20} className="text-red-400" />
                </div>
                <div>
                  <p className="text-white text-base leading-relaxed mb-3">
                    {errorMessage}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-yellow-500/20 rounded-lg">
                    <Phone size={16} className="text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="text-yellow-400 font-medium text-sm mb-1">
                      Liên hệ hỗ trợ:
                    </h4>
                    <p className="text-white text-sm font-semibold">
                      SĐT / Zalo:{" "}
                      <a
                        href="tel:0967034098"
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        096 703 4098
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => {
                setShowErrorModal(false);
                setErrorMessage("");
              }}
              className="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-bold py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
            >
              <X size={20} />
              Đóng
            </button>
          </div>
        </div>
      )}

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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
