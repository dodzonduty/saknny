import json

EN_PATH = r"d:\saknny\frontend\src\i18n\locales\en.json"
AR_PATH = r"d:\saknny\frontend\src\i18n\locales\ar.json"

def update_locale(path, updates):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    dashboard = data.setdefault("dashboard", {})
    dashboard.update(updates)

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

en_updates = {
    "footerTerms": "Terms of Service",
    "footerPrivacy": "Privacy Policy",
    "footerSupport": "Contact Support",
    "footerHandbook": "Housing Handbook"
}

ar_updates = {
    "footerTerms": "شروط الخدمة",
    "footerPrivacy": "سياسة الخصوصية",
    "footerSupport": "اتصل بالدعم",
    "footerHandbook": "دليل السكن"
}

update_locale(EN_PATH, en_updates)
update_locale(AR_PATH, ar_updates)

print("Footer translations added!")
