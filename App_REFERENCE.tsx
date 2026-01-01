// Reference file - showing the updated handleBankInfoSubmit function
// This should replace the existing handleBankInfoSubmit in App.tsx

const handleBankInfoSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const formData = {
    phone,
    bankName,
    accountNumber,
    accountName,
    affiliateLink: `jtik.io/${result}`,
  };

  try {
    const response = await fetch("http://localhost:3000/api/shopee/save-info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("Bank Information Saved to Excel:", data);
      alert("Thông tin đã được lưu thành công!");

      // Reset form
      setPhone("");
      setBankName("");
      setAccountNumber("");
      setAccountName("");
    } else {
      console.error("Error saving info:", data);
      alert("Lỗi khi lưu thông tin!");
    }
  } catch (error) {
    console.error("Network error:", error);
    alert("Lỗi kết nối! Vui lòng thử lại.");
  }
};
