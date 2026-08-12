import sqlite3
from routes.reels_scheduler import init_db, DB_PATH

init_db()

token = "IGAGKXTzZCmGd5BZAGFIV3hSX2pYM09OR2hQZAm5WTFQ4bF9fWlg3RDBGYTd6blh6MDc5dGtJX2hIQVA5d2ZA2a2o5OWowemJnaXBGeWxuc01qVmhjcHNYSnN5UWlSV293NDFxMEtkanFRNVA3QzhCV2xYQmFobTVFaUh3T29CS2JWVQZDZD"
ig_id = "28568074059463119" # ID oficial resolvido pela API para @henriviniciuscasemiro

conn = sqlite3.connect(DB_PATH)
conn.execute("""
    INSERT OR REPLACE INTO connected_accounts (id, user_id, provider, account_name, ig_user_id, access_token, profile_picture_url, status, created_at)
    VALUES (1, 'usr_123', 'instagram', '@henriviniciuscasemiro', ?, ?, 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=150', 'ACTIVE', datetime('now'))
""", (ig_id, token))
conn.commit()
conn.close()
print("SUCESSO: Conta @henriviniciuscasemiro atualizada no DB com novo token!")

