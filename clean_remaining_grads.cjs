const fs = require('fs');
let css = fs.readFileSync('static/style.css', 'utf8');

// Dashboard sub-panels
css = css.replace(/background: linear-gradient\(180deg, rgba\(14,\s*20,\s*34[^;]*;/g, 'background: var(--bg-card);');
css = css.replace(/background: linear-gradient\(145deg, rgba\(14,\s*165,\s*233[^;]*;/g, 'background: var(--bg-card-elevated);');

// Alert cards - use subtle backgrounds instead of complex gradients
css = css.replace(/background: linear-gradient\(160deg, #090D14 0%, rgba\(16, 185, 129, 0\.05\) 50%, #0E131F 100%\);/g, 'background: var(--status-green-subtle);');
css = css.replace(/background: linear-gradient\(160deg, #090D14 0%, rgba\(245, 158, 11, 0\.06\) 50%, #0E131F 100%\);/g, 'background: var(--status-yellow-subtle);');
css = css.replace(/background: linear-gradient\(160deg, #090D14 0%, rgba\(249, 115, 22, 0\.07\) 50%, #0E131F 100%\);/g, 'background: var(--status-orange-subtle);');
css = css.replace(/background: linear-gradient\(160deg, #090D14 0%, rgba\(239, 68, 68, 0\.08\) 50%, #0E131F 100%\);/g, 'background: var(--status-red-subtle);');
css = css.replace(/background: linear-gradient\(160deg, #090D14 0%, rgba\(225, 29, 72, 0\.1\) 50%, #0E131F 100%\);/g, 'background: var(--status-dark-red-subtle);');

// The vulnerable-groups gradient
css = css.replace(/background: linear-gradient\(90deg, rgba\(245, 158, 11, 0\.05\) 0%, rgba\(0,0,0,0\.15\) 100%\);/g, 'background: var(--status-orange-subtle);');
css = css.replace(/background: linear-gradient\(90deg, rgba\(245, 158, 11, 0\.1\) 0%, rgba\(0,0,0,0\.2\) 100%\);/g, 'background: rgba(245, 158, 11, 0.15);');

// Clean up gauge lines
css = css.replace(/background: linear-gradient\(90deg, transparent, rgba\(56, 189, 248, 0\.7\), transparent\);/g, 'background: var(--border-active);');

fs.writeFileSync('static/style.css', css);
console.log('Remaining gradients cleaned');
