const fs = require('fs');
const path = require('path');

const codeGsPath = path.join(__dirname, '..', 'gas', 'Code.gs');
const indexHtmlPath = path.join(__dirname, '..', 'gas', 'Index.html');
const singleFilePath = path.join(__dirname, '..', 'gas', 'SingleFile_Code.gs');

const codeGs = fs.readFileSync(codeGsPath, 'utf8');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

const b64 = Buffer.from(indexHtml, 'utf8').toString('base64');

// Split base64 string into chunks of 1000 characters
const chunkSize = 1000;
const chunks = [];
for (let i = 0; i < b64.length; i += chunkSize) {
  chunks.push(JSON.stringify(b64.slice(i, i + chunkSize)));
}

const embeddedFunc = [
  '/**',
  ' * Embedded representation of Index.html for Single-File zero-friction deployment.',
  ' * Generated automatically from gas/Index.html.',
  ' */',
  'function getEmbeddedHtml() {',
  '  var b64Parts = [',
  '    ' + chunks.join(',\n    '),
  '  ];',
  '  var b64 = b64Parts.join("");',
  '  return Utilities.newBlob(Utilities.base64Decode(b64)).getDataAsString("UTF-8");',
  '}'
].join('\n');

const singleFileContent = codeGs.trim() + '\n\n' + embeddedFunc + '\n';
fs.writeFileSync(singleFilePath, singleFileContent, 'utf8');

console.log('SingleFile_Code.gs created successfully! Size:', singleFileContent.length, 'bytes');
