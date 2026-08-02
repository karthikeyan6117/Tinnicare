import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000/api/v1"
EMAIL = "langchain-test@example.com"
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
            print("User not found or invalid credentials. Registering test user...")
            post("/auth/register", {"email": EMAIL, "password": PASSWORD, "full_name": "LangChain Test", "role": "patient"})
            login = post("/auth/login", {"email": EMAIL, "password": PASSWORD})
        else:
            raise

    token = login["access_token"]
    print("ACCESS_TOKEN:", token)

    payload = {
        "severity": 3,
        "duration_minutes": 120,
        "stress_level": 6,
        "sleep_quality": 5,
        "loudness_level": 7,
        "frequency_hz": 4000.0,
        "recent_triggers_count": 3,
    }

    result = post("/predictions", payload, token=token)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
