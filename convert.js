import * as fs from 'fs';
import path from 'path';
import { convertXml } from './PostBuildHelper.js';

/**
 * Convert config.xml.
 * @param {String} inPath Path to config.xml.
 * @param {String} outPath Some output path (can be the same).
 * @returns === true if everything was converted.
 */
export function convert(inPath, outPath) {
	// Load your XML file
	const xmlData = fs.readFileSync(inPath, 'utf-8');

	const warnings = [];
	const {output, doneNodes, totalNodes} = convertXml(xmlData, warnings);

	if (doneNodes) {
		fs.writeFileSync(outPath, output, 'utf-8');
	}

	if (totalNodes == 0) {
		console.log(`[DEBUG] Nothing to convert in "${inPath}"`);
	} else if (doneNodes == totalNodes) {
		if (!warnings.length) {
			console.log(`[INFO] OK. Converted "${inPath}"`);
			return true;
		}
		console.log(`[INFO] Converted "${inPath}" with warning(s).`);
	} else if (doneNodes != totalNodes) {
		console.warn(`[WARN] Not fully converted. Converted ${doneNodes} of ${totalNodes} nodes in "${inPath}"`);
	} else {
		console.error(`[ERROR] What happend? ${doneNodes} of ${totalNodes} nodes in "${inPath}"`);
	}
	return {doneNodes, totalNodes, warnings};
}

/**
 * Read dir for configs.
 * @param {String} baseDir Jobs dir (contains job dirs).
 * @param {String} inName The conf file name.
 */
export function readConfigs(baseDir, inName = 'config.xml') {
	const files = [];
	const errors = [];
	try {
		// Read all subdirectories in the base directory
		const subDirs = fs.readdirSync(baseDir, { withFileTypes: true });

		// Filter directories and iterate over them
		for (const dirent of subDirs.filter(dirent => dirent.isDirectory())) {
			const subDirPath = path.join(baseDir, dirent.name);
			const configPath = path.join(subDirPath, inName);
			// Check if config.xml exists in the subdirectory
			try {
				fs.accessSync(configPath);
				files.push(configPath);
			} catch (error) {
				errors.push({error, configPath});
			}
		}
	} catch (error) {
		console.error(`[ERROR] Error processing job configurations: ${error}`);
		errors.push({error});
	}
	return {files, errors};
}

