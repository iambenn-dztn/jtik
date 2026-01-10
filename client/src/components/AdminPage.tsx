import React, { useState, useEffect, useCallback } from "react";
import {
  Database,
  Download,
  Eye,
  Calendar,
  Trash2,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Users,
  TrendingUp,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Lock,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface Customer {
  id: string;
  phone: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  orderId: string;
  createdAt: string;
  updatedAt: string;
  status: "active" | "paid" | "deleted";
}

interface Account {
  id: string;
  username: string;
  password: string;
  status: "active" | "inactive" | "deleted";
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

interface Statistics {
  total: number;
  recent24h: number;
  paid: number;
  deleted: number;
  active: number;
}

function AdminPage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    recent24h: 0,
    paid: 0,
    deleted: 0,
    active: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Account management states
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accountForm, setAccountForm] = useState({
    username: "",
    password: "",
  });
  const [accountModalMode, setAccountModalMode] = useState<
    "view" | "add" | "edit"
  >("view");

  // Filter and Search states
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "paid" | "deleted"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"orderId" | "phone">("orderId");

  const fetchCustomers = useCallback(async () => {
    try {
      // Build query parameters
      const params = new URLSearchParams();

      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      const url = `http://localhost:3001/api/shopee/customers${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setCustomers(result.data);
        setStatistics(result.statistics);
      } else {
        console.error("Failed to fetch customers");
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCustomers();
  };

  const updateCustomerStatus = async (
    id: string,
    status: "active" | "paid" | "deleted"
  ) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/shopee/customers/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (response.ok) {
        // Refresh data after status update
        await fetchCustomers();
      } else {
        console.error("Failed to update customer status");
      }
    } catch (error) {
      console.error("Error updating customer status:", error);
    }
  };

  const deleteCustomer = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa khách hàng này?")) {
      try {
        const response = await fetch(
          `http://localhost:3001/api/shopee/customers/${id}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          await fetchCustomers(); // Refresh the list
        } else {
          console.error("Failed to delete customer");
        }
      } catch (error) {
        console.error("Error deleting customer:", error);
      }
    }
  };

  // Account management functions
  const fetchAccounts = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/shopee/accounts");
      const result = await response.json();

      if (result.success) {
        setAccounts(result.data);
      } else {
        console.error("Failed to fetch accounts");
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url =
        accountModalMode === "add"
          ? "http://localhost:3001/api/shopee/accounts"
          : `http://localhost:3001/api/shopee/accounts/${selectedAccount?.id}`;

      const method = accountModalMode === "add" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: accountForm.username,
          password: accountForm.password,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(result.message || "Account saved successfully!");
        setShowAccountModal(false);
        setAccountForm({ username: "", password: "" });
        setSelectedAccount(null);
        fetchAccounts();
      } else {
        alert(result.error || "Failed to save account");
      }
    } catch (error) {
      console.error("Error saving account:", error);
      alert("Error saving account");
    }
  };

  const updateAccountStatus = async (
    id: string,
    status: "active" | "inactive" | "deleted"
  ) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/shopee/accounts/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (response.ok) {
        fetchAccounts();
      } else {
        console.error("Failed to update account status");
      }
    } catch (error) {
      console.error("Error updating account status:", error);
    }
  };

  const deleteAccount = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) {
      try {
        const response = await fetch(
          `http://localhost:3001/api/shopee/accounts/${id}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          fetchAccounts();
        } else {
          console.error("Failed to delete account");
        }
      } catch (error) {
        console.error("Error deleting account:", error);
      }
    }
  };

  const openAccountModal = (
    mode: "view" | "add" | "edit",
    account?: Account
  ) => {
    setAccountModalMode(mode);
    setSelectedAccount(account || null);

    if (mode === "add") {
      setAccountForm({ username: "", password: "" });
    } else if (mode === "edit" && account) {
      setAccountForm({
        username: account.username,
        password: account.password,
      });
    }

    if (mode === "view" && !accounts.length) {
      fetchAccounts();
    }

    setShowAccountModal(true);
  };

  // Handle filter/search changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isAuthenticated) {
        fetchCustomers();
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [fetchCustomers, isAuthenticated]);

  // Authentication function
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      const response = await fetch(
        "http://localhost:3001/api/shopee/admin/auth",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        setShowAuthModal(false);
        setPassword("");
      } else {
        setAuthError(data.message || "Invalid password");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setAuthError("Connection error. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Redirect to home if auth fails
  const handleAuthCancel = () => {
    navigate("/");
  };

  // Initial load when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomers();
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 text-white">
      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-800 border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="p-4 bg-blue-500/20 rounded-full w-fit mx-auto mb-4">
                <Lock size={32} className="text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Admin Access</h2>
              <p className="text-gray-400">
                Nhập mật khẩu để truy cập trang quản trị
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  disabled={authLoading}
                  autoFocus
                />
              </div>

              {authError && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <XCircle size={16} />
                  {authError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAuthCancel}
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-500/30 text-gray-300 hover:bg-gray-500/10 transition-all"
                  disabled={authLoading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={authLoading || !password}
                  className="flex-1 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {authLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang kiểm tra...
                    </>
                  ) : (
                    "Truy cập"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content - Only show if authenticated */}
      {isAuthenticated && (
        <>
          {/* Header */}
          <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Link
                    to="/"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-500/30 text-gray-300 hover:bg-gray-500/10 transition-all"
                  >
                    <ArrowLeft size={18} />
                    Quay lại
                  </Link>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Database size={24} className="text-blue-400" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold">Quản Lý Khách Hàng</h1>
                      <p className="text-gray-400 text-sm">
                        Trang quản trị hệ thống
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openAccountModal("view")}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-all"
                  >
                    <Users size={16} />
                    Quản lý Account
                  </button>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-all disabled:opacity-50"
                  >
                    <RefreshCw
                      size={16}
                      className={refreshing ? "animate-spin" : ""}
                    />
                    Refresh
                  </button>
                  <button
                    onClick={() =>
                      window.open(
                        "http://localhost:3001/api/shopee/customers/export",
                        "_blank"
                      )
                    }
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition-all"
                  >
                    <Download size={16} />
                    Tải Excel
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <Users size={24} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Tổng khách hàng</p>
                    <p className="text-2xl font-bold text-white">
                      {loading ? "..." : statistics.total}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/20 rounded-xl">
                    <TrendingUp size={24} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Mới trong 24h</p>
                    <p className="text-2xl font-bold text-white">
                      {loading ? "..." : statistics.recent24h}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-500/20 rounded-xl">
                    <CheckCircle size={24} className="text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Đã thanh toán</p>
                    <p className="text-2xl font-bold text-white">
                      {loading ? "..." : statistics.paid}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <Clock size={24} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Chưa thanh toán</p>
                    <p className="text-2xl font-bold text-green-400">
                      {loading ? "..." : statistics.active}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and Search Controls */}
            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Status Filter */}
                <div className="flex items-center gap-3">
                  <Filter size={16} className="text-gray-400" />
                  <label className="text-sm text-gray-400 font-medium">
                    Trạng thái:
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(
                        e.target.value as "all" | "active" | "paid" | "deleted"
                      )
                    }
                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">Tất cả</option>
                    <option value="active">Hoạt động</option>
                    <option value="paid">Đã thanh toán</option>
                    <option value="deleted">Đã xóa</option>
                  </select>
                </div>

                {/* Search Controls */}
                <div className="flex items-center gap-3 flex-1">
                  <Search size={16} className="text-gray-400" />
                  <select
                    value={searchType}
                    onChange={(e) =>
                      setSearchType(e.target.value as "orderId" | "phone")
                    }
                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="orderId">Mã đơn hàng</option>
                    <option value="phone">Số điện thoại</option>
                  </select>
                  <div className="relative flex-1 max-w-md">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        searchType === "orderId"
                          ? "Tìm theo mã đơn hàng..."
                          : "Tìm theo số điện thoại..."
                      }
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Results count */}
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>Hiển thị:</span>
                  <span className="text-white font-semibold">
                    {customers.length}
                  </span>
                  <span>kết quả</span>
                </div>
              </div>
            </div>

            {/* Customer Table */}
            <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Danh Sách Khách Hàng</h2>
                    <p className="text-gray-400 text-sm">
                      Quản lý thông tin và dữ liệu khách hàng
                    </p>
                  </div>
                  <div className="text-sm text-gray-400">
                    {loading ? "Đang tải..." : `${customers.length} khách hàng`}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="flex items-center gap-3 text-gray-400">
                      <Loader2 className="animate-spin" size={24} />
                      <span>Đang tải dữ liệu...</span>
                    </div>
                  </div>
                ) : customers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Database size={48} className="mb-4 opacity-50" />
                    <p className="text-lg font-medium">
                      {customers.length === 0
                        ? "Chưa có dữ liệu khách hàng"
                        : "Không tìm thấy kết quả"}
                    </p>
                    <p className="text-sm">
                      {customers.length === 0
                        ? "Hãy thêm thông tin khách hàng đầu tiên"
                        : "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"}
                    </p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="text-left p-4 font-semibold text-gray-300">
                          ID
                        </th>
                        <th className="text-left p-4 font-semibold text-gray-300">
                          Trạng thái
                        </th>
                        <th className="text-left p-4 font-semibold text-gray-300">
                          Số ĐT
                        </th>
                        <th className="text-left p-4 font-semibold text-gray-300">
                          Ngân hàng
                        </th>
                        <th className="text-left p-4 font-semibold text-gray-300">
                          Số TK
                        </th>
                        <th className="text-left p-4 font-semibold text-gray-300">
                          Tên chủ TK
                        </th>
                        <th className="text-left p-4 font-semibold text-gray-300">
                          Mã ĐH
                        </th>
                        <th className="text-left p-4 font-semibold text-gray-300">
                          Ngày tạo
                        </th>
                        <th className="text-left p-4 font-semibold text-gray-300">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer, index) => (
                        <tr
                          key={customer.id}
                          className={`border-t border-white/5 hover:bg-white/5 transition-colors ${
                            index % 2 === 0 ? "bg-white/2" : ""
                          }`}
                        >
                          <td className="p-4">
                            <span className="text-blue-400 font-mono">
                              #{index + 1}
                            </span>
                          </td>
                          <td className="p-4">
                            {customer.status === "paid" ? (
                              <span className="flex items-center gap-2 text-green-400 text-sm">
                                <CheckCircle size={16} />
                                Đã thanh toán
                              </span>
                            ) : customer.status === "deleted" ? (
                              <span className="flex items-center gap-2 text-red-400 text-sm">
                                <XCircle size={16} />
                                Đã xóa
                              </span>
                            ) : (
                              <span className="flex items-center gap-2 text-blue-400 text-sm">
                                <Clock size={16} />
                                Hoạt động
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="text-white font-medium">
                              {customer.phone}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-gray-300">
                              {customer.bankName}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-gray-300 font-mono">
                              {customer.accountNumber}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-gray-300">
                              {customer.accountName}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-orange-400 font-mono">
                              {customer.orderId}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1 text-gray-500 text-sm">
                              <Calendar size={14} />
                              {new Date(customer.createdAt).toLocaleDateString(
                                "vi-VN"
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {customer.status === "active" && (
                                <button
                                  onClick={() =>
                                    updateCustomerStatus(customer.id, "paid")
                                  }
                                  className="text-green-400 hover:text-green-300 transition-colors p-1 hover:bg-green-500/10 rounded"
                                  title="Đánh dấu đã thanh toán"
                                >
                                  <CheckCircle size={16} />
                                </button>
                              )}
                              {customer.status !== "deleted" && (
                                <button
                                  onClick={() => deleteCustomer(customer.id)}
                                  className="text-red-400 hover:text-red-300 transition-colors p-1 hover:bg-red-500/10 rounded"
                                  title="Xóa khách hàng"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer */}
              {!loading && customers.length > 0 && (
                <div className="p-6 border-t border-white/10 bg-white/2">
                  <div className="flex items-center justify-between">
                    <div className="text-gray-400 text-sm">
                      Hiển thị{" "}
                      <span className="text-white font-semibold">
                        {customers.length}
                      </span>{" "}
                      khách hàng
                      {(statusFilter !== "all" || searchQuery) && (
                        <span className="ml-2 text-blue-400">(đã lọc)</span>
                      )}
                    </div>
                    <div className="text-gray-400 text-sm">
                      Cập nhật lần cuối: {new Date().toLocaleString("vi-VN")}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Account Management Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users size={24} className="text-green-400" />
                  Quản lý Account
                </h2>
                <button
                  onClick={() => setShowAccountModal(false)}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Action buttons */}
              <div className="mb-6 flex gap-3">
                <button
                  onClick={() => openAccountModal("add")}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Users size={16} />
                  Thêm Account
                </button>
              </div>

              {/* Accounts List */}
              {accountModalMode === "view" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">
                    Danh sách Account
                  </h3>
                  {accounts.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">
                      Chưa có account nào
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="text-gray-400 border-b border-gray-700">
                            <th className="text-left p-3">Username</th>
                            <th className="text-left p-3">Status</th>
                            <th className="text-left p-3">Created</th>
                            <th className="text-left p-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accounts.map((account) => (
                            <tr
                              key={account.id}
                              className="border-b border-gray-700/50 hover:bg-gray-700/30"
                            >
                              <td className="p-3 text-white font-medium">
                                {account.username}
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    account.status === "active"
                                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                      : account.status === "inactive"
                                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                                  }`}
                                >
                                  {account.status}
                                </span>
                              </td>
                              <td className="p-3 text-gray-400">
                                {new Date(account.createdAt).toLocaleDateString(
                                  "vi-VN"
                                )}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      openAccountModal("edit", account)
                                    }
                                    className="text-blue-400 hover:text-blue-300 transition-colors p-1 hover:bg-blue-500/10 rounded"
                                    title="Sửa account"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  {account.status !== "deleted" && (
                                    <>
                                      <button
                                        onClick={() =>
                                          updateAccountStatus(
                                            account.id,
                                            account.status === "active"
                                              ? "inactive"
                                              : "active"
                                          )
                                        }
                                        className={`transition-colors p-1 rounded ${
                                          account.status === "active"
                                            ? "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                                            : "text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                        }`}
                                        title={
                                          account.status === "active"
                                            ? "Tạm khóa"
                                            : "Kích hoạt"
                                        }
                                      >
                                        {account.status === "active" ? (
                                          <XCircle size={16} />
                                        ) : (
                                          <CheckCircle size={16} />
                                        )}
                                      </button>
                                      <button
                                        onClick={() =>
                                          deleteAccount(account.id)
                                        }
                                        className="text-red-400 hover:text-red-300 transition-colors p-1 hover:bg-red-500/10 rounded"
                                        title="Xóa account"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Add/Edit Account Form */}
              {(accountModalMode === "add" || accountModalMode === "edit") && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      {accountModalMode === "add"
                        ? "Thêm Account Mới"
                        : "Sửa Account"}
                    </h3>
                    <button
                      onClick={() => setAccountModalMode("view")}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      ← Quay lại
                    </button>
                  </div>

                  <form onSubmit={handleAccountSubmit} className="space-y-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        value={accountForm.username}
                        onChange={(e) =>
                          setAccountForm((prev) => ({
                            ...prev,
                            username: e.target.value,
                          }))
                        }
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                        placeholder="Nhập username..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Password
                      </label>
                      <input
                        type="text"
                        value={accountForm.password}
                        onChange={(e) =>
                          setAccountForm((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                        placeholder="Nhập password..."
                        required={accountModalMode === "add"}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <CheckCircle size={16} />
                        {accountModalMode === "add"
                          ? "Thêm Account"
                          : "Cập nhật Account"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountModalMode("view")}
                        className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
