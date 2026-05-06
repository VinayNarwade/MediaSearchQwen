import requests
import json


port_num = 5800
BASE_URL = f"http://3.95.216.196:{port_num}"

status_url = f"{BASE_URL}/status"
status_resp = requests.get(status_url)
print("Get Status:", status_resp.json())

