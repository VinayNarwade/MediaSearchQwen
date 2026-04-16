import requests
import json


port_num = 5800
BASE_URL = f"http://127.0.0.1:{port_num}"

index_url = f"{BASE_URL}/index-videos"
index_payload = {
    "data": [
       {"filepath": "meridian.mp4", "sourceId": "mer_new2", "fps": 30, "useAudio": True},
      # {"filepath": "tearsofsteel.mp4", "sourceId": "tos", "fps": 30, "useAudio": False},
      # {"filepath": "CosmosLaundromat.mp4", "sourceId": "cos", "fps": 30, "useAudio": True},
        #{"filepath": "Spring_-_Blender_Open_Movie_WhWc3b3KhnY.mp4", "sourceId": "sprng", "fps": 30, "useAudio": False},
        #{"filepath": "Sprite_Fright_-_Blender_Open_Movie__cMxraX_5RE.mp4", "sourceId": "sprite8", "fps": 30, "useAudio": False},
        #{"filepath": "WING_IT_-_Blender_Open_Movie_u9lj-c29dxI.mp4", "sourceId": "wing8", "fps": 30, "useAudio": False},
        # {"filepath": "meridian.mp4", "sourceId": "mer9", "fps": 30, "useAudio": False},
        # {"filepath": "tearsofsteel.mp4", "sourceId": "tos9", "fps": 30, "useAudio": False},
        # {"filepath": "CosmosLaundromat.mp4", "sourceId": "cos9", "fps": 30, "useAudio": False},
        # {"filepath": "Spring_-_Blender_Open_Movie_WhWc3b3KhnY.mp4", "sourceId": "sprng9", "fps": 30, "useAudio": False},
        # {"filepath": "Sprite_Fright_-_Blender_Open_Movie__cMxraX_5RE.mp4", "sourceId": "sprite9", "fps": 30, "useAudio": False},
        # {"filepath": "WING_IT_-_Blender_Open_Movie_u9lj-c29dxI.mp4", "sourceId": "wing9", "fps": 30, "useAudio": False},
        # {"filepath": "meridian.mp4", "sourceId": "mer10", "fps": 30, "useAudio": False},
        # {"filepath": "tearsofsteel.mp4", "sourceId": "tos10", "fps": 30, "useAudio": False},
        # {"filepath": "CosmosLaundromat.mp4", "sourceId": "cos10", "fps": 30, "useAudio": False},
        # {"filepath": "Spring_-_Blender_Open_Movie_WhWc3b3KhnY.mp4", "sourceId": "sprng10", "fps": 30, "useAudio": False},
        # {"filepath": "Sprite_Fright_-_Blender_Open_Movie__cMxraX_5RE.mp4", "sourceId": "sprite10", "fps": 30, "useAudio": False},
        # {"filepath": "WING_IT_-_Blender_Open_Movie_u9lj-c29dxI.mp4", "sourceId": "wing10", "fps": 30, "useAudio": False},

    ],
    "isVideo": True,
    "dbName": "memory_4"
}

"""index_payload = {
    "data": [
        {
            "filepath": "tos_images",
            "sourceId": "tosimg",
            "fps": 30,
            "sceneFrames": [0, 35, 130, 362, 458, 637, 825, 888],
            "useAudio": True
        }
    ],
    "isVideo": False,   
    "dbName": "vllm"
}"""

index_resp = requests.post(index_url, json=index_payload)
print("Index Videos:", index_resp.json())
