const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const config = {
  apiUrl: API_URL,
  endpoints: {
    transformLink: `${API_URL}/api/shopee/transform-link`,
    transformText: `${API_URL}/api/shopee/transform-text`,
    saveInfo: `${API_URL}/api/shopee/save-info`,
    customers: `${API_URL}/api/shopee/customers`,
    accounts: `${API_URL}/api/shopee/accounts`,
    exportCustomers: `${API_URL}/api/shopee/customers/export`,
    conversionStats: `${API_URL}/api/shopee/stats/conversions`,
    conversionStatsToday: `${API_URL}/api/shopee/stats/conversions/today`,
  },
};

export default config;
