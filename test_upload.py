import requests
import sys

# Register a new user
register_url = "http://localhost:8000/api/v1/students/register"
register_data = {
    "name": "Test User",
    "email": "testuser_123456@example.com",
    "password": "password123",
    "gender": "M",
    "home_city": "Cairo",
    "nationality_id": "12345678901235",
    "faculty_id": "FAC123456",
    "faculty": "Engineering"
}
files = {
    'profile_picture': ('test.png', b'test profile', 'image/png'),
    'nationality_id_photo_front': ('front.png', b'test front', 'image/png'),
    'nationality_id_photo_back': ('back.png', b'test back', 'image/png')
}

print("Registering new user...")
try:
    r = requests.post(register_url, data=register_data, files=files)
    print("Registration response:", r.status_code)
    print(r.text)
    
    if r.status_code == 200:
        # Login
        login_url = "http://localhost:8000/api/v1/auth/login"
        login_data = {
            "email": "testuser_123456@example.com",
            "password": "password123"
        }
        r_login = requests.post(login_url, json=login_data)
        print("Login response:", r_login.status_code)
        if r_login.status_code == 200:
            token = r_login.json().get("data", {}).get("access_token")
            student_id = r_login.json().get("data", {}).get("student_id")
            
            # Now try uploading a new profile picture
            print(f"Uploading profile picture for student_id: {student_id}")
            upload_url = f"http://localhost:8000/api/v1/students/{student_id}/profile-picture"
            headers = {"Authorization": f"Bearer {token}"}
            upload_files = {'file': ('test.png', b'test data', 'image/png')}
            r_upload = requests.post(upload_url, headers=headers, files=upload_files)
            print("Upload response:", r_upload.status_code)
            print(r_upload.text)
except Exception as e:
    print(e)

