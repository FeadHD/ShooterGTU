const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuration
const SRC_DIR = path.join(__dirname, '..', 'src');
const OUTPUT_DIR = path.join(__dirname, '..', 'analysis');

// Analysis patterns
const ANALYSIS_TASKS = [
    {
        name: 'Scene Hierarchy',
        command: `powershell -Command "Get-ChildItem -Path '${SRC_DIR}' -Recurse -Filter *.js | Select-String -Pattern 'extends.*Scene' -List | ForEach-Object { $_.Path }"`,
        outputFile: 'scene_hierarchy.txt'
    },
    {
        name: 'Manager Classes',
        command: `powershell -Command "Get-ChildItem -Path '${SRC_DIR}/modules/managers' -Filter *.js | Select-String -Pattern 'class.*{' -List | ForEach-Object { $_.Path }"`,
        outputFile: 'manager_classes.txt'
    },
    {
        name: 'Event Handlers',
        command: `powershell -Command "Get-ChildItem -Path '${SRC_DIR}' -Recurse -Filter *.js | Select-String -Pattern 'on\\(.*\\)' -List | ForEach-Object { $_.Path }"`,
        outputFile: 'event_handlers.txt'
    },
    {
        name: 'Update Methods',
        command: `powershell -Command "Get-ChildItem -Path '${SRC_DIR}' -Recurse -Filter *.js | Select-String -Pattern 'update.*\\(' -List | ForEach-Object { $_.Path }"`,
        outputFile: 'update_methods.txt'
    },
    {
        name: 'Collision Handlers',
        command: `powershell -Command "Get-ChildItem -Path '${SRC_DIR}' -Recurse -Filter *.js | Select-String -Pattern 'collide.*\\(|overlap.*\\(|addCollider.*\\(' -List | ForEach-Object { $_.Path }"`,
        outputFile: 'collision_handlers.txt'
    },
    {
        name: 'Constructor Patterns',
        command: `powershell -Command "Get-ChildItem -Path '${SRC_DIR}' -Recurse -Filter *.js | Select-String -Pattern 'constructor.*\\(' -List | ForEach-Object { $_.Path }"`,
        outputFile: 'constructors.txt'
    }
];

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

// Function to run analysis task
async function runAnalysis(task) {
    console.log(`\n🔍 Running ${task.name} analysis...`);
    try {
        const { stdout } = await execPromise(task.command);
        const outputPath = path.join(OUTPUT_DIR, task.outputFile);
        fs.writeFileSync(outputPath, stdout);
        console.log(`✅ ${task.name} analysis complete. Results saved to ${task.outputFile}`);
        
        // Print summary
        const lines = stdout.split('\n').filter(line => line.trim());
        console.log(`   Found ${lines.length} matches`);
        
        // Print first few matches as preview
        if (lines.length > 0) {
            console.log('\n   Preview of first 3 matches:');
            lines.slice(0, 3).forEach(line => {
                console.log(`   - ${line}`);
            });
        }

        // For each file found, also get the actual matches
        if (lines.length > 0) {
            const detailsPath = path.join(OUTPUT_DIR, `${path.parse(task.outputFile).name}_details.txt`);
            let details = '';
            for (const file of lines) {
                if (!file.trim()) continue;
                const pattern = task.name === 'Scene Hierarchy' ? 'extends.*Scene' :
                              task.name === 'Event Handlers' ? 'on\\(.*\\)' :
                              task.name === 'Update Methods' ? 'update.*\\(' :
                              task.name === 'Collision Handlers' ? 'collide.*\\(|overlap.*\\(|addCollider.*\\(' :
                              task.name === 'Constructor Patterns' ? 'constructor.*\\(' :
                              'class.*{';
                const { stdout: fileMatches } = await execPromise(`powershell -Command "Select-String -Path '${file}' -Pattern '${pattern}' | ForEach-Object { $_.LineNumber.ToString() + ': ' + $_.Line.Trim() }"`);
                if (fileMatches) {
                    details += `\n=== ${file} ===\n${fileMatches}\n`;
                }
            }
            fs.writeFileSync(detailsPath, details);
        }
    } catch (error) {
        console.error(`❌ Error in ${task.name} analysis:`, error.message);
    }
}

// Function to generate summary report
function generateSummaryReport() {
    console.log('\n📊 Generating Summary Report...');
    let summary = '# Codebase Analysis Summary\n\n';
    
    ANALYSIS_TASKS.forEach(task => {
        const outputPath = path.join(OUTPUT_DIR, task.outputFile);
        const detailsPath = path.join(OUTPUT_DIR, `${path.parse(task.outputFile).name}_details.txt`);
        
        if (fs.existsSync(outputPath)) {
            const content = fs.readFileSync(outputPath, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            summary += `## ${task.name}\n`;
            summary += `- Found ${lines.length} matches\n`;
            
            // Add file list
            if (lines.length > 0) {
                summary += '### Files:\n';
                lines.forEach(line => {
                    if (line.trim()) {
                        summary += `- ${line}\n`;
                    }
                });
            }
            
            // Add details if available
            if (fs.existsSync(detailsPath)) {
                const details = fs.readFileSync(detailsPath, 'utf8');
                summary += '\n### Details:\n```javascript\n' + details + '\n```\n';
            }
            
            summary += '\n';
        }
    });
    
    fs.writeFileSync(path.join(OUTPUT_DIR, 'summary.md'), summary);
    console.log('✅ Summary report generated: analysis/summary.md');
}

// Main execution
async function main() {
    console.log('🚀 Starting codebase analysis...');
    console.log(`📁 Analyzing source directory: ${SRC_DIR}`);
    console.log(`📁 Output directory: ${OUTPUT_DIR}`);
    
    // Run all analysis tasks
    for (const task of ANALYSIS_TASKS) {
        await runAnalysis(task);
    }
    
    // Generate summary
    generateSummaryReport();
    
    console.log('\n✨ Analysis complete! Check the analysis directory for detailed results.');
}

// Run the analysis
main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
