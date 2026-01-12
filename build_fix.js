
const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, 'js', 'admin.js');
const dest = path.join(__dirname, 'js', 'admin_final.js');

try {
    console.log('Reading source...');
    let content = fs.readFileSync(source, 'utf8');
    const lines = content.split(/\r?\n/);
    console.log(`Source line count: ${lines.length}`);

    // Cut off zombie code
    // We'll take lines 0 to 1695
    let finalLines = lines.slice(0, 1695);

    // Remove any existing "DEBUG" or "alert" lines from the top to avoid duplicates
    // We will strip the first few lines if they look like our previous insertions
    // Look for "const Admin = {"
    let adminStartLine = -1;
    for (let i = 0; i < 20; i++) {
        if (finalLines[i].includes('const Admin = {')) {
            adminStartLine = i;
            break;
        }
    }

    if (adminStartLine === -1) {
        throw new Error('Could not find "const Admin = {" start!');
    }

    console.log(`Found Admin start at line ${adminStartLine}`);

    // We only keep from "const Admin = {" onwards
    // Discarding any trash above it
    finalLines = finalLines.slice(adminStartLine);

    // Now finalLines[0] is "const Admin = {"

    // Remove any 'init:' lines that might have alerts immediately following
    // Actually, let's just REPLACE the first few lines with a clean header
    // But we need to keep the rest of the object.

    // Let's just prepend a GLOBAL alert. 
    // AND ensure the object is closed properly.

    finalLines.push('};');

    // Construct the FINAL STRING
    const finalContent =
        `// FINAL FIXED FILE
alert("SUCCESS: LOADED FINAL FIXED FILE (admin_final.js)");

${finalLines.join('\n')}
`;

    fs.writeFileSync(dest, finalContent, 'utf8');
    console.log(`Success! Wrote new file to ${dest}`);

} catch (err) {
    console.error('BUILD FAILED:', err);
    process.exit(1);
}
