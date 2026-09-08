const fs = require('fs');
let css = fs.readFileSync('static/style.css', 'utf8');

// Replace standard gradient cards with var(--bg-card)
css = css.replace(/background: linear-gradient\([^;]*rgba\((14|16|19|22),\s*(20|25|29|32|34),\s*(36|42|48|54|56)[^;]*;/g, 'background: var(--bg-card);');
css = css.replace(/background: linear-gradient\([^;]*rgba\((16|22),\s*(25|34),\s*(42|56)[^;]*;/g, 'background: var(--bg-card);');
css = css.replace(/background: linear-gradient\(180deg,\s*rgba\(16,\s*25,\s*42[^;]*;/g, 'background: var(--bg-card);');
css = css.replace(/background: linear-gradient\(160deg,\s*rgba\(16,\s*23,\s*40[^;]*;/g, 'background: var(--bg-card);');
css = css.replace(/background: linear-gradient\(165deg,\s*rgba\(14,\s*20,\s*36[^;]*;/g, 'background: var(--bg-card);');

fs.writeFileSync('static/style.css', css);
console.log('Gradients stripped');
