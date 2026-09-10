<?php
// get_students.php - Retrieve All Registered Face Descriptors & Images from MySQL

header('Content-Type: application/json');
require_once 'db.php';

try {
    // Select student records
    $stmt = $pdo->query("SELECT id, student_name, COALESCE(image_data, '') AS image_data, face_descriptor, created_at FROM students ORDER BY id DESC");
    $students = $stmt->fetchAll();

    // Decode stored JSON face descriptors
    foreach ($students as &$student) {
        if (!empty($student['face_descriptor'])) {
            $student['face_descriptor'] = json_decode($student['face_descriptor']);
        } else {
            $student['face_descriptor'] = [];
        }
    }

    echo json_encode([
        'success' => true,
        'count' => count($students),
        'students' => $students
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>
