#!/usr/bin/env node

/**
 * Version management script for depmap
 * Generates version info from package.json + build metadata
 */

import fs from 'fs';
import { execSync } from 'child_process';

// Read package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const baseVersion = packageJson.version;

// Get git info
let gitCommit = 'unknown';
let gitBranch = 'unknown';
let gitTag = null;

try {
    gitCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    
    // Check if current commit has a tag
    try {
        gitTag = execSync('git describe --exact-match --tags HEAD', { encoding: 'utf8' }).trim();
    } catch {
        // No tag on current commit, that's fine
    }
} catch (e) {
    console.warn('Could not get git info:', e.message);
}

// Generate build timestamp
const buildTime = new Date().toISOString();
const buildTimestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

// Create version object
const versionInfo = {
    version: baseVersion,
    buildTime,
    buildTimestamp,
    gitCommit,
    gitBranch,
    gitTag,
    // Full version string for display
    full: gitTag || `${baseVersion}+${buildTimestamp}.${gitCommit}`,
    // Simple display version
    display: gitTag || `${baseVersion} (${gitCommit})`
};

// Write version info to a file that can be imported
const versionFile = `// Auto-generated version info - do not edit manually
export const VERSION_INFO = ${JSON.stringify(versionInfo, null, 2)};
export const VERSION = '${versionInfo.full}';
export const VERSION_DISPLAY = '${versionInfo.display}';
`;

fs.writeFileSync('src/version.js', versionFile);

// Also create a JSON file for build scripts
fs.writeFileSync('version.json', JSON.stringify(versionInfo, null, 2));

console.log(`Generated version: ${versionInfo.display}`);
console.log(`Full version: ${versionInfo.full}`);

export default versionInfo;
