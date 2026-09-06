const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');
code = code.replace("app.use(express.json());", "app.use(express.json());\napp.use((err, req, res, next) => {\n  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {\n    console.error('JSON Parse Error:', err.message);\n    return res.status(400).send({ error: err.message });\n  }\n  next();\n});");
fs.writeFileSync('server.js', code);
