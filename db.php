<?php
// db.php - Database Connection Script for MySQL (XAMPP Defaults)

$host = '127.0.0.1';
$user = 'root'; // Default XAMPP MySQL user
$pass = '';     // Default XAMPP MySQL password is empty
$dbname = 'sia_lab_db';

try {
    // 1. Connect to MySQL server
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // 2. Auto-create database if not exists
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
    $pdo->exec("USE `$dbname`;");

    // 3. Auto-create students table if not exists
    $tableSql = "CREATE TABLE IF NOT EXISTS `students` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `student_name` VARCHAR(100) NOT NULL,
        `image_data` LONGTEXT NOT NULL,
        `face_descriptor` LONGTEXT NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    
    $pdo->exec($tableSql);

    // Migration helper: If table existed from earlier schema without image_data column, add it!
    try {
        $pdo->exec("ALTER TABLE `students` ADD COLUMN `image_data` LONGTEXT NOT NULL AFTER `student_name`;");
    } catch (PDOException $ex) {
        // Column image_data already exists
    }

} catch (PDOException $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}
?>
