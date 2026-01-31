
<?php
// CẤU HÌNH BẢO MẬT (Thay đổi thông tin của bạn vào đây khi up lên Host)
// Lưu ý: Không ai có thể xem nội dung file PHP này từ trình duyệt, nên Key an toàn.
$GAS_URL = "https://script.google.com/macros/s/AKfycby8TouIkLfO99wK3gTVX_jIqBM9q3emYGi-eL846BWgFVRetEp0nYR5OCKxLRabRwWo/exec";
$GAS_SECRET_KEY = "CHANGE_ME_STRONG_KEY_123456";

// Cấu hình CORS (Cho phép React gọi vào)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Xử lý Preflight request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Chỉ chấp nhận POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["ok" => false, "error" => "Method Not Allowed"]);
    exit();
}

// Nhận dữ liệu từ React App
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

if (!$input) {
    echo json_encode(["ok" => false, "error" => "Invalid JSON"]);
    exit();
}

// Đóng gói lại dữ liệu, chèn API Key bí mật
$payload = [
    "apiKey" => $GAS_SECRET_KEY,
    "action" => isset($input['action']) ? $input['action'] : '',
    "data"   => isset($input['data']) ? $input['data'] : []
];

// Gửi request sang Google Apps Script (Sử dụng cURL)
$ch = curl_init($GAS_URL);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: text/plain;charset=utf-8' // Google yêu cầu text/plain để tránh redirect phức tạp
]);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // Quan trọng: Google Scripts luôn redirect

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    echo json_encode(["ok" => false, "error" => "cURL Error: " . curl_error($ch)]);
} else {
    // Trả nguyên văn kết quả từ Google về cho React
    echo $response;
}

curl_close($ch);
?>
