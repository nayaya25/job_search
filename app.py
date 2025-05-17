from flask import Flask, render_template, request, redirect, url_for, flash, session
import sqlite3
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Email configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")  # Your email address
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")  # Your app password

def send_email(recipient_email, subject, body):
    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_ADDRESS
        msg['To'] = recipient_email
        msg['Subject'] = subject

        msg.attach(MIMEText(body, 'plain'))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.sendmail(EMAIL_ADDRESS, recipient_email, msg.as_string())

        print("Email Sent Successfully!")
    except Exception as e:
        print(f"Error sending email: {e}")

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # Change this to a random secret key

# Database Configuration
DB_FILE = 'users.db'

def init_db():
    if not os.path.exists(DB_FILE):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT NOT NULL,
                job_id INTEGER NOT NULL,
                full_name TEXT,
                phone TEXT,
                resume_link TEXT,
                cover_letter TEXT,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(job_id) REFERENCES jobs(id)
            )
        ''')
        conn.commit()
        conn.close()

init_db()

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

# Authentication Routes
@app.route('/')
def index():
    if 'user' in session:
        return redirect(url_for('home'))
    return render_template('index.html')
@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if 'user' in session:
        return redirect(url_for('home'))

    if request.method == 'POST':
        name = request.form.get('name').strip()
        email = request.form.get('email').strip().lower()
        password = request.form.get('password')

        if not name or not email or not password:
            flash('All fields are required.', 'error')
            return render_template('signup.html')

        conn = get_db_connection()
        existing_user = conn.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()

        if existing_user:
            conn.close()
            flash('Email already registered.', 'error')
            return render_template('signup.html')

        hashed_password = generate_password_hash(password)
        conn.execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                     (name, email, hashed_password))
        conn.commit()
        user_id = conn.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()['id']
        conn.close()

        # Log user in
        session['user_id'] = user_id
        session['user'] = email
        session['name'] = name
        flash('Signup successful! You are now logged in.', 'success')
        return redirect(url_for('home'))

    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'user' in session:
        return redirect(url_for('home'))

    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '').strip()

        conn = get_db_connection()
        user = conn.execute(
            'SELECT id, name, email, password FROM users WHERE email = ?',
            (email,)
        ).fetchone()
        conn.close()

        if user and check_password_hash(user['password'], password):
            session['user_id'] = user['id']
            session['user'] = user['email']
            session['name'] = user['name']
            flash('Login successful!', 'success')
            return redirect(url_for('home'))
        else:
            flash('Invalid email or password.', 'error')

    return render_template('login.html')

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('login'))

# Main Application Routes
@app.route('/home')
def home():
    if 'user' not in session:
        flash('Please log in first.', 'error')
        return redirect(url_for('login'))
    return render_template('home.html', name=session.get('name'))

@app.route('/post', methods=['GET', 'POST'])
def post():
    if 'user' not in session:
        flash('Please log in first.', 'error')
        return redirect(url_for('login'))

    if request.method == 'POST':
        # Handle post creation logic here
        flash('Post created successfully!', 'success')
        return redirect(url_for('home'))

    return render_template('post.html')

@app.route('/job')
def jobs():
    if 'user_id' not in session:
        flash('Please login first.', 'error')
        return redirect(url_for('login'))

    conn = get_db_connection()
    jobs = conn.execute('SELECT * FROM jobs ORDER BY posted_at DESC').fetchall()
    conn.close()

    return render_template('job.html', jobs=jobs, current_page='jobs')

@app.route('/apply_job', methods=['POST'])
def apply_job():
    if 'user' not in session:
        flash("Please log in first.", "error")
        return redirect(url_for('login'))

    job_id = request.form.get('job_id')
    full_name = request.form.get('full_name')
    user_email = request.form.get('email')
    phone = request.form.get('phone')
    resume_option = request.form.get('resumeOption')  # 'link' or 'upload'
    resume_link = request.form.get('resume_link') if resume_option == 'link' else None
    cover_letter = request.form.get('cover_letter')
    
    # Save application to DB
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO applications (user_email, job_id, full_name, phone, resume_link, cover_letter)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (user_email, job_id, full_name, phone, resume_link, cover_letter))
    conn.commit()
    conn.close()

    # Send email notification
    # Fetch job title to include in email subject/body
    conn = get_db_connection()
    job = conn.execute('SELECT title FROM jobs WHERE id = ?', (job_id,)).fetchone()
    conn.close()
    job_title = job['title'] if job else 'the job'

    subject = f"Application Received for {job_title}"
    body = f"""Hello {full_name},

Thank you for applying for {job_title}.

We have received your application and will review it shortly.

Best regards,
Recruitment Team
"""
    send_email(user_email, subject, body)

    flash("Application submitted successfully. An email has been sent to you.", "success")
    return redirect(url_for('jobs'))

@app.route('/profile')
def profile():
    if 'user' not in session:
        flash('Please log in first.', 'error')
        return redirect(url_for('login'))

    conn = get_db_connection()
    user = conn.execute(
        'SELECT name, email, created_at FROM users WHERE id = ?',
        (session['user_id'],)
    ).fetchone()
    conn.close()

    return render_template('profile.html', 
                         name=user['name'],
                         email=user['email'],
                         join_date=user['created_at'])

@app.route('/submit_post', methods=['POST'])
def submit_post():
    if 'user' not in session:
        flash("Please log in first.", "error")
        return redirect(url_for('login'))

    content = request.form.get('content')  # Make sure the textarea has name="content"
    # Save content to DB here...

    flash("Post submitted successfully.", "success")
    return redirect(url_for('home'))

# Error Handlers
@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

if __name__ == '__main__':
    app.run(debug=True)

