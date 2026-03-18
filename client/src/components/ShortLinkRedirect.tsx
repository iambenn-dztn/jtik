import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import config from "../config/api";

function ShortLinkRedirect() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndRedirect = async () => {
      if (!code) {
        setError("Mã link không hợp lệ");
        return;
      }

      try {
        const response = await fetch(`${config.apiUrl}/${code}`, {
          redirect: "manual",
        });

        if (
          response.type === "opaqueredirect" ||
          (response.status >= 300 && response.status < 400)
        ) {
          window.location.href = `${config.apiUrl}/${code}`;
          return;
        }

        if (response.status === 404) {
          const data = await response.json();
          setError(data.error || "Không tìm thấy link");
          return;
        }

        if (!response.ok) {
          setError("Không thể lấy thông tin link");
          return;
        }

        window.location.href = `${config.apiUrl}/${code}`;
      } catch (err) {
        console.error("Error fetching redirect:", err);
        window.location.href = `${config.apiUrl}/${code}`;
      }
    };

    fetchAndRedirect();
  }, [code]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-black/40 backdrop-blur-sm border border-red-500/30 rounded-2xl p-8 text-center">
          <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-white mb-2">Lỗi</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white font-semibold"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2
          className="animate-spin text-blue-400 mx-auto mb-4"
          size={48}
        />
        <p className="text-gray-300 text-lg mb-2">Đang chuyển hướng...</p>
        <p className="text-gray-500 text-sm">Vui lòng đợi trong giây lát</p>
        {redirectUrl && (
          <div className="mt-6 p-4 bg-black/20 border border-white/10 rounded-lg max-w-md mx-auto">
            <p className="text-gray-400 text-xs mb-2">Đích đến:</p>
            <p className="text-blue-400 text-sm break-all">{redirectUrl}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ShortLinkRedirect;
