import requests

# Login as a seeded student
login_url = "http://localhost:8000/api/v1/auth/login"
login_data = {
    "email": "student241@example.com",
    "password": "password123"
}

print("Logging in...")
try:
    r_login = requests.post(login_url, json=login_data)
    print("Login status:", r_login.status_code)
    if r_login.status_code == 200:
        token = r_login.json().get("data", {}).get("access_token")
        student_id = r_login.json().get("data", {}).get("student_id")
        
        # Now upload profile photo
        print(f"Uploading profile picture for student_id: {student_id}")
        upload_url = f"http://localhost:8000/api/v1/students/{student_id}/profile-picture"
        headers = {"Authorization": f"Bearer {token}"}
        
        # Use a dummy file
        with open("dummy.jpg", "wb") as f:
            f.write(b"dummy image data")
            
        with open("dummy.jpg", "rb") as f:
            upload_files = {'file': ('dummy.jpg', f, 'image/jpeg')}
            r_upload = requests.post(upload_url, headers=headers, files=upload_files)
            
        print("Upload response:", r_upload.status_code)
        print(r_upload.text)
    else:
        print("Login failed:", r_login.text)
except Exception as e:
    print("Error:", e)
