import os
import random
import subprocess
from PIL import Image

ids = [
"1hw26sV4-gaY6Daan1AiTTr31xKtDbCYq", "1GwDZIkyRmvbrElsKe3TKP9lVBYpUzVAa", "11O5C8Ddq290Lj_4RdXoz8Ee28w0B9Nw8",
"1opQY7HWjLuC7iqBx9YroL7sWzrHAgZC5", "1NnKbdZw0H7jYmNVS0Zcf515awNPnCZ25", "1f5eza060_8-BJHjdTzW7g9V5_bvOmelw",
"1qA_DT6tAzKcgw4AcofoIglISr_IfyLd3", "10r2ctZlqX7y8ThEPXpINOzX3s9HfVaVO", "1lNGKkOGa3c8z6FFfhD1I9JD91JKsrlcW",
"1SY4RFjV_CltBitjB39i7qsta58fiMtry", "1p9EXeeEol3dkzoW81_XZFvnhQu_93SIG", "1FXfusBRZfv_FkcYCKAFwbR3D4YmCxHbt",
"1EF02RqSBgISJXQDQCqmYpctsgFS90ec-", "1159pLXzG9dQcqY7KBup1F7YbHq269dAd", "1MY-PmyPRC8DuguLIef_6neQhk-oxFyiB",
"1Yi2rlPIdLIKBNiBlZW6d3qMZ9scqDsun", "1XHoGlOnj2jd-vIRYT85C8OFc4MM4au_4", "1cBFUr9jh8IzlDNJzIEMe9de6szoE00m4",
"14XsvpwpiJSQX61oJp4SPkkXDC13Y5Go5", "1y0doMwo1tl_LHJtBMTNsTMTCem0fxyrv", "1JnDAWyMH4FHcOgpZMqbdqgdJ1VZ007dq",
"14UCNavQt3PtxB4Z6zWIASYx8vij6Upnt", "1Aa5IcHpKoo_ZWveq6SF0-KchDygNzu7p", "1qy4THWPOgFqWlAqjGRkBzd-jGH2rqRvY",
"1ZmG8obXWuk9MS-G2AAAZw99sBLGVxHHs", "1xU3EImTM82Gs9x0MhYhkHg-OctHTyPX6", "1-crJxKJIMBLychmsG-CpvjE9YF-DqRTz",
"1fPRMxxta9AcftjojNj3jXzy0b0MfxdR5", "1UWR1CPg2xnDGMzU5V6jgtVrrn64WSxlm", "14tDBuilYNqmvgz-bz3w98FVnxqgwztdh",
"1NPosjeg5oX1o2FSoNyadbCDZj5TqTSov", "114f7GTr_joYa3d0oMfSTeRPNYDOR8k7F", "13_sVV1AmRF5dci7SjsNKyN4ssKugeE4-",
"1LUpTTbSUd8ji_33c1iPagQqEW3dsWlVy", "1uWFT8Nld1u7OAOaCVoEMTnZuyQqD9UMm", "1_cnZa3T-u-JnaqnQtwD1qbZSCcsiDrtZ",
"1QXPhFrFD7_0eVYcwkA4DOX9dSeZpkp03", "14WIPqnfZ5l5ahY7us8HXMMkqkbuo2WhM", "1Ekx3zokBlUl9vUV-lgzdTS6lWtDL63vZ",
"1-tPIPkkJiXwEFbAJfBeQ30czN-J1Z1Ve", "1JqzEG4JQIK0n7uRyDFWWfXjxgk2WTkzL", "1ubUxePPOWMHI4QJiHY0RquUwG2K71nTR",
"1J0y9VF_G3ft9JbRQxSF6V5Zg_hsL2Zp5", "1V42HInbvN1t1TrMPOveATn_pUZTCKXKm", "1ahwgFGbg7qnvy2izIE0iCeJNUWcTYNQO",
"1udyZVVhvl-xsKFT44iLGu_-HK5PYZE0l", "1y9rMuxEL8DY2-DhqUUG9D8PSp2FqYDue", "112X8YtoNmAKjlJiEY-JmTo8Jj8gqSJL5",
"1eN86xJpvwzkVv7WzHekeiNQba8rgTQvO", "1l51tQtKCIacedRSIVRXYqMM4SQkrxT5E", "1TfmgjColTkempT27BRpcknJxleb_kW91",
"1LpBvX0ndVx23WuaYXaWpK9-YgraWp8zt", "1Ka1RK9ysUosKO4iEUunRLa0p7r49Zt6u", "15c77B_vFs-2qXa611KshudWpoJcsd5bG",
"1Y84lR6GMcJA1fcMRzbdvapPye6x4nvyY"
]

dest_dir = r"D:\circle-d-flow-web\Assets\images\secret_garden"
os.makedirs(dest_dir, exist_ok=True)
import shutil
shutil.rmtree(dest_dir)
os.makedirs(dest_dir, exist_ok=True)

temp_dir = r"D:\circle-d-flow-web\temp_dl"
os.makedirs(temp_dir, exist_ok=True)

max_size = (1080, 1080)
valid_count = 1

# Shuffle IDs so if we don't finish all 55, we get a mix
random.shuffle(ids)

for i, gid in enumerate(ids):
    print(f"Downloading {i+1}/{len(ids)}...")
    tmp_path = os.path.join(temp_dir, f"tmp_{i}.jpg")
    try:
        subprocess.run(["gdown", gid, "-O", tmp_path], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if os.path.exists(tmp_path):
            with Image.open(tmp_path) as img:
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
                dest_path = os.path.join(dest_dir, f"bg_{valid_count}.webp")
                img.save(dest_path, "WEBP", quality=75)
                print(f"Saved {dest_path}")
            valid_count += 1
            os.remove(tmp_path)
    except Exception as e:
        print(f"Failed {gid}: {e}")

print(f"Successfully processed {valid_count-1} images.")
shutil.rmtree(temp_dir)

