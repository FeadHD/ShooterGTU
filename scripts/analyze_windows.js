const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuration
const SRC_DIR = path.join(__dirname, '..', 'src');
const OUTPUT_DIR = path.join(__dirname, '..', 'analysis');

// Helper function to recursively find files
async function findFiles(dir, pattern) {
    const files = [];
    const items = await fs.promises.readdir(dir, { withFileTypes: true });
    
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            files.push(...await findFiles(fullPath, pattern));
        } else if (item.isFile() && pattern.test(item.name)) {
            files.push(fullPath);
        }
    }
    return files;
}

// Helper function to search content in file
async function searchInFile(file, pattern) {
    try {
        const content = await fs.promises.readFile(file, 'utf8');
        return pattern.test(content);
    } catch (error) {
        console.error(`Error reading ${file}:`, error);
        return false;
    }
}

// Analysis tasks
async function runAnalysis() {
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const tasks = [
        {
            name: 'Scene Hierarchy',
            pattern: /extends.*Scene/,
            outputFile: 'scene_hierarchy.txt'
        },
        {
            name: 'Manager Classes',
            pattern: /class.*{/,
            subdir: 'modules/managers',
            outputFile: 'manager_classes.txt'
        },
        {
            name: 'Event Handlers',
            pattern: /on\(/,
            outputFile: 'event_handlers.txt'
        },
        {
            name: 'Update Methods',
            pattern: /update.*\(/,
            outputFile: 'update_methods.txt'
        },
        {
            name: 'Collision Handlers',
            pattern: /collision|overlap/,
            outputFile: 'collision_handlers.txt'
        },
        {
            name: 'Constructors',
            pattern: /constructor.*\(/,
            outputFile: 'constructors.txt'
        }
    ];

    const results = {};

    for (const task of tasks) {
        const searchDir = task.subdir ? path.join(SRC_DIR, task.subdir) : SRC_DIR;
        const files = await findFiles(searchDir, /\.js$/);
        const matchingFiles = [];

        for (const file of files) {
            if (await searchInFile(file, task.pattern)) {
                matchingFiles.push(file);
            }
        }

        results[task.name] = matchingFiles;
        await fs.promises.writeFile(
            path.join(OUTPUT_DIR, task.outputFile),
            matchingFiles.join('\n')
        );
    }

    // Generate summary.md
    const timestamp = new Date().toLocaleString();
    let summaryContent = `# Codebase Analysis Summary\nGenerated on: ${timestamp}\n\n`;

    for (const [name, files] of Object.entries(results)) {
        summaryContent += `## ${name}\n\`\`\`\n${files.join('\n')}\n\`\`\`\n\n`;
    }

    await fs.promises.writeFile(
        path.join(OUTPUT_DIR, 'summary.md'),
        summaryContent
    );
}

// Run the analysis
runAnalysis().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
