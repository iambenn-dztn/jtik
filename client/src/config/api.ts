const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const config = {
  apiUrl: API_URL,
  endpoints: {
    transformLink: `${API_URL}/api/shopee/transform-link`,
    saveInfo: `${API_URL}/api/shopee/save-info`,
    customers: `${API_URL}/api/shopee/customers`,
    accounts: `${API_URL}/api/shopee/accounts`,
    exportCustomers: `${API_URL}/api/shopee/customers/export`,
  },
};

export default config;
