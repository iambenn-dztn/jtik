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
  LogOut,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import config from "../config/api";
import * as authService from "../services/authService";

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
  affiliateId: string;
  status: "active" | "inactive" | "deleted";
  createdAt: string;
  updatedAt: string;
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
  const [username, setUsername] = useState<string | null>(null);

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
    affiliateId: "",
  });
  const [accountModalMode, setAccountModalMode] = useState<
    "view" | "add" | "edit"
  >("view");

  // Change Password states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

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

      const url = `${config.endpoints.customers}${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const response = await authService.authenticatedFetch(url);
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
    status: "active" | "paid" | "deleted",
  ) => {
    try {
      const response = await authService.authenticatedFetch(
        `${config.endpoints.customers}/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
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
        const response = await authService.authenticatedFetch(
          `${config.endpoints.customers}/${id}`,
          {
            method: "DELETE",
          },
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

  const handleExportCustomers = async () => {
    try {
      const response = await authService.authenticatedFetch(
        config.endpoints.exportCustomers,
      );

      if (!response.ok) {
        throw new Error("Failed to export customers");
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = `customers_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting customers:", error);
      alert("Không thể xuất file Excel. Vui lòng thử lại.");
    }
  };

  // Account management functions
  const fetchAccounts = async () => {
    try {
      const response = await authService.authenticatedFetch(
        config.endpoints.accounts,
      );
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
          ? config.endpoints.accounts
          : `${config.endpoints.accounts}/${selectedAccount?.id}`;

      const method = accountModalMode === "add" ? "POST" : "PUT";

      const response = await authService.authenticatedFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: accountForm.username,
          affiliateId: accountForm.affiliateId,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(result.message || "Account saved successfully!");
        setShowAccountModal(false);
        setAccountForm({ username: "", affiliateId: "" });
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
    status: "active" | "inactive" | "deleted",
  ) => {
    try {
      const response = await authService.authenticatedFetch(
        `${config.endpoints.accounts}/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
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
        const response = await authService.authenticatedFetch(
          `${config.endpoints.accounts}/${id}`,
          {
            method: "DELETE",
          },
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
    account?: Account,
  ) => {
    setAccountModalMode(mode);
    setSelectedAccount(account || null);

    if (mode === "add") {
      setAccountForm({ username: "", affiliateId: "" });
    } else if (mode === "edit" && account) {
      setAccountForm({
        username: account.username,
        affiliateId: account.affiliateId,
      });
    }

    if (mode === "view" && !accounts.length) {
      fetchAccounts();
    }

    setShowAccountModal(true);
  };

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = authService.isAuthenticated();
      const storedUsername = authService.getUsername();

      if (!isAuth) {
        // Redirect to login if not authenticated
        navigate("/admin/login");
      } else {
        setIsAuthenticated(true);
        setUsername(storedUsername);
      }
    };

    checkAuth();
  }, [navigate]);

  // Handle filter/search changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isAuthenticated) {
        fetchCustomers();
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [fetchCustomers, isAuthenticated]);

  // Handle logout
  const handleLogout = async () => {
    const refreshToken = authService.getRefreshToken();
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    navigate("/admin/login");
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    // Validate
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Mật khẩu mới không khớp");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    try {
      await authService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
      );
      setPasswordSuccess(true);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (error: any) {
      setPasswordError(error.message || "Đổi mật khẩu thất bại");
    }
  };

  // Initial load when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomers();
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 text-white">
      {/* Main Content - Only show if authenticated */}
      {isAuthenticated && (
        <>
          {/* Header */}
          <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full lg:w-auto">
                  <Link
                    to="/"
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border border-gray-500/30 text-gray-300 hover:bg-gray-500/10 transition-all"
                  >
                    <ArrowLeft size={18} />
                    <span className="hidden sm:inline">Quay lại</span>
                  </Link>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Database size={24} className="text-blue-400" />
                    </div>
                    <div>
                      <h1 className="text-lg sm:text-2xl font-bold">
                        Quản Lý Khách Hàng
                      </h1>
                      <p className="text-gray-400 text-xs sm:text-sm">
                        {username}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm"
                    title="Logout"
                  >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 transition-all text-sm"
                    title="Đổi mật khẩu"
                  >
                    <Lock size={16} />
                    <span className="hidden md:inline">Đổi MK</span>
                  </button>
                  <button
                    onClick={() => openAccountModal("view")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-all text-sm"
                    title="Quản lý Account"
                  >
                    <Users size={16} />
                    <span className="hidden md:inline">Account</span>
                  </button>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-all disabled:opacity-50 text-sm"
                    title="Refresh"
                  >
                    <RefreshCw
                      size={16}
                      className={refreshing ? "animate-spin" : ""}
                    />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                  <button
                    onClick={handleExportCustomers}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition-all text-sm"
                    title="Tải Excel"
                  >
                    <Download size={16} />
                    <span className="hidden sm:inline">Excel</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
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
            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex flex-col gap-3 sm:gap-4">
                {/* Status Filter - Full width on mobile */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <Filter size={16} className="text-gray-400 flex-shrink-0" />
                  <label className="text-sm text-gray-400 font-medium whitespace-nowrap">
                    Trạng thái:
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(
                        e.target.value as "all" | "active" | "paid" | "deleted",
                      )
                    }
                    className="flex-1 sm:flex-none bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">Tất cả</option>
                    <option value="active">Hoạt động</option>
                    <option value="paid">Đã thanh toán</option>
                    <option value="deleted">Đã xóa</option>
                  </select>
                </div>

                {/* Search Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Search size={16} className="text-gray-400 flex-shrink-0" />
                    <select
                      value={searchType}
                      onChange={(e) =>
                        setSearchType(e.target.value as "orderId" | "phone")
                      }
                      className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="orderId">Mã ĐH</option>
                      <option value="phone">Số ĐT</option>
                    </select>
                  </div>
                  <div className="relative flex-1">
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
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
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
              <div className="p-4 sm:p-6 border-b border-white/10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold">
                      Danh Sách Khách Hàng
                    </h2>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Quản lý thông tin và dữ liệu khách hàng
                    </p>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-400">
                    {loading ? "Đang tải..." : `${customers.length} khách hàng`}
                  </div>
                </div>
              </div>

              {/* Desktop table view */}
              <div className="hidden lg:block overflow-x-auto">
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
                                "vi-VN",
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

              {/* Mobile card view */}
              <div className="lg:hidden">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3 text-gray-400">
                      <Loader2 className="animate-spin" size={24} />
                      <span className="text-sm">Đang tải...</span>
                    </div>
                  </div>
                ) : customers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400 px-4">
                    <Database size={40} className="mb-3 opacity-50" />
                    <p className="text-base font-medium text-center">
                      {customers.length === 0
                        ? "Chưa có dữ liệu"
                        : "Không tìm thấy"}
                    </p>
                    <p className="text-xs text-center">
                      {customers.length === 0
                        ? "Hãy thêm khách hàng đầu tiên"
                        : "Thử thay đổi bộ lọc"}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {customers.map((customer, index) => (
                      <div
                        key={customer.id}
                        className="p-4 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-400 font-mono text-sm">
                              #{index + 1}
                            </span>
                            {customer.status === "paid" ? (
                              <span className="flex items-center gap-1 text-green-400 text-xs">
                                <CheckCircle size={14} />
                                Đã TT
                              </span>
                            ) : customer.status === "deleted" ? (
                              <span className="flex items-center gap-1 text-red-400 text-xs">
                                <XCircle size={14} />
                                Đã xóa
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-blue-400 text-xs">
                                <Clock size={14} />
                                Active
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {customer.status === "active" && (
                              <button
                                onClick={() =>
                                  updateCustomerStatus(customer.id, "paid")
                                }
                                className="text-green-400 hover:text-green-300 transition-colors p-1.5 hover:bg-green-500/10 rounded"
                                title="Đánh dấu đã thanh toán"
                              >
                                <CheckCircle size={18} />
                              </button>
                            )}
                            {customer.status !== "deleted" && (
                              <button
                                onClick={() => deleteCustomer(customer.id)}
                                className="text-red-400 hover:text-red-300 transition-colors p-1.5 hover:bg-red-500/10 rounded"
                                title="Xóa khách hàng"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">SĐT:</span>
                            <span className="text-white font-medium">
                              {customer.phone}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Ngân hàng:</span>
                            <span className="text-gray-300">
                              {customer.bankName}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Số TK:</span>
                            <span className="text-gray-300 font-mono text-xs">
                              {customer.accountNumber}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Tên TK:</span>
                            <span className="text-gray-300 text-xs">
                              {customer.accountName}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Mã ĐH:</span>
                            <span className="text-orange-400 font-mono text-xs">
                              {customer.orderId}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-gray-400">Ngày tạo:</span>
                            <div className="flex items-center gap-1 text-gray-500 text-xs">
                              <Calendar size={12} />
                              {new Date(customer.createdAt).toLocaleDateString(
                                "vi-VN",
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {!loading && customers.length > 0 && (
                <div className="p-4 sm:p-6 border-t border-white/10 bg-white/2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="text-gray-400 text-xs sm:text-sm">
                      Hiển thị{" "}
                      <span className="text-white font-semibold">
                        {customers.length}
                      </span>{" "}
                      khách hàng
                      {(statusFilter !== "all" || searchQuery) && (
                        <span className="ml-2 text-blue-400">(đã lọc)</span>
                      )}
                    </div>
                    <div className="text-gray-400 text-xs sm:text-sm">
                      Cập nhật:{" "}
                      {new Date().toLocaleString("vi-VN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Users size={20} className="text-green-400" />
                  <span className="hidden sm:inline">Quản lý Account</span>
                  <span className="sm:hidden">Account</span>
                </h2>
                <button
                  onClick={() => setShowAccountModal(false)}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6">
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
                    <>
                      {/* Desktop table */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="text-gray-400 border-b border-gray-700">
                              <th className="text-left p-3">Username</th>
                              <th className="text-left p-3">Affiliate ID</th>
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
                                <td className="p-3 text-gray-300 font-mono text-sm">
                                  {account.affiliateId}
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
                                  {new Date(
                                    account.createdAt,
                                  ).toLocaleDateString("vi-VN")}
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
                                                : "active",
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

                      {/* Mobile card view */}
                      <div className="md:hidden space-y-3">
                        {accounts.map((account) => (
                          <div
                            key={account.id}
                            className="bg-gray-700/30 border border-gray-700/50 rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="text-white font-medium">
                                  {account.username}
                                </h4>
                                <p className="text-gray-400 font-mono text-xs mt-1">
                                  {account.affiliateId}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                  account.status === "active"
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : account.status === "inactive"
                                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                                }`}
                              >
                                {account.status}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                              <div className="flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(account.createdAt).toLocaleDateString(
                                  "vi-VN",
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-gray-700/50">
                              <button
                                onClick={() =>
                                  openAccountModal("edit", account)
                                }
                                className="flex-1 flex items-center justify-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors py-2 px-3 hover:bg-blue-500/10 rounded text-sm"
                              >
                                <Eye size={14} />
                                Sửa
                              </button>
                              {account.status !== "deleted" && (
                                <>
                                  <button
                                    onClick={() =>
                                      updateAccountStatus(
                                        account.id,
                                        account.status === "active"
                                          ? "inactive"
                                          : "active",
                                      )
                                    }
                                    className={`flex-1 flex items-center justify-center gap-1.5 transition-colors py-2 px-3 rounded text-sm ${
                                      account.status === "active"
                                        ? "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                                        : "text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                    }`}
                                  >
                                    {account.status === "active" ? (
                                      <>
                                        <XCircle size={14} />
                                        Khóa
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle size={14} />
                                        Mở
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => deleteAccount(account.id)}
                                    className="flex-1 flex items-center justify-center gap-1.5 text-red-400 hover:text-red-300 transition-colors py-2 px-3 hover:bg-red-500/10 rounded text-sm"
                                  >
                                    <Trash2 size={14} />
                                    Xóa
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
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
                        Affiliate ID
                      </label>
                      <input
                        type="text"
                        value={accountForm.affiliateId}
                        onChange={(e) =>
                          setAccountForm((prev) => ({
                            ...prev,
                            affiliateId: e.target.value,
                          }))
                        }
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none font-mono"
                        placeholder="Nhập affiliate ID (VD: 17313710081)..."
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

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-md w-full mx-2">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Lock size={20} className="text-yellow-400" />
                  Đổi mật khẩu
                </h2>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                    setPasswordError("");
                    setPasswordSuccess(false);
                  }}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6">
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                    placeholder="Nhập mật khẩu hiện tại..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..."
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                    placeholder="Nhập lại mật khẩu mới..."
                    required
                    minLength={6}
                  />
                </div>

                {/* Error Message */}
                {passwordError && (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {passwordError}
                  </div>
                )}

                {/* Success Message */}
                {passwordSuccess && (
                  <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm flex items-center gap-2">
                    <CheckCircle size={16} />
                    Đổi mật khẩu thành công!
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={passwordSuccess}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Lock size={16} />
                    Đổi mật khẩu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordForm({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                      setPasswordError("");
                      setPasswordSuccess(false);
                    }}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
