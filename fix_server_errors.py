with open("server.js", "r") as f:
    js = f.read()

if "process.on('unhandledRejection'" not in js:
    js = "process.on('unhandledRejection', (reason, promise) => { console.log('Handled rejection:', reason?.message || reason); });\n" + js

if "process.on('uncaughtException'" not in js:
    js = "process.on('uncaughtException', (err) => { console.log('Handled exception:', err.message); });\n" + js

with open("server.js", "w") as f:
    f.write(js)
