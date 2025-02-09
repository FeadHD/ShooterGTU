const fs = require('fs');
const path = require('path');
const babelParser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { encode } = require('gpt-tokenizer');

const SRC_DIR = path.join(__dirname, 'src');
const CHUNKS_DIR = path.join(__dirname, 'dataset/chunks');

// 1. Parse AST and Extract Chunks
function parseFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');
  const ast = babelParser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript', 'classProperties']
  });

  const chunks = [];
  let currentChunk = null;

  traverse(ast, {
    enter(path) {
      if (path.isFunctionDeclaration() || path.isClassMethod() || path.isClass()) {
        const { start, end } = path.node.loc;
        const chunkText = code.slice(start.offset, end.offset);
        
        currentChunk = {
          file_name: path.basename(filePath),
          chunk_index: chunks.length + 1,
          method: path.node.id?.name || 'anonymous',
          chunk_text: chunkText,
          metadata: {
            start_line: start.line,
            end_line: end.line,
            notes: extractNotes(path),
            imports: extractImports(path),
            tags: generateTags(chunkText)
          }
        };
        
        chunks.push(currentChunk);
      }
    }
  });

  return chunks;
}

// 2. Helper Functions
function extractNotes(node) {
  // Extract JSDoc comments or inline comments
  const comments = node.node.leadingComments || [];
  return comments.map(c => c.value.trim()).join('\n');
}

function extractImports(node) {
  // Track imports used in this chunk
  const imports = [];
  traverse(node, {
    ImportDeclaration(path) {
      imports.push(path.node.source.value);
    }
  });
  return imports;
}

function generateTags(code) {
  // Custom logic for domain-specific tagging
  const tags = [];
  if (code.includes('Phaser.')) tags.push('phaser3');
  if (code.match(/this\.container\.get/)) tags.push('dependency_injection');
  return tags;
}

// 3. Token Check & Validation
function validateChunk(chunk) {
  const tokens = encode(chunk.chunk_text).length;
  if (tokens > 1000) {
    console.warn(`Chunk ${chunk.chunk_index} in ${chunk.file_name} exceeds 1000 tokens (${tokens})`);
    return false;
  }
  return true;
}

// 4. Save Chunks
function processDirectory(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(dirent => {
    const srcPath = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      processDirectory(srcPath);
    } else if (dirent.name.endsWith('.js')) {
      const chunks = parseFile(srcPath).filter(validateChunk);
      const relativePath = path.relative(SRC_DIR, dir);
      const outputDir = path.join(CHUNKS_DIR, relativePath);
      
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(
        path.join(outputDir, dirent.name.replace('.js', '.json')),
        JSON.stringify(chunks, null, 2)
      );
    }
  });
}

// Run the processor
processDirectory(SRC_DIR);