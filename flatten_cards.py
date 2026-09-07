import re

with open("static/style.css", "r") as f:
    css = f.read()

# Target classes to flatten
targets = [
    ".forecast-card",
    ".horizon-stat-card",
    ".triage-card",
    ".shelter-card",
    ".city-card",
    ".epi-hvi-card, .epi-mri-card",
    ".epi-chart-card",
    ".ward-card",
    ".hap-protocol-card",
    ".dispatch-kpi-card",
    ".benchmark-card"
]

for target in targets:
    # regex to find the block
    pattern = re.compile(r'(' + target.replace('.', r'\.') + r'\s*\{)([^}]*)(\})', re.MULTILINE)
    
    def replacer(match):
        prefix = match.group(1)
        content = match.group(2)
        suffix = match.group(3)
        
        # Remove background, border, border-radius, box-shadow
        content = re.sub(r'^\s*background:.*?;[ \t]*\n?', '', content, flags=re.MULTILINE)
        content = re.sub(r'^\s*border:.*?;[ \t]*\n?', '', content, flags=re.MULTILINE)
        content = re.sub(r'^\s*border-radius:.*?;[ \t]*\n?', '', content, flags=re.MULTILINE)
        content = re.sub(r'^\s*box-shadow:.*?;[ \t]*\n?', '', content, flags=re.MULTILINE)
        content = re.sub(r'^\s*border-top:.*?;[ \t]*\n?', '', content, flags=re.MULTILINE)
        content = re.sub(r'^\s*border-bottom:.*?;[ \t]*\n?', '', content, flags=re.MULTILINE)
        content = re.sub(r'^\s*border-left:.*?;[ \t]*\n?', '', content, flags=re.MULTILINE)
        content = re.sub(r'^\s*border-right:.*?;[ \t]*\n?', '', content, flags=re.MULTILINE)
        
        # Add basic flattening properties
        new_props = "\n  background: transparent;\n  border: none;\n  box-shadow: none;\n  border-radius: 0;\n"
        if target == ".forecast-card":
            # Already gets inline border-top in HTML for risk color, so we just remove others
            pass
        elif target == ".horizon-stat-card":
            new_props += "  border-left: 2px solid var(--border-subtle);\n"
        elif target in [".epi-hvi-card, .epi-mri-card", ".dispatch-kpi-card", ".benchmark-card", ".triage-card"]:
            new_props += "  border-left: 2px solid var(--border-subtle);\n"
        else:
            new_props += "  border-top: 1px solid var(--border-subtle);\n"
            
        return prefix + new_props + content + suffix

    css = pattern.sub(replacer, css)

# Fix hover states for these cards
hover_targets = [t for t in targets if t not in [".epi-hvi-card, .epi-mri-card", ".epi-chart-card", ".dispatch-kpi-card", ".benchmark-card", ".triage-card"]]
for target in hover_targets:
    pattern_hover = re.compile(r'(' + target.replace('.', r'\.') + r':hover\s*\{)([^}]*)(\})', re.MULTILINE)
    
    def replacer_hover(match):
        prefix = match.group(1)
        content = match.group(2)
        suffix = match.group(3)
        
        # Remove background, border, box-shadow, transform
        content = re.sub(r'^\s*background:.*?;[ \t]*\n?', '', content, flags=re.MULTILINE)
        content = re.sub(r'^\s*border-color:.*?;[ \t]*\n?', '', content, flags=re.MULTILINE)
        content = re.sub(r'^\s*box-shadow:.*?;[ \t]*\n?', '', content, flags=re.MULTILINE)
        content = re.sub(r'^\s*transform:.*?;[ \t]*\n?', '', content, flags=re.MULTILINE)
        
        new_props = "\n  background: transparent;\n  box-shadow: none;\n  transform: none;\n"
        if target == ".horizon-stat-card":
             new_props += "  border-color: var(--text-muted);\n"
             
        return prefix + new_props + content + suffix
        
    css = pattern_hover.sub(replacer_hover, css)

with open("static/style.css", "w") as f:
    f.write(css)

