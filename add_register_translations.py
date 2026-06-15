import json
import os

EN_PATH = r"d:\saknny\frontend\src\i18n\locales\en.json"
AR_PATH = r"d:\saknny\frontend\src\i18n\locales\ar.json"

def update_locale(path, updates):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    auth_data = data.setdefault("auth", {})
    fields = auth_data.setdefault("fields", {})
    errors = auth_data.setdefault("errors", {})
    
    fields.update(updates.get("fields", {}))
    errors.update(updates.get("errors", {}))
    
    auth_data["documentsTitle"] = updates.get("documentsTitle")
    auth_data["documentsDesc"] = updates.get("documentsDesc")
    auth_data["profilePictureLabel"] = updates.get("profilePictureLabel")
    auth_data["profilePictureDesc"] = updates.get("profilePictureDesc")
    auth_data["nationalIdFrontLabel"] = updates.get("nationalIdFrontLabel")
    auth_data["nationalIdFrontDesc"] = updates.get("nationalIdFrontDesc")
    auth_data["nationalIdBackLabel"] = updates.get("nationalIdBackLabel")
    auth_data["nationalIdBackDesc"] = updates.get("nationalIdBackDesc")
    auth_data["registerSuccess"] = updates.get("registerSuccess")
    auth_data["registerFailed"] = updates.get("registerFailed")

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

en_updates = {
    "fields": {
        "nationalityId": "Nationality ID",
        "faculty": "Faculty Name"
    },
    "errors": {
        "nationalityIdLen": "Nationality ID must be exactly 14 digits",
        "facultyRequired": "Faculty is required",
        "profilePicRequired": "Profile picture is required",
        "nationalIdFrontRequired": "National ID Front is required",
        "nationalIdBackRequired": "National ID Back is required"
    },
    "documentsTitle": "Required Documents",
    "documentsDesc": "Upload these images to verify your identity. Only images (JPG, PNG) are allowed.",
    "profilePictureLabel": "Profile Picture *",
    "profilePictureDesc": "Upload a clear, recent photo of your face",
    "nationalIdFrontLabel": "National ID (Front) *",
    "nationalIdFrontDesc": "Front side of your ID",
    "nationalIdBackLabel": "National ID (Back) *",
    "nationalIdBackDesc": "Back side of your ID",
    "registerSuccess": "Account created successfully! Please sign in.",
    "registerFailed": "Registration failed"
}

ar_updates = {
    "fields": {
        "nationalityId": "الرقم القومي",
        "faculty": "اسم الكلية"
    },
    "errors": {
        "nationalityIdLen": "يجب أن يتكون الرقم القومي من 14 رقماً بالضبط",
        "facultyRequired": "اسم الكلية مطلوب",
        "profilePicRequired": "الصورة الشخصية مطلوبة",
        "nationalIdFrontRequired": "صورة البطاقة (الأمام) مطلوبة",
        "nationalIdBackRequired": "صورة البطاقة (الخلف) مطلوبة"
    },
    "documentsTitle": "المستندات المطلوبة",
    "documentsDesc": "قم برفع هذه الصور للتحقق من هويتك. يُسمح فقط بالصور (JPG، PNG).",
    "profilePictureLabel": "الصورة الشخصية *",
    "profilePictureDesc": "قم برفع صورة واضحة وحديثة لوجهك",
    "nationalIdFrontLabel": "البطاقة الشخصية (الأمام) *",
    "nationalIdFrontDesc": "الوجه الأمامي لبطاقتك",
    "nationalIdBackLabel": "البطاقة الشخصية (الخلف) *",
    "nationalIdBackDesc": "الوجه الخلفي لبطاقتك",
    "registerSuccess": "تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول.",
    "registerFailed": "فشل التسجيل"
}

update_locale(EN_PATH, en_updates)
update_locale(AR_PATH, ar_updates)

print("Translations added successfully!")
