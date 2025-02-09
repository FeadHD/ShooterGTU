const fs = require('fs');
const path = require('path');
const babelParser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { encode } = require('gpt-tokenizer');

// Get the file path from command line arguments
const filePath = process.argv[2];

if (!filePath) {
  console.error("Please specify a file path.");
  process.exit(1);
}

// Define the output directory relative to the script location
const CHUNKS_DIR = path.join(__dirname, '..', 'public', 'dataset', 'chunks');

// Parse AST and Extract Chunks
function parseFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');
  const ast = babelParser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx']
  });

  const chunks = [];
  const fileName = path.basename(filePath);
  let classDefinition = null;

  // First pass: get class definition
  traverse(ast, {
    ClassDeclaration(path) {
      const { start, end } = path.node.loc;
      const classText = code.slice(start.offset, end.offset).split('{')[0] + '{';
      
      classDefinition = {
        file_name: fileName,
        chunk_index: 0,
        method: 'class_definition',
        chunk_text: classText,
        metadata: {
          start_line: start.line,
          end_line: start.line + classText.split('\n').length,
          notes: extractNotes(path),
          imports: extractImports(path),
          tags: ['class_definition', 'phaser3'],
          related_chunks: []
        }
      };
      
      path.skip();
    }
  });

  if (classDefinition) {
    chunks.push(classDefinition);
  }

  // Second pass: get methods
  traverse(ast, {
    ClassMethod(path) {
      const { start, end } = path.node.loc;
      const lines = code.split('\n');
      const methodText = lines.slice(start.line - 1, end.line).join('\n');
      const methodName = path.node.key.name;
      
      // Debug the actual text
      console.log(`\nProcessing method: ${methodName}`);
      console.log(`Method text length: ${methodText.length} characters`);
      
      try {
        const tokens = encode(methodText);
        console.log(`Token count: ${tokens.length}`);
        
        if (tokens.length > 1000) {
          console.log(`Skipping ${methodName} - too large (${tokens.length} tokens)`);
          return;
        }

        console.log(`Processing ${methodName} - ${tokens.length} tokens`);
      
        const chunk = {
          file_name: fileName,
          chunk_index: chunks.length,
          method: methodName || `anonymous_${start.line}`,
          chunk_text: methodText,
          metadata: {
            start_line: start.line,
            end_line: end.line,
            notes: extractNotes(path),
            imports: [],
            tags: generateTags(methodText),
            related_chunks: []
          }
        };
      
        addRelatedChunks(path, chunk);
        chunks.push(chunk);
      } catch (error) {
        console.error(`Error processing method ${methodName}: ${error}`);
      }
    }
  });
  
  return chunks;
}

function extractNotes(path) {
  const comments = path.node.leadingComments || [];
  return comments.map(c => c.value.trim()).join('\n');
}

function extractImports(path) {
  const imports = [];
  const program = path.findParent((p) => p.isProgram());
  if (program) {
    program.traverse({
      ImportDeclaration(path) {
        imports.push(path.node.source.value);
      }
    });
  }
  return imports;
}

function generateTags(code) {
  const tags = [];
  if (code.includes('Phaser.')) tags.push('phaser3');
  if (code.includes('collision')) tags.push('collision');
  if (code.includes('setup')) tags.push('setup');
  if (code.includes('bullet')) tags.push('bullet');
  if (code.includes('enemy')) tags.push('enemy');
  if (code.includes('player')) tags.push('player');
  return tags;
}

function addRelatedChunks(path, currentChunk) {
  const relatedChunks = [];
  path.traverse({
    CallExpression(callPath) {
      const callee = callPath.node.callee;
      if (callee.type === 'MemberExpression') {
        const methodName = callee.property.name;
        if (methodName && methodName.startsWith('setup')) {
          relatedChunks.push({
            file_name: currentChunk.file_name,
            chunk_index: 0, // We'll fix indices later
            method: methodName
          });
        }
      }
    }
  });
  currentChunk.metadata.related_chunks = relatedChunks;
}

function saveChunksToFile(chunks, sourceFilePath) {
  const relPath = path.relative(path.join(__dirname, '..', 'src'), path.dirname(sourceFilePath));
  const outputDir = path.join(CHUNKS_DIR, relPath);
  
  fs.mkdirSync(outputDir, { recursive: true });
  
  const outputFile = path.join(outputDir, path.basename(sourceFilePath).replace('.js', '.js.chunks.json'));
  fs.writeFileSync(outputFile, JSON.stringify(chunks, null, 2));
  console.log(`Chunks saved to ${outputFile}`);
}

try {
  const chunks = parseFile(filePath);
  if (chunks.length > 0) {
    saveChunksToFile(chunks, filePath);
    console.log(`Successfully processed ${chunks.length} chunks`);
  } else {
    console.log('No valid chunks found');
  }
} catch (error) {
  console.error('Error processing file:', error);
  process.exit(1);
}
