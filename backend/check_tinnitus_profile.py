import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000/api/v1"
EMAIL = "tinnitus-profile-test@example.com"
PASSWORD = "Password123!"


def post(path, data, token=None):
    url = BASE_URL + path
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)


def main():
    try:
        login = post("/auth/login", {"email": EMAIL, "password": PASSWORD})
    except urllib.error.HTTPError as exc:
        if exc.code == 401:
            print("User not found. Registering test user...")
            post("/auth/register", {"email": EMAIL, "password": PASSWORD, "full_name": "Tinnitus Profile Test", "role": "patient"})
            login = post("/auth/login", {"email": EMAIL, "password": PASSWORD})
        else:
            raise

    token = login["access_token"]

    payload = {
        "stress_level": 7,
        "sleep_hours": 5.0,
        "loudness_level": 8,
        "hearing_loss": "Yes",
    }

    result = post("/predictions/tinnitus-profile", payload, token=token)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
