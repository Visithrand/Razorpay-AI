import os
import glob

directory = r"d:\Razor-pay\settlement-copilot\frontend\src\components"

replacements = [
    ("text-[14px]", "text-base"),
    ("text-sm", "text-base"),
    ("text-[13px]", "text-[15px]"),
    ("text-[12px]", "text-sm"),
    ("text-xs", "text-sm"),
    ("text-[11px]", "text-[13px]"),
    ("text-[10px]", "text-xs"),
]

for filepath in glob.glob(os.path.join(directory, "*.jsx")):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements:
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {os.path.basename(filepath)}")

print("Done font bumping.")
