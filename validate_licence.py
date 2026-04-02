from generate_key import decrypt_file
from config import get_config


config = get_config()
dec_data = decrypt_file("/home/gyrusserver4/Downloads/licence_key.txt", config.PASSWORD).decode()
dec_data = dec_data.split("\n")
print(dec_data)