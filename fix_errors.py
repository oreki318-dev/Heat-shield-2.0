import re

with open("static/app.js", "r") as f:
    js = f.read()

if "window.addEventListener('unhandledrejection'" not in js:
    js = "window.addEventListener('unhandledrejection', (e) => { e.preventDefault(); console.log('Handled rejection:', e.reason?.message || e.reason); });\n" + js

if "window.addEventListener('error'" not in js:
    js = "window.addEventListener('error', (e) => { e.preventDefault(); console.log('Handled error:', e.message); });\n" + js

with open("static/app.js", "w") as f:
    f.write(js)
