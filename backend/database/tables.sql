CREATE TABLE user_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    nickname VARCHAR(50),
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_body_stats (
    user_id INT PRIMARY KEY,
    weight FLOAT,
    height FLOAT,
    gender ENUM('Male', 'Female', 'Other'),
    calories_required INT,
    carbs_required INT,
    fats_required INT,
    protein_required INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE daily_food (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    date DATE,
    food_item VARCHAR(100),
    calories INT,
    protein INT,
    carbs INT,
    fats INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE exercise_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    date DATE,
    exercise_type VARCHAR(100),
    duration INT, 
    calories_burned INT,
    intensity ENUM('Low', 'Medium', 'High'),
    steps INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
