const fs = require('fs');
let css = fs.readFileSync('static/style.css', 'utf8');

css = css.replace(/background: rgba\(22,\s*34,\s*56,\s*0\.9\);/g, 'background: var(--bg-card-hover);');

fs.writeFileSync('static/style.css', css);
console.log('Hover backgrounds sanitized');
