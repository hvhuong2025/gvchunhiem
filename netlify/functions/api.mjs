
export default async (req, context) => {
  // Chỉ chấp nhận phương thức POST
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    // 1. Lấy cấu hình bí mật
    const GAS_URL = process.env.GAS_URL;
    const GAS_SECRET_KEY = process.env.GAS_SECRET_KEY;

    if (!GAS_URL || !GAS_SECRET_KEY) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: "Server Netlify chưa cấu hình GAS_URL hoặc GAS_SECRET_KEY" 
      }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    // 2. Nhận dữ liệu
    const body = await req.json();
    const { action, data } = body;

    const payload = {
      apiKey: GAS_SECRET_KEY,
      action: action,
      data: data || {}
    };

    // 3. Gọi sang Google Apps Script với Headers giả lập trình duyệt
    // Thêm User-Agent để tránh Google chặn request từ Serverless IP
    const response = await fetch(GAS_URL, {
      method: "POST",
      redirect: "follow", // Bắt buộc để follow 302 của Google
      headers: {
        "Content-Type": "text/plain;charset=utf-8", // Google yêu cầu text/plain
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload),
    });

    // 4. Xử lý kết quả trả về
    const resultText = await response.text();

    // Kiểm tra xem Google có trả về HTML lỗi không (thường bắt đầu bằng <DOCTYPE hoặc <html)
    if (resultText.trim().startsWith("<")) {
        console.error("Google returned HTML instead of JSON:", resultText.substring(0, 100));
        return new Response(JSON.stringify({ 
            ok: false, 
            error: "Lỗi kết nối Google: Server trả về HTML. Có thể do Timeout (quá 10s) hoặc bị Google chặn IP." 
        }), {
            status: 502,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Trả kết quả JSON chuẩn về cho React
    return new Response(resultText, {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Netlify Function Error:", error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
