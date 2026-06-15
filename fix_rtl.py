import os
import glob

files = glob.glob('frontend/src/**/*.tsx', recursive=True)
count = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    modified = False
    if 'lg:ml-64' in content:
        content = content.replace('lg:ml-64', 'lg:ms-64')
        modified = True
    
    if 'Sidebar.tsx' in f and 'left-0' in content:
        content = content.replace('left-0', 'start-0')
        modified = True
        
    if modified:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        count += 1

print(f'Updated {count} files.')
