import os
import argparse
import uvicorn
from main import app

if __name__ == "__main__":
    env_port = int(os.environ.get("PORT", 7001))
    env_host = os.environ.get("HOST", "0.0.0.0")

    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default=env_host)
    parser.add_argument("--port", type=int, default=env_port)
    args = parser.parse_args()

    print(f"Iniciando SpeedPost Backend em {args.host}:{args.port}...")
    uvicorn.run(app, host=args.host, port=args.port, reload=False)
