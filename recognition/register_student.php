<?php
// register_student.php - Save Student Base64 Image & Facial Descriptor Directly to MySQL

header('Content-Type: application/json');
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Only POST requests allowed']);
    exit;
}

// Get raw JSON POST data
$inputRaw = file_get_contents('php://input');
$data = json_decode($inputRaw, true);

$studentName = isset($data['student_name']) ? trim($data['student_name']) : '';
$base64Image = isset($data['image']) ? $data['image'] : '';
$descriptor = isset($data['descriptor']) ? $data['descriptor'] : null;

if (empty($studentName) || empty($base64Image) || empty($descriptor)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields (Student Name, Image Data, or Face Descriptor)']);
    exit;
}

// Save directly into MySQL Database (No disk folder needed!)
try {
    // Check if student name already exists
    $checkStmt = $pdo->prepare("SELECT id FROM students WHERE LOWER(student_name) = LOWER(?)");
    $checkStmt->execute([$studentName]);
    $existing = $checkStmt->fetch();

    if ($existing) {
        // Update existing record in MySQL
        $updateStmt = $pdo->prepare("UPDATE students SET image_data = ?, face_descriptor = ? WHERE id = ?");
        $updateStmt->execute([$base64Image, json_encode($descriptor), $existing['id']]);
        echo json_encode([
            'success' => true, 
            'message' => "Face profile updated successfully in MySQL for '$studentName'!"
        ]);
    } else {
        // Insert new record in MySQL
        $insertStmt = $pdo->prepare("INSERT INTO students (student_name, image_data, face_descriptor) VALUES (?, ?, ?)");
        $insertStmt->execute([$studentName, $base64Image, json_encode($descriptor)]);
        echo json_encode([
            'success' => true, 
            'message' => "New face profile saved directly to MySQL for '$studentName'!"
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
