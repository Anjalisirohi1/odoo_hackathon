CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,            -- Matches 'Full Name'
    email VARCHAR(255) UNIQUE NOT NULL,    -- Matches 'Corporate Email'
    password_hash VARCHAR(255) NOT NULL,   -- Matches 'Password' (Hashed)
    role user_role DEFAULT 'EMPLOYEE',     -- Aligns with "Sign up creates an employee account"
    status user_status DEFAULT 'ACTIVE',
    department_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);