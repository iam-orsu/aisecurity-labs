import os
import sqlite3
import hashlib

# Configuration
DATABASE_PATH = os.getenv("DATABASE_PATH", "/data/orsu.db")

def hash_password(password: str) -> str:
    """Simple MD5 hash — intentionally weak for the lab exercise."""
    return hashlib.md5(password.encode()).hexdigest()

def get_db_connection():
    """Returns a SQLite database connection with row factory enabled."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the database schema and populates initial data if empty."""
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salary INTEGER NOT NULL,
        leaves INTEGER NOT NULL,
        department TEXT NOT NULL,
        role TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS leave_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'Pending',
        manager_approval TEXT DEFAULT 'Pending',
        FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    );
    """)
    
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        users_data = [
            ("Vamsi Krishna", "vamsi@orsuenterprises.com", hash_password("qwerfdsa@789654"), 850000, 12, "Security Engineering", "Employee"),
            ("Shrihita", "shrihita@orsuenterprises.com", hash_password("r@!nb0ws"), 920000, 8, "Data Science", "Senior Engineer"),
            ("Jasmin", "jasmin@orsuenterprises.com", hash_password("r0sevendel@"), 750000, 15, "HR", "HR Manager"),
            ("Arjun", "arjun@orsuenterprises.com", hash_password("r@ffle567"), 680000, 10, "DevOps", "Engineer"),
            ("Priya", "priya@orsuenterprises.com", hash_password("r3tr0b@by"), 890000, 6, "Backend", "Senior Engineer")
        ]
        
        cursor.executemany("""
            INSERT INTO users (name, email, password_hash, salary, leaves, department, role)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, users_data)
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
