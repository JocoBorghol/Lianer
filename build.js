import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { minify } from 'terser';
import postcss from 'postcss';
import cssnano from 'cssnano';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');

// Utility for recursive directory copying
function copyDirSync(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    let entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        let srcPath = path.join(src, entry.name);
        let destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// 1. Rensa mappen dist/ om den finns, annars skapa den
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

async function build() {
    console.log('Building for production...');

    // 2. Minifiera vår JS från src/ till dist/main.min.js med Terser
    // Vi minifierar 'app.js' till 'dist/main.min.js'
    console.log('Minifying JS to main.min.js...');
    const appJsCode = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    const appJsMinified = await minify(appJsCode, { module: true, compress: true, mangle: true });
    fs.writeFileSync(path.join(distDir, 'main.min.js'), appJsMinified.code);

    // Vi minifierar även hela 'js/'-mappen eftersom ES-modulerna i main.min.js laddar från './js/...'
    async function minifyJsDir(srcDir, destDir) {
        if (!fs.existsSync(srcDir)) return;
        fs.mkdirSync(destDir, { recursive: true });
        const entries = fs.readdirSync(srcDir, { withFileTypes: true });
        for (let entry of entries) {
            const srcPath = path.join(srcDir, entry.name);
            const destPath = path.join(destDir, entry.name);
            if (entry.isDirectory()) {
                await minifyJsDir(srcPath, destPath);
            } else if (entry.name.endsWith('.js')) {
                const code = fs.readFileSync(srcPath, 'utf8');
                const min = await minify(code, { module: true, compress: true, mangle: true });
                fs.writeFileSync(destPath, min.code);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }
    await minifyJsDir(path.join(__dirname, 'js'), path.join(distDir, 'js'));

    // Minifiera service-worker
    if (fs.existsSync(path.join(__dirname, 'service-worker.js'))) {
        const swCode = fs.readFileSync(path.join(__dirname, 'service-worker.js'), 'utf8');
        const swMinified = await minify(swCode, { compress: true, mangle: true });
        fs.writeFileSync(path.join(distDir, 'service-worker.js'), swMinified.code);
    }

    // 3. Minifiera CSS
    console.log('Minifying CSS to style.min.css...');
    const cssFiles = [
        'css/variables.css',
        'css/main.css',
        'css/dashboard.css',
        'css/tasks.css',
        'css/contacts.css'
    ];
    let combinedCss = '';
    for (const file of cssFiles) {
        if (fs.existsSync(path.join(__dirname, file))) {
            combinedCss += fs.readFileSync(path.join(__dirname, file), 'utf8') + '\n';
        }
    }
    const cssResult = await postcss([cssnano]).process(combinedCss, { from: undefined });
    fs.writeFileSync(path.join(distDir, 'style.min.css'), cssResult.css);

    // 3b. Build critical CSS (variables + core layout from main.css lines 1-172)
    // This is the minimum CSS needed to render the initial loader and app shell
    console.log('Extracting critical CSS for inlining...');
    const variablesCss = fs.readFileSync(path.join(__dirname, 'css/variables.css'), 'utf8');
    const mainCssLines = fs.readFileSync(path.join(__dirname, 'css/main.css'), 'utf8').split('\n');
    const criticalMainCss = mainCssLines.slice(0, 173).join('\n');
    const criticalCssRaw = variablesCss + '\n' + criticalMainCss;
    const criticalResult = await postcss([cssnano]).process(criticalCssRaw, { from: undefined });
    const criticalCssInline = criticalResult.css;
    console.log(`  Critical CSS: ${(criticalCssInline.length / 1024).toFixed(1)} KiB (inlined)`);

    // 4. Kopiera index.html till dist/ och uppdatera länkarna
    console.log('Processing and copying index.html...');
    let indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

    // Strip only LOCAL CSS stylesheet links (not Google Fonts)
    indexHtml = indexHtml.replace(/<link rel="stylesheet" href="css\/.*?>[\s\n]*/g, '');
    // Strip only the noscript block containing local CSS fallbacks
    indexHtml = indexHtml.replace(/<noscript>\s*<link rel="stylesheet" href="css\/[\s\S]*?<\/noscript>[\s\n]*/g, '');
    // Clean up any leftover empty noscript blocks
    indexHtml = indexHtml.replace(/<noscript>\s*<\/noscript>[\s\n]*/g, '');

    // Strip old modulepreload hints (they only listed a few dev paths)
    indexHtml = indexHtml.replace(/<link rel="modulepreload"[^>]*>\s*\n?/g, '');

    // Rename app.js → main.min.js (must happen before modulepreload injection)
    indexHtml = indexHtml.replace(/"app\.js"/g, '"main.min.js"');

    // 4b. Inject modulepreload hints for CRITICAL-PATH modules only
    // Only preload modules needed for the initial dashboard render.
    // Lazy-loaded views (calendar, tasks, settings, contacts) are excluded.
    console.log('Injecting modulepreload hints for critical-path modules...');
    const criticalModules = [
        'main.min.js',
        'js/views/viewController.js',
        'js/views/dashboardView.js',
        'js/menu/sideMenu.js',
        'js/observer.js',
        'js/theme.js',
        'js/taskList/seed.js',
        'js/storage.js',
        'js/comps/btn.js',
        'js/comps/themeBtn.js',
        'js/comps/dialog.js',
        'js/data/tasks.js',
        'js/status.js',
    ];
    const allPreloads = criticalModules;
    const preloadHints = allPreloads.map(f => `  <link rel="modulepreload" href="${f}" />`).join('\n');
    // Inject right after the <script> tag for main.min.js
    indexHtml = indexHtml.replace(
        /(<script defer type="module" src="main\.min\.js"><\/script>)/,
        `$1\n${preloadHints}`
    );
    console.log(`  Added ${allPreloads.length} modulepreload hints`);

    // Inline critical CSS + async-load full stylesheet (media=print/onload trick)
    const cssInjectBlock = `  <style>${criticalCssInline}</style>\n  <link rel="stylesheet" href="style.min.css" media="print" onload="this.media='all'" />\n  <noscript><link rel="stylesheet" href="style.min.css" /></noscript>\n`;
    indexHtml = indexHtml.replace(/<\/head>/, cssInjectBlock + '</head>');


    // 5. Copy and minify vendor JS
    console.log('Copying and minifying vendor files to dist/vendor...');
    const vendorSrc = path.join(__dirname, 'vendor');
    if (fs.existsSync(vendorSrc)) {
        const vendorDest = path.join(distDir, 'vendor');
        fs.mkdirSync(vendorDest, { recursive: true });
        const vendorFiles = fs.readdirSync(vendorSrc);
        for (const file of vendorFiles) {
            const srcPath = path.join(vendorSrc, file);
            const destPath = path.join(vendorDest, file);
            if (file.endsWith('.js') && !file.endsWith('.min.js')) {
                // Minify non-minified JS vendor files
                const code = fs.readFileSync(srcPath, 'utf8');
                const result = await minify(code, { compress: true, mangle: true });
                fs.writeFileSync(destPath, result.code);
                console.log(`  Minified vendor/${file} (${(code.length / 1024).toFixed(1)} KiB → ${(result.code.length / 1024).toFixed(1)} KiB)`);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }


    fs.writeFileSync(path.join(distDir, 'index.html'), indexHtml);

    // Kopiera övrigt som kan krävas (ikoner, manifest)
    if (fs.existsSync(path.join(__dirname, 'manifest.webmanifest'))) {
        fs.copyFileSync(path.join(__dirname, 'manifest.webmanifest'), path.join(distDir, 'manifest.webmanifest'));
    }
    if (fs.existsSync(path.join(__dirname, 'icons'))) {
        copyDirSync(path.join(__dirname, 'icons'), path.join(distDir, 'icons'));
    }

    console.log('Build completed successfully!');
}

build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});
