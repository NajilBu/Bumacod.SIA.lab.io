<?php
// delete_student.php - Delete Registered Student Profile from MySQL Database

header('Content-Type: application/json');
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Only POST requests allowed']);
    exit;
}

$inputRaw = file_get_contents('php://input');
$data = json_decode($inputRaw, true);
$studentId = isset($data['id']) ? intval($data['id']) : 0;

if ($studentId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid student ID']);
    exit;
}

try {
    // Delete row directly from MySQL database
    $deleteStmt = $pdo->prepare("DELETE FROM students WHERE id = ?");
    $deleteStmt->execute([$studentId]);

    if ($deleteStmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Student profile deleted successfully from MySQL database!'
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Student profile not found in database']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
