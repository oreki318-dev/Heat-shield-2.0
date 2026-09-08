const fs = require('fs');
let css = fs.readFileSync('static/style.css', 'utf8');

// Replace specific neon box-shadows
css = css.replace(/box-shadow:[^;]*rgba\((2, 132, 199|56, 189, 248),[^;]*;/g, 'box-shadow: var(--shadow-hover);');

// Replace borders
css = css.replace(/border-color: rgba\((2, 132, 199|56, 189, 248), [^;]*;/g, 'border-color: var(--border-hover);');

// Replace backgrounds
css = css.replace(/background: rgba\((2, 132, 199|56, 189, 248), [^;]*;/g, 'background: var(--bg-card-hover);');

// Remove neon text-shadows
css = css.replace(/text-shadow:[^;]*rgba\([^;]*;/g, '');

// Clean up .active-strain-card background
css = css.replace(/background: linear-gradient[^;]*145deg[^;]*;/g, 'background: var(--bg-card-elevated);');

// Specific animation fix for sectionTargetPulse
css = css.replace(/box-shadow: 0 0 0 2px rgba\(2, 132, 199, 0\.7\), 0 0 35px rgba\(2, 132, 199, 0\.28\);/g, 'box-shadow: 0 0 0 2px var(--border-active);');
css = css.replace(/box-shadow: 0 0 0 2px rgba\(2, 132, 199, 0\.4\), 0 0 20px rgba\(2, 132, 199, 0\.15\);/g, 'box-shadow: 0 0 0 2px var(--border-hover);');


fs.writeFileSync('static/style.css', css);
console.log('CSS Sanitized');
