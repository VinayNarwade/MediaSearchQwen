import requests
import json


port_num = 5800
BASE_URL = f"http://127.0.0.1:{port_num}"

index_url = f"{BASE_URL}/index-videos"
index_payload = {
    "data": [
        {"filepath": "meridian.mp4", "sourceId": "mer", "fps": 30, "useAudio": True},
        {"filepath": "tearsofsteel.mp4", "sourceId": "tos", "fps": 30, "useAudio": True},
        {"filepath": "CosmosLaundromat.mp4", "sourceId": "cos", "fps": 30, "useAudio": True},
        {"filepath": "Spring_-_Blender_Open_Movie_WhWc3b3KhnY.mp4", "sourceId": "sprng", "fps": 30, "useAudio": True},
        {"filepath": "Sprite_Fright_-_Blender_Open_Movie__cMxraX_5RE.mp4", "sourceId": "sprite", "fps": 30, "useAudio": True},
        {"filepath": "WING_IT_-_Blender_Open_Movie_u9lj-c29dxI.mp4", "sourceId": "wing", "fps": 30, "useAudio": True}
    ],
    "isVideo": True,
    "dbName": "vllm2"
}

index_resp = requests.post(index_url, json=index_payload)
print("Index Videos:", index_resp.json())
