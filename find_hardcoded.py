import os
import re

def find_hardcoded_text(directory):
    pattern = re.compile(r'>\s*([A-Z][A-Za-z0-9\s,\.\?\!\'\-]+)\s*<')
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    matches = pattern.findall(content)
                    if matches:
                        valid_matches = [m.strip() for m in matches if any(c.isalpha() for c in m) and '{' not in m and len(m.strip()) > 2]
                        if valid_matches:
                            print(f"{path}:")
                            for m in valid_matches:
                                print(f"  - {m}")

print("--- DASHBOARD ---")
find_hardcoded_text(r"d:\saknny\frontend\src\app\dashboard")
print("--- ADMIN ---")
find_hardcoded_text(r"d:\saknny\frontend\src\app\admin")
print("--- COMPONENTS ---")
find_hardcoded_text(r"d:\saknny\frontend\src\components")
