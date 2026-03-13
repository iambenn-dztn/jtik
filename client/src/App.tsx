import {
  Building2,
  Check,
  Clipboard,
  CreditCard,
  Facebook,
  Gift,
  Link as LinkIcon,
  Loader2,
  Package,
  Phone,
  RefreshCw,
  Share2,
  ShoppingCart,
  Sparkles,
  Tag,
  User,
  Users,
  Wand2,
  X,
  Zap,
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
  const [showLinkErrorModal, setShowLinkErrorModal] = useState(false);
  const [linkErrors, setLinkErrors] = useState<any[]>([]);

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

    // Validate that all links are Shopee links
    const shopeePatterns = [
      /shopee\.vn/i,
      /shp\.ee/i,
      /s\.shopee\.vn/i,
      /vn\.shp\.ee/i,
    ];
    const nonShopeeLinks = linkArray.filter(
      (link) => !shopeePatterns.some((pattern) => pattern.test(link)),
    );
    if (nonShopeeLinks.length > 0) {
      setError(
        `${nonShopeeLinks.length} link không phải link Shopee. Vui lòng chỉ nhập link từ shopee.vn, vn.shp.ee, hoặc s.shopee.vn`,
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

        // Check if there are any errors in the results
        const errorsFound = response.data.filter(
          (r: any) => r.error || !r.shortLink,
        );
        if (errorsFound.length > 0) {
          setLinkErrors(errorsFound);
          setShowLinkErrorModal(true);
        }

        setUrls(""); // Clear textarea after success
      } else {
        setError("Không thể chuyển đổi link");
      }
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi trong quá trình xử lý liên kết.");
      setShowLinkErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (link: string) => {
    if (!link) return;
    console.log("Opening URL:", link);
    window.open(link, "_blank");
  };

  const handleCopyToClipboard = (link: string) => {
    navigator.clipboard.writeText(link);
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 2000);
  };

  const handlePasteAndTransform = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();

      if (!clipboardText || clipboardText.trim().length === 0) {
        setError("Clipboard trống hoặc không có nội dung");
        return;
      }

      setUrls(clipboardText);
      setError(null);

      // Parse textarea into array of links
      const linkArray = clipboardText
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

      // Validate that all links are Shopee links
      const shopeePatterns = [
        /shopee\.vn/i,
        /shp\.ee/i,
        /s\.shopee\.vn/i,
        /vn\.shp\.ee/i,
      ];
      const nonShopeeLinks = linkArray.filter(
        (link) => !shopeePatterns.some((pattern) => pattern.test(link)),
      );
      if (nonShopeeLinks.length > 0) {
        setError(
          `${nonShopeeLinks.length} link không phải link Shopee. Vui lòng chỉ nhập link từ shopee.vn, vn.shp.ee, hoặc s.shopee.vn`,
        );
        return;
      }

      setLoading(true);
      setResults([]);

      try {
        const response = await transformLink(linkArray);
        console.log("Transform response:", response);

        if (response.success && response.data) {
          setResults(response.data);

          // Check if there are any errors in the results
          const errorsFound = response.data.filter(
            (r: any) => r.error || !r.shortLink,
          );
          if (errorsFound.length > 0) {
            setLinkErrors(errorsFound);
            setShowLinkErrorModal(true);
          }

          setUrls(""); // Clear textarea after success
        } else {
          setError("Không thể chuyển đổi link");
        }
      } catch (err: any) {
        setError(
          err.message || "Đã xảy ra lỗi trong quá trình xử lý liên kết.",
        );
        setShowLinkErrorModal(true);
      } finally {
        setLoading(false);
      }
    } catch (err) {
      setError("Không thể đọc clipboard. Vui lòng cho phép quyền truy cập.");
    }
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
    <div className="min-h-screen bg-gradient-to-br from-[#fcedde] via-[#ffe8d1] to-[#ffd4a8] text-gray-900 selection:bg-orange-500/30 relative overflow-hidden">
      {/* Voucher Decorations */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top Right Voucher - Large */}
        <img
          src="/assets/voucher-25.png"
          alt=""
          className="absolute -top-10 -right-10 sm:-top-16 sm:-right-16 w-56 sm:w-80 md:w-96 lg:w-[28rem] opacity-40 rotate-12 animate-float"
          style={{ animationDuration: "6s" }}
        />

        {/* Top Left Voucher - Medium */}
        <img
          src="/assets/voucher-25.png"
          alt=""
          className="absolute top-32 sm:top-40 -left-8 sm:-left-12 w-44 sm:w-60 md:w-72 lg:w-80 opacity-50 -rotate-12 animate-float"
          style={{ animationDuration: "8s", animationDelay: "1s" }}
        />

        {/* Middle Right Voucher - Small */}
        <img
          src="/assets/voucher-25.png"
          alt=""
          className="absolute top-1/3 -right-6 sm:-right-10 w-40 sm:w-52 md:w-64 lg:w-72 opacity-50 rotate-45 animate-float"
          style={{ animationDuration: "7s", animationDelay: "2s" }}
        />

        {/* Bottom Left Voucher - Large */}
        <img
          src="/assets/voucher-25.png"
          alt=""
          className="absolute bottom-20 sm:bottom-32 -left-12 sm:-left-20 w-64 sm:w-80 md:w-[28rem] lg:w-[36rem] opacity-60 -rotate-6 animate-float"
          style={{ animationDuration: "9s", animationDelay: "0.5s" }}
        />

        {/* Bottom Right Voucher - Medium */}
        <img
          src="/assets/voucher-25.png"
          alt=""
          className="absolute bottom-40 sm:bottom-56 -right-8 sm:-right-12 w-48 sm:w-64 md:w-80 lg:w-96 opacity-52 rotate-[20deg] animate-float"
          style={{ animationDuration: "8.5s", animationDelay: "1.5s" }}
        />

        {/* Center Background Voucher - Very Large & Faded */}
        <img
          src="/assets/voucher-25.png"
          alt=""
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[40rem] md:w-[52rem] lg:w-[64rem] opacity-25 rotate-3 animate-float"
          style={{ animationDuration: "12s" }}
        />
      </div>

      <div className="relative z-10 flex items-center pt-4 pl-4 md:pt-8 md:pl-8">
        <img
          src="/assets/logo.png"
          alt="JTik Logo"
          className="w-12 sm:w-16 md:w-24 lg:w-32 object-contain"
        />
      </div>
      <div className="fixed top-0 left-0 w-full z-50 px-4 py-4 md:px-8 md:py-6 flex justify-end items-center">
        <div className="flex items-center gap-2 md:gap-4 text-sm font-semibold text-zinc-400">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 md:px-6 md:py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold hover:from-orange-600 hover:to-red-600 transition-all flex items-center gap-1.5 md:gap-2 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 active:scale-95 text-xs md:text-sm"
          >
            <RefreshCw size={14} className="md:w-4 md:h-4" />
            <span className="hidden sm:inline">Giảm Giá</span>
            <span className="sm:hidden">Hoàn $</span>
          </button>
        </div>
      </div>

      {/* Vùng Hành Động Chính */}
      <section className="relative z-10 pt-0 px-4 sm:px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-blue-600/10 blur-[120px] -z-10 rounded-full pointer-events-none"></div>

        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6 md:mb-8 tracking-tight px-2">
            <span className="gradient-text">Tạo Link Giảm Giá</span>
          </h1>

          <form onSubmit={handleProcessLink} className="relative">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl blur-2xl opacity-40 group-focus-within:opacity-100 transition duration-500 animate-pulse"></div>
              <div className="relative flex flex-col bg-gradient-to-r from-white via-orange-50 to-orange-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-orange-400/60 focus-within:border-orange-500 transition-all shadow-2xl shadow-orange-500/50 backdrop-blur-sm">
                <div className="flex items-center">
                  <div className="pl-3 sm:pl-4 text-orange-600">
                    <LinkIcon
                      size={20}
                      className="sm:w-6 sm:h-6 md:w-[26px] md:h-[26px]"
                    />
                  </div>
                  <div className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2">
                    <p className="text-xs sm:text-sm text-orange-700 font-bold">
                      Nhập link Shopee (mỗi link một dòng)
                    </p>
                    <p className="text-[10px] sm:text-xs text-orange-600/80 mt-0.5 font-medium">
                      Hỗ trợ: shopee.vn, vn.shp.ee, s.shopee.vn
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePasteAndTransform}
                    disabled={loading}
                    className="mr-2 sm:mr-3 p-2.5 sm:p-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-xl shadow-purple-500/40 hover:shadow-purple-500/60 border-2 border-purple-400"
                    title="Paste & Chuyển đổi"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <Clipboard className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </button>
                </div>
                <textarea
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  placeholder="https://shopee.vn/product/...&#10;https://vn.shp.ee/abc123&#10;https://s.shopee.vn/xyz456"
                  className="w-full bg-white/70 backdrop-blur-sm border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-500 text-gray-900 px-3 sm:px-4 py-3 text-sm sm:text-base placeholder:text-orange-400/70 resize-none font-medium shadow-inner"
                  disabled={loading}
                  rows={5}
                />
                <div className="flex justify-stretch sm:justify-end p-2 sm:p-3">
                  <button
                    type="submit"
                    disabled={loading || !urls.trim()}
                    className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold px-8 sm:px-10 py-4 sm:py-5 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-2xl shadow-orange-500/50 hover:shadow-orange-500/70 border-2 border-orange-400"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin w-[18px] h-[18px] sm:w-5 sm:h-5 md:w-[22px] md:h-[22px]" />
                    ) : (
                      <Wand2 className="w-[18px] h-[18px] sm:w-5 sm:h-5 md:w-[22px] md:h-[22px]" />
                    )}
                    <span className="font-bold uppercase tracking-wider text-xs sm:text-sm">
                      Chuyển Đổi{" "}
                      {urls.split("\n").filter((l) => l.trim()).length > 0 &&
                        `(${urls.split("\n").filter((l) => l.trim()).length})`}
                    </span>
                  </button>
                </div>

                {/* Vùng Kết Quả */}
                <div
                  className={`transition-all duration-700 transform ${
                    results.length > 0
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 translate-y-4 scale-95 pointer-events-none h-0 overflow-hidden"
                  }`}
                >
                  {results.length > 0 && (
                    <div className="glass p-1 sm:p-6 rounded-2xl sm:rounded-3xl border-blue-500/30 relative overflow-hidden mb-4">
                      <div className="space-y-2 sm:space-y-3 max-h-[500px] overflow-y-auto">
                        {results.map((result, index) => (
                          <div
                            key={index}
                            className="w-full bg-black/50 border border-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl"
                          >
                            {result.shortLink ? (
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                                <div className="text-left overflow-hidden w-full">
                                  <p className="text-[9px] sm:text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">
                                    Link #{index + 1}
                                  </p>
                                  <p className="text-[10px] sm:text-xs text-gray-400 truncate mb-1.5 sm:mb-2">
                                    {result.originalLink}
                                  </p>
                                  <p className="text-xs sm:text-sm font-mono text-white truncate">
                                    {result.shortLink}
                                  </p>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                  <button
                                    onClick={() =>
                                      handleCopyToClipboard(result.shortLink)
                                    }
                                    className="flex-1 sm:flex-none bg-gray-600 hover:bg-gray-500 text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl flex items-center gap-1.5 sm:gap-2 font-bold transition-all text-xs sm:text-sm justify-center"
                                    title="Copy link"
                                  >
                                    <LinkIcon size={14} className="sm:w-4 sm:h-4" />
                                    Copy
                                  </button>
                                  <button
                                    onClick={() => handleCopy(result.shortLink)}
                                    className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-400 text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl flex items-center gap-1.5 sm:gap-2 font-bold transition-all text-xs sm:text-sm justify-center"
                                  >
                                    <ShoppingCart
                                      size={14}
                                      className="sm:w-4 sm:h-4"
                                    />
                                    Mua
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-left">
                                <p className="text-[9px] sm:text-[10px] text-red-400 font-bold uppercase tracking-widest mb-1">
                                  Link #{index + 1} - Lỗi
                                </p>
                                <p className="text-[10px] sm:text-xs text-gray-400 truncate mb-1">
                                  {result.originalLink}
                                </p>
                                <p className="text-xs sm:text-sm text-red-400">
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

                {/* Social Links */}
                <div className="flex gap-2 sm:gap-3">
                  {/* Facebook Button */}
                  <a
                    href="https://www.facebook.com/share/p/1BbMjxfQTf/?mibextid=wwXIfr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 group/social relative overflow-hidden rounded-lg"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 opacity-90 group-hover/social:opacity-100 transition-all"></div>
                    <div className="relative flex items-center justify-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
                      <div className="p-1.5 bg-white/20 rounded-md group-hover/social:bg-white/30 transition-all">
                        <Facebook className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white font-bold text-xs sm:text-sm leading-tight whitespace-nowrap">
                          Quay lại bài đăng
                        </p>
                        <p className="text-blue-100 text-[10px] sm:text-xs leading-tight hidden sm:block whitespace-nowrap">
                          Săn sale
                        </p>
                      </div>
                    </div>
                  </a>

                  {/* Zalo Button */}
                  <a
                    href="https://zalo.me/g/ecnlna124"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 group/social relative overflow-hidden rounded-lg"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-500 opacity-90 group-hover/social:opacity-100 transition-all"></div>
                    <div className="relative flex items-center justify-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
                      <div className="p-1.5 bg-white/20 rounded-md group-hover/social:bg-white/30 transition-all">
                        <img
                          src="/assets/zalo-icon.png"
                          alt="Zalo"
                          className="w-4 h-4 sm:w-5 sm:h-5 object-contain"
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white font-bold text-xs sm:text-sm leading-tight">
                          Nhóm săn voucher
                        </p>
                        <p className="text-cyan-100 text-[10px] sm:text-xs leading-tight hidden sm:block">
                          Ưu đãi hot
                        </p>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
            {error && (
              <p className="absolute -bottom-8 left-0 right-0 text-red-400 text-xs sm:text-sm font-medium animate-pulse px-2">
                {error}
              </p>
            )}
          </form>

          {/* Voucher Decoration */}
          <div className="flex justify-center items-center my-2 sm:my-8 rounded-md">
            <div className="relative">
              {/* Voucher image */}
              <img
                src="/assets/voucher-25.png"
                alt="Voucher 25%"
                className="w-100 sm:w-56 md:w-64 lg:w-72 object-contain drop-shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Join Community Section */}
      <section className="relative z-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Main Card */}
          <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-all duration-500 animate-pulse"></div>

            {/* Content Card */}
            <div className="relative bg-gradient-to-br from-gray-900/95 via-blue-900/95 to-purple-900/95 backdrop-blur-lg rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden">
              {/* Top Decoration Bar */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

              {/* Floating Icons Background */}
              <div className="absolute inset-0 overflow-hidden opacity-10">
                <div
                  className="absolute top-10 left-10 animate-bounce"
                  style={{ animationDelay: "0s", animationDuration: "3s" }}
                >
                  <Gift size={40} className="text-yellow-400" />
                </div>
                <div
                  className="absolute top-20 right-20 animate-bounce"
                  style={{ animationDelay: "1s", animationDuration: "4s" }}
                >
                  <Tag size={35} className="text-pink-400" />
                </div>
                <div
                  className="absolute bottom-10 left-1/4 animate-bounce"
                  style={{ animationDelay: "2s", animationDuration: "3.5s" }}
                >
                  <Zap size={30} className="text-blue-400" />
                </div>
              </div>

              <div className="relative p-4 sm:p-6 md:p-8">
                {/* Header */}
                <div className="text-center mb-4 sm:mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 mb-3 sm:mb-4">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 animate-pulse" />
                    <span className="text-yellow-400 font-bold text-[10px] sm:text-xs uppercase tracking-wider">
                      Độc Quyền
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">
                    <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Săn Deal & Mã Giảm Giá
                    </span>
                  </h2>

                  <p className="text-gray-300 text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed hidden sm:block">
                    Tham gia cộng đồng của chúng tôi để nhận{" "}
                    <span className="text-yellow-400 font-semibold">
                      mã giảm giá độc quyền
                    </span>
                    ,{" "}
                    <span className="text-pink-400 font-semibold">
                      deal hot
                    </span>{" "}
                    và{" "}
                    <span className="text-blue-400 font-semibold">
                      voucher hấp dẫn
                    </span>{" "}
                    mỗi ngày!
                  </p>
                </div>

                {/* Benefits */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-full mb-1.5 sm:mb-2">
                      <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    </div>
                    <h3 className="text-white font-bold text-[10px] sm:text-xs md:text-sm mb-0.5 sm:mb-1">
                      Deal Hàng Ngày
                    </h3>
                    <p className="text-gray-400 text-[9px] sm:text-xs hidden sm:block">
                      Cập nhật liên tục
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/20 rounded-full mb-1.5 sm:mb-2">
                      <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                    </div>
                    <h3 className="text-white font-bold text-[10px] sm:text-xs md:text-sm mb-0.5 sm:mb-1">
                      Mã Độc Quyền
                    </h3>
                    <p className="text-gray-400 text-[9px] sm:text-xs hidden sm:block">
                      Chỉ dành riêng cho thành viên
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border border-pink-500/20 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-pink-500/20 rounded-full mb-1.5 sm:mb-2">
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
                    </div>
                    <h3 className="text-white font-bold text-[10px] sm:text-xs md:text-sm mb-0.5 sm:mb-1">
                      Hỗ Trợ Nhanh
                    </h3>
                    <p className="text-gray-400 text-[9px] sm:text-xs hidden sm:block">
                      Giải đáp mọi thắc mắc
                    </p>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="mt-4 sm:mt-6 text-center">
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 text-gray-400 text-[10px] sm:text-xs">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>
                      <span className="hidden sm:inline">Đã có hơn </span>
                      <strong className="text-white">1,000+</strong>{" "}
                      <span className="hidden sm:inline">thành viên săn voucher thành công</span>
                      <span className="sm:hidden">thành viên</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-12 sm:mt-16 md:mt-20 border-t border-white/5 py-6 sm:py-8 md:py-10 text-center text-zinc-600 text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em]">
        <p>&copy; Copyright &bull; Just J 2026</p>
      </footer>

      {/* Bank Information Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 md:p-8 relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-white transition-colors p-1.5 sm:p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 sm:mb-5 md:mb-6 pr-8 sm:pr-10">
              Thông Tin Nhận Giảm Giá
            </h2>

            <form
              onSubmit={handleBankInfoSubmit}
              className="space-y-3 sm:space-y-4"
            >
              <div className="relative">
                <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-blue-400">
                  <Package className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </div>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Mã đơn hàng"
                  className="w-full bg-black/30 border border-white/10 rounded-lg sm:rounded-xl px-10 sm:px-12 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-blue-400">
                  <Phone className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Số điện thoại"
                  className="w-full bg-black/30 border border-white/10 rounded-lg sm:rounded-xl px-10 sm:px-12 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-blue-400">
                  <Building2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </div>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Tên ngân hàng"
                  className="w-full bg-black/30 border border-white/10 rounded-lg sm:rounded-xl px-10 sm:px-12 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-blue-400">
                  <CreditCard className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </div>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Số tài khoản"
                  className="w-full bg-black/30 border border-white/10 rounded-lg sm:rounded-xl px-10 sm:px-12 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-blue-400">
                  <User className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </div>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Tên chủ tài khoản"
                  className="w-full bg-black/30 border border-white/10 rounded-lg sm:rounded-xl px-10 sm:px-12 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="flex gap-2 sm:gap-3 pt-1 sm:pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all active:scale-95 text-sm sm:text-base"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all active:scale-95 shadow-lg text-sm sm:text-base"
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
          <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black border border-green-500/20 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 max-w-lg w-full shadow-2xl">
            {/* Success Icon */}
            <div className="text-center mb-4 sm:mb-5 md:mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-3 sm:mb-4 shadow-lg shadow-green-500/30">
                <Check className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1.5 sm:mb-2">
                🎉 Đăng Ký Thành Công!
              </h2>
              <p className="text-sm sm:text-base text-green-400 font-medium">
                Thông tin Giảm Giá đã được ghi nhận
              </p>
            </div>

            {/* Success Message */}
            <div className="bg-black/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 border border-white/10">
              <div className="hidden sm:flex items-start gap-3 mb-4">
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
                      Quay lại JPee để nhập thông tin Giảm Giá
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="p-1 bg-yellow-500/20 rounded-lg">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="text-yellow-400 font-medium text-xs sm:text-sm mb-1">
                      Lưu ý:
                    </h4>
                    <p className="text-gray-300 text-xs sm:text-sm">
                      Thời gian xử lý{" "}
                      <strong className="text-white">
                        10-12 ngày làm việc
                      </strong>
                      <span className="hidden sm:inline">
                        . Tiền hoàn sẽ được chuyển vào tài khoản ngân hàng bạn
                        đã đăng ký
                      </span>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 sm:py-4 rounded-lg sm:rounded-xl transition-all active:scale-95 shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Check className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="sm:hidden">Đóng</span>
              <span className="hidden sm:inline">
                Đã hiểu, tiếp tục mua sắm
              </span>
            </button>
          </div>
        </div>
      )}
      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-gradient-to-br from-red-900/90 via-gray-900 to-black border border-red-500/30 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Error Icon */}
            <div className="text-center mb-4 sm:mb-5 md:mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-red-500 to-rose-500 rounded-full mb-3 sm:mb-4 shadow-lg shadow-red-500/30">
                <X className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1.5 sm:mb-2">
                ⚠️ Không Thể Ghi Nhận
              </h2>
              <p className="text-sm sm:text-base text-red-400 font-medium">
                Đơn hàng đã tồn tại
              </p>
            </div>

            {/* Error Message */}
            <div className="bg-black/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 border border-red-500/20">
              <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-1.5 sm:p-2 bg-red-500/20 rounded-lg mt-1">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-white text-sm sm:text-base leading-relaxed mb-2 sm:mb-3">
                    {errorMessage}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="p-1 bg-yellow-500/20 rounded-lg">
                    <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="text-yellow-400 font-medium text-xs sm:text-sm mb-1">
                      Liên hệ:
                    </h4>
                    <p className="text-white text-xs sm:text-sm font-semibold">
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
              className="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-bold py-3 sm:py-4 rounded-lg sm:rounded-xl transition-all active:scale-95 shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Link Error Modal */}
      {showLinkErrorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-gradient-to-br from-orange-900/90 via-gray-900 to-black border border-orange-500/30 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Error Icon */}
            <div className="text-center mb-4 sm:mb-5 md:mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mb-3 sm:mb-4 shadow-lg shadow-orange-500/30">
                <X className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1.5 sm:mb-2">
                ⚠️ Link Không Hợp Lệ
              </h2>
              <p className="text-sm sm:text-base text-orange-400 font-medium">
                {linkErrors.length > 0
                  ? `${linkErrors.length} link không thể chuyển đổi`
                  : "Có lỗi xảy ra khi chuyển đổi link"}
              </p>
            </div>

            {/* Error Details */}
            {linkErrors.length > 0 && (
              <div className="bg-black/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-3 sm:mb-4 border border-orange-500/20 max-h-32 sm:max-h-40 overflow-y-auto">
                <h3 className="text-white font-semibold text-xs sm:text-sm mb-2">
                  Các link lỗi:
                </h3>
                <div className="space-y-1.5 sm:space-y-2">
                  {linkErrors.slice(0, 2).map((err, idx) => (
                    <div key={idx} className="text-xs">
                      <p className="text-gray-400 truncate">
                        {err.originalLink}
                      </p>
                      <p className="text-red-400">
                        {err.error || "Không thể chuyển đổi"}
                      </p>
                    </div>
                  ))}
                  {linkErrors.length > 2 && (
                    <p className="text-gray-500 text-xs italic">
                      và {linkErrors.length - 2} link khác...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Supported Links Section */}
            <div className="bg-black/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 mb-3 sm:mb-4 border border-white/10">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg mt-0.5 sm:mt-1">
                  <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                    Link hỗ trợ:
                  </h3>
                  <div className="space-y-1.5 sm:space-y-2 text-sm">
                    <div className="bg-blue-500/10 rounded-lg p-2 sm:p-3 border border-blue-500/20">
                      <p className="text-blue-300 font-mono text-[10px] sm:text-xs">
                        shopee.vn/product/...
                      </p>
                      <p className="text-gray-400 text-[10px] sm:text-xs mt-0.5 sm:mt-1 hidden sm:block">
                        Link sản phẩm Shopee đầy đủ
                      </p>
                    </div>
                    <div className="bg-blue-500/10 rounded-lg p-2 sm:p-3 border border-blue-500/20 hidden sm:block">
                      <p className="text-blue-300 font-mono text-xs">
                        vn.shp.ee/...
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Link rút gọn Shopee
                      </p>
                    </div>
                    <div className="bg-blue-500/10 rounded-lg p-2 sm:p-3 border border-blue-500/20 hidden sm:block">
                      <p className="text-blue-300 font-mono text-xs">
                        s.shopee.vn/...
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Link rút gọn Shopee VN
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Support Section */}
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-5 md:mb-6">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="p-1 bg-yellow-500/20 rounded-lg">
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-yellow-400 font-medium text-xs sm:text-sm mb-1 sm:mb-2">
                    Cần trợ giúp?
                  </h4>
                  <p className="text-gray-300 text-xs sm:text-sm mb-1.5 sm:mb-2 hidden sm:block">
                    Link đúng định dạng nhưng vẫn lỗi? Liên hệ:
                  </p>
                  <p className="text-white text-xs sm:text-sm font-semibold">
                    <span className="hidden sm:inline">SĐT / Zalo: </span>
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

            {/* Action Button */}
            <button
              onClick={() => {
                setShowLinkErrorModal(false);
                setLinkErrors([]);
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 sm:py-4 rounded-lg sm:rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
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
