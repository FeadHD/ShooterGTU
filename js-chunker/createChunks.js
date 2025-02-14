const fs = require('fs');
const path = require('path');
const babelParser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { encode } = require('gpt-tokenizer');

// Utility: slice lines from the code, 1-based indexing
function sliceLines(source, startLine, endLine) {
  const lines = source.split('\n');
  // endLine is inclusive
  return lines.slice(startLine - 1, endLine).join('\n');
}

// Get the file path from command line arguments
const filePath = process.argv[2];
if (!filePath) {
  console.error("Please specify a file path.");
  process.exit(1);
}

// Directory for output
const CHUNKS_DIR = path.join(__dirname, 'chunkstest');

// Dummy function to get related chunks
function getRelatedChunks(fileName, methodName) {
  return [];
}

// Simple tag logic
function generateTags(code) {
  const tags = [];
  if (code.includes('Phaser.')) tags.push('phaser3');
  if (code.match(/this\.container\.get/)) tags.push('dependency_injection');
  if (code.includes('group')) tags.push('object_pooling');
  return tags;
}

// We'll only use this for the class-level chunk to get top-level doc comments
function extractNotes(nodePath) {
  const comments = nodePath.node.leadingComments || [];
  return comments.map(c => c.value.trim()).join('\n') || "No notes available.";
}

// Track imports (usually top-level)
function extractImports(nodePath) {
  const imports = [];
  nodePath.traverse({
    ImportDeclaration(innerPath) {
      imports.push(innerPath.node.source.value);
    }
  });
  return imports;
}

// Basic validation
function validateChunk(chunk) {
  const tokens = encode(chunk.chunk_text).length;
  if (tokens > 1000) {
    console.warn(`Chunk ${chunk.chunk_index} in ${chunk.file_name} exceeds 1000 tokens (${tokens})`);
  }
  return true;
}

function parseFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');
  const ast = babelParser.parse(code, {
    sourceType: 'module',
    plugins: [
      'jsx',
      'typescript',
      'classProperties',
    ]
  });

  const chunks = [];
  const fileName = path.basename(filePath);

  traverse(ast, {
    // 1) Class Declarations => big chunk with doc comments
    ClassDeclaration(astPath) {
      const classNode = astPath.node;
      if (!classNode.loc) return;

      const { start, end } = classNode.loc;
      const chunkText = code.slice(start.offset, end.offset);

      const classChunk = {
        file_name: fileName,
        chunk_index: chunks.length,
        method: classNode.id ? classNode.id.name : 'anonymous_class',
        chunk_text: chunkText,
        metadata: {
          start_line: start.line,
          end_line: end.line,
          notes: extractNotes(astPath), // possible top-level doc
          imports: extractImports(astPath),
          tags: generateTags(chunkText),
          related_chunks: getRelatedChunks(fileName, 'class_definition')
        }
      };

      if (validateChunk(classChunk)) {
        chunks.push(classChunk);
      }
    },

    // 2) Class Methods => slice statements
    ClassMethod(astPath) {
      const methodNode = astPath.node;
      if (!methodNode.loc) return;

      // A ClassMethod's code typically lives in methodNode.body.body (array of statements).
      const bodyNode = methodNode.body;
      if (!bodyNode || !bodyNode.body || bodyNode.body.length === 0) {
        // If empty method, we can skip or just show empty braces
        const { start, end } = bodyNode.loc;
        const methodText = code.slice(start.offset, end.offset);

        return chunks.push({
          file_name: fileName,
          chunk_index: chunks.length,
          method: methodNode.key?.name || (methodNode.kind === 'constructor' ? 'constructor' : 'anonymous_method'),
          chunk_text: methodText,
          metadata: {
            start_line: methodNode.loc.start.line,
            end_line: methodNode.loc.end.line,
            notes: "Empty method body",
            imports: [],
            tags: generateTags(methodText),
            related_chunks: getRelatedChunks(fileName, methodNode.key?.name || 'anonymous_method')
          }
        });
      }

      // If there are statements, we base slicing on the first & last statement
      const firstStatement = bodyNode.body[0];
      const lastStatement = bodyNode.body[bodyNode.body.length - 1];

      // We want the braces too, so let's extend lines outward by 1 if you want to keep the braces.
      // But if Babel lumps the doc into the opening brace line, you might see it. 
      // Try as-is first:
      let firstLine = firstStatement.loc.start.line;
      let lastLine = lastStatement.loc.end.line;

      // The method's curly braces might be on lines around these statements:
      // methodNode.body.loc.start.line is the line with `{`
      // methodNode.body.loc.end.line is the line with `}`
      // If you want the braces, do:
      let methodStartLine = methodNode.body.loc.start.line;
      let methodEndLine = methodNode.body.loc.end.line;

      // We'll clamp them to keep everything from the opening brace to the closing brace
      // but nothing above. 
      if (methodStartLine < firstLine) methodStartLine = firstLine;
      if (methodEndLine > lastLine) methodEndLine = lastLine;

      // If you'd prefer ONLY the statements (no braces), skip the next two lines
      // For now, let's keep the braces:
      let chunkStart = Math.min(methodStartLine, firstLine);
      let chunkEnd = Math.max(methodEndLine, lastLine);

      // Now slice lines from chunkStart to chunkEnd
      const methodText = sliceLines(code, chunkStart, chunkEnd);

      // Identify the method name
      let methodName = methodNode.key?.name || 'anonymous_method';
      if (methodNode.kind === 'constructor') methodName = 'constructor';

      const chunk = {
        file_name: fileName,
        chunk_index: chunks.length,
        method: methodName,
        chunk_text: methodText,
        metadata: {
          start_line: methodNode.loc.start.line,
          end_line: methodNode.loc.end.line,
          notes: "Method body only (no doc comments).",
          imports: [],
          tags: generateTags(methodText),
          related_chunks: getRelatedChunks(fileName, methodName)
        }
      };

      if (validateChunk(chunk)) {
        chunks.push(chunk);
      }
    },

    // 3) Standalone Function Declarations
    FunctionDeclaration(astPath) {
      const funcNode = astPath.node;
      if (!funcNode.loc) return;

      const { start, end } = funcNode.loc;
      const chunkText = code.slice(start.offset, end.offset);

      const funcName = funcNode.id ? funcNode.id.name : `anonymous_${start.line}`;
      const chunk = {
        file_name: fileName,
        chunk_index: chunks.length,
        method: funcName,
        chunk_text,
        metadata: {
          start_line: start.line,
          end_line: end.line,
          notes: extractNotes(astPath),
          imports: extractImports(astPath),
          tags: generateTags(chunkText),
          related_chunks: getRelatedChunks(fileName, funcName)
        }
      };

      if (validateChunk(chunk)) {
        chunks.push(chunk);
      }
    }
  });

  return chunks;
}

function saveChunksToFile(chunks, fileName) {
  fs.mkdirSync(CHUNKS_DIR, { recursive: true });
  const outputFile = path.join(CHUNKS_DIR, path.basename(fileName).replace('.js', '.chunks.json'));
  fs.writeFileSync(outputFile, JSON.stringify(chunks, null, 2));
  console.log(`Chunks saved to ${outputFile}`);
}

// Main
const chunks = parseFile(filePath);
saveChunksToFile(chunks, filePath);
