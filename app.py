from flask import Flask, render_template, request, redirect, url_for, session, flash
from werkzeug.security import generate_password_hash, check_password_hash
import psycopg2
from psycopg2.extras import DictCursor
import os

app = Flask(__name__)
app.secret_key = 'your_secret_key'

def get_db_connection():
    conn = psycopg2.connect(
        os.getenv('DATABASE_URL', 'postgresql://postgres:.nIs08nIs.@localhost:5432/users'),
        cursor_factory=DictCursor
    )
    return conn

@app.route('/')
def login():
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login_post():
    username = request.form['username']
    password = request.form['password']
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT * FROM users WHERE username = %s', (username,))
    user = cur.fetchone()
    cur.close()
    conn.close()

    if user and check_password_hash(user['password'], password):
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['icoins'] = user['icoins']
        return redirect(url_for('index'))
    else:
        flash('Login failed. Check your username and password.')
        return redirect(url_for('login'))

@app.route('/index')
def index():
    if 'user_id' in session:
        return render_template('index.html', username=session['username'], icoins=session['icoins'])
    else:
        return redirect(url_for('login'))

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True)
