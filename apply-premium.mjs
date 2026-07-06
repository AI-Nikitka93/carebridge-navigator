import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cssPath = path.join(__dirname, 'src', 'styles.css');

let css = fs.readFileSync(cssPath, 'utf8');

// 1. Replace :root
css = css.replace(/:root\s*\{[^}]+\}/, `:root {
  color-scheme: light;
  --ink: #0f172a;
  --muted: #64748b;
  --paper: #f8fafc;
  --panel: #ffffff;
  --line: #e2e8f0;
  --teal: #0d9488;
  --teal-soft: #ccfbf1;
  --indigo: #4338ca;
  --amber: #ea580c;
  --amber-soft: #ffedd5;
  --red: #e11d48;
  --red-soft: #ffe4e6;
  --green: #15803d;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
  --shadow-lg: 0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05);
  --shadow-hover: 0 25px 35px -5px rgb(0 0 0 / 0.08), 0 10px 15px -6px rgb(0 0 0 / 0.08);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-display: 'Outfit', ui-sans-serif, system-ui, sans-serif;
  font-family: var(--font-sans);
}`);

// 2. Replace body
css = css.replace(/body\s*\{[^}]+\}/, `body {
  margin: 0;
  min-width: 320px;
  background:
    radial-gradient(circle at 15% 10%, rgba(13, 148, 136, 0.08), transparent 25%),
    radial-gradient(circle at 85% 90%, rgba(67, 56, 202, 0.06), transparent 30%),
    var(--paper);
  background-attachment: fixed;
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
}`);

// 3. Update headings and add base transitions
// We will inject heading styles right after body { ... }
const bodyEndMatch = css.match(/body\s*\{[^}]+\}\s*/);
if (bodyEndMatch) {
  css = css.slice(0, bodyEndMatch.index + bodyEndMatch[0].length) + 
`
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: -0.02em;
}
` + css.slice(bodyEndMatch.index + bodyEndMatch[0].length);
}

// 4. Button transitions
css = css.replace(/button\s*\{\s*cursor:\s*pointer;\s*\}/, `button {
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
button:hover {
  transform: translateY(-1px);
}
button:active {
  transform: translateY(1px);
}`);

// 5. Update panel styles
// Original: 
// .topbar,
// .mission-band,
// .panel,
// .route-map {
//   border: 1px solid var(--line);
//   background: rgba(255, 255, 255, 0.88);
//   box-shadow: var(--shadow);
// }
css = css.replace(/\.topbar,[\s\S]*?\.route-map\s*\{[^}]+\}/, `.topbar,
.mission-band,
.panel,
.route-map {
  border: 1px solid rgba(226, 232, 240, 0.6);
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: var(--shadow-lg);
  border-radius: var(--radius-lg);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.panel:hover, .mission-band:hover {
  box-shadow: var(--shadow-hover);
}`);

// 6. Fix specific border-radius overrides
css = css.replace(/border-radius:\s*8px;/g, 'border-radius: var(--radius-md);');
css = css.replace(/border-radius:\s*999px;/g, 'border-radius: 9999px;'); // Chips and badges

// 7. Enhance inputs
css = css.replace(/\.select,\s*\.field input,\s*\.field select\s*\{[^}]+\}/, `.select,
.field input,
.field select,
.resource-form input,
.resource-form select {
  width: 100%;
  min-height: 48px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  background: #fff;
  color: var(--ink);
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.select:focus,
.field input:focus,
.field select:focus,
.resource-form input:focus,
.resource-form select:focus {
  outline: none;
  border-color: var(--teal);
  box-shadow: 0 0 0 3px var(--teal-soft);
}`);

// 8. Add fade-in animation
css += `
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

.mission-band { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
.route-map { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both; }
.workspace-grid { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both; }
.support-grid { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both; }
.readiness-panel { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both; }
`;

fs.writeFileSync(cssPath, css);
console.log('Premium styles applied.');
