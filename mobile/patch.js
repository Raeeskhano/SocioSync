const fs = require('fs');
const file = 'node_modules/react-native-css-interop/dist/css-to-rn/parseDeclaration.js';
let content = fs.readFileSync(file, 'utf8');

// Replace the entire parseAspectRatio function
const newFunc = `function parseAspectRatio(aspectRatio) {
    if (aspectRatio.auto || !aspectRatio.ratio) {
        return "auto";
    }
    else {
        if (aspectRatio.ratio[0] === aspectRatio.ratio[1]) {
            return 1;
        }
        else {
            return aspectRatio.ratio.join(" / ");
        }
    }
}`;

content = content.replace(/function parseAspectRatio\(aspectRatio\) \{[\s\S]*?    \}\n\}/, newFunc);
fs.writeFileSync(file, content);
console.log("Patched successfully!");
