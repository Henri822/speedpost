import sqlite3
from routes.reels_scheduler import init_db, DB_PATH

init_db()

token = "IGAGKXTzZCmGd5BZAGFxSFJ4Q0FtSHBlckNQZAXFPY0FRNlBHS3hENHhxQnYyeDRwNDE4QWxLa3BteDc0VGZAEOWx3MXlNb3BQVW5EeDFIZAFk3Tk92b0ZAUdVNrMUE4OEpSR2tZAMkE5ajQxLW90bzhmdVZAnQmQwWU1fVzgwaER5a3gzcwZDZD"
ig_id = "28568074059463119" # ID oficial resolvido pela API para @henriviniciuscasemiro

conn = sqlite3.connect(DB_PATH)
conn.execute("""
    INSERT OR REPLACE INTO connected_accounts (id, user_id, provider, account_name, ig_user_id, access_token, profile_picture_url, status, created_at)
    VALUES (1, 'usr_123', 'instagram', '@henriviniciuscasemiro', ?, ?, 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=150', 'ACTIVE', datetime('now'))
""", (ig_id, token))
conn.commit()
conn.close()
print("SUCESSO: Conta @henriviniciuscasemiro atualizada no DB com ID 28568074059463119!")
