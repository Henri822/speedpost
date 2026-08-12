import asyncio
import httpx

IG_USER_ID = "28568074059463119"
ACCESS_TOKEN = "IGAGKXTzZCmGd5BZAGFIV3hSX2pYM09OR2hQZAm5WTFQ4bF9fWlg3RDBGYTd6blh6MDc5dGtJX2hIQVA5d2ZA2a2o5OWowemJnaXBGeWxuc01qVmhjcHNYSnN5UWlSV293NDFxMEtkanFRNVA3QzhCV2xYQmFobTVFaUh3T29CS2JWVQZDZD"


async def test_full_publication():
    print("==================================================")
    print("1. CRIANDO CONTAINER DE MÍDIA NO INSTAGRAM")
    print("==================================================")
    image_url = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80"
    caption = "Teste de agendamento automático via SpeedPost 🚀⚡"
    
    container_url = f"https://graph.instagram.com/v20.0/{IG_USER_ID}/media"
    container_payload = {
        "image_url": image_url,
        "caption": caption,
        "access_token": ACCESS_TOKEN
    }
    
    async with httpx.AsyncClient(timeout=20.0) as client:
        res = await client.post(container_url, data=container_payload)
        print(f"Status Container: {res.status_code}")
        print(f"Resposta Container: {res.text}")
        
        if res.status_code != 200:
            print("[ERRO] Falha ao criar container.")
            return

        container_id = res.json()["id"]
        print(f"\n[SUCESSO] Container criado com ID: {container_id}")
        print("Aguardando 5 segundos para o Instagram processar a mídia...")
        await asyncio.sleep(5)

        print("\n==================================================")
        print("2. PUBLICANDO CONTAINER NO INSTAGRAM (media_publish)")
        print("==================================================")
        publish_url = f"https://graph.instagram.com/v20.0/{IG_USER_ID}/media_publish"

        publish_payload = {
            "creation_id": container_id,
            "access_token": ACCESS_TOKEN
        }
        
        pub_res = await client.post(publish_url, data=publish_payload)
        print(f"Status Publicação: {pub_res.status_code}")
        print(f"Resposta Publicação: {pub_res.text}")
        
        if pub_res.status_code == 200:
            media_id = pub_res.json().get("id")
            print(f"\n[POST PUBLICADO COM SUCESSO NO INSTAGRAM!] ID da Mdia: {media_id}")

        else:
            print(f"\n[ERRO NA PUBLICAÇÃO] Resposta: {pub_res.text}")

if __name__ == "__main__":
    asyncio.run(test_full_publication())
