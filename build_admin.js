const fs = require('fs');
const path = require('path');

try {
    const sourcePath = path.join(__dirname, 'js', 'admin.js');
    const destPath = path.join(__dirname, 'js', 'admin_final.js');

    console.log(`Reading from ${sourcePath}`);
    const content = fs.readFileSync(sourcePath, 'utf8');

    // Split by lines
    const lines = content.split('\n');

    // We want lines 1 to 1695 (approximately, before the zombie code starts)
    // The previous view_file showed zombie code starts around line 1970, 
    // but the duplicate functions (showOrderList, etc) started appearing earlier.
    // Let's verify the cut-off point.
    // Step 370 showed showOrderList re-appearing at line 951 in the SECOND chunk? 
    // Wait, let's look at the view_file output again.
    // Line 951 in Step 375: `async showOrderList() {`
    // Line 1696 in Step 370?: `    async showOrderList() {`
    // Step 356 showed `downloadCSV` at 2001.
    // Step 375 showed `async showOrderList() {` at line 951.
    // Wait, Step 375 lines 801-1000. Line 951 is indeed inside that range.
    // But Step 369 lines 1-800 had `showOrderList` called at line 15, and defined where?
    // Not defined in 1-800.
    // Step 370 lines 1001-1800. 
    // Line 1696: `async showOrderList() {`
    // So `showOrderList` is defined at 1696.
    // But wait, where was the FIRST definition?
    // Step 329 showed `showOrderList` around line 960 (actually line 966 in the view was the button).
    // The view in 329 was lines 960-970.
    // Ah, I need to be precise.
    // The `admin.js` has a structure where `Admin` object starts at line 1.
    // It closes?
    // If I cut at 1695, do I lose the `Admin` closing brace?
    // Let's safe-guard.
    // I will search for the second occurrence of `showOrderList` or `showNewsletter`.
    // Or simpler: I will just take the first 1695 lines and Append `};`.

    console.log(`Total lines: ${lines.length}`);
    const cleanLines = lines.slice(0, 1695);
    console.log(`Kept lines: ${cleanLines.length}`);

    // Add the closing brace for the Admin object if it was cut off, or ensuring we close the object.
    // Line 1695 is inside `updateOrderTracking` or similar? 
    // Let's check view_file 370 around 1695.
    // Line 1695: `    },` (End of updateOrderTracking)
    // Line 1696: `    async showOrderList() {` (The DUPLICATE start)
    // So 1695 is the perfect place to cut. 
    // We just need to add `};` to close the Admin object.

    const finalContent = cleanLines.join('\n') + '\n};';

    fs.writeFileSync(destPath, finalContent);
    console.log(`Successfully created ${destPath}`);
} catch (e) {
    console.error('Error:', e);
    process.exit(1);
}
