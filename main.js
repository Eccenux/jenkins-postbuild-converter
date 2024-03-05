import * as fs from 'fs';
import path from 'path';
import { convert } from './convert.js';

const listFile = path.join('io', 'list.txt');
const jobsDir = path.join('io', 'jobs');
const errorFile = path.join('io', 'error-log.txt');
const errorListFile = path.join('io', 'error-list.txt');

// const allConfigs = readConfigs(jobsDir);
// const configs = allConfigs.filter(f=>...);

// Read list
// grep "postbuildscript@0." **/config.xml > ../list.txt
const listRaw = fs.readFileSync(listFile, 'utf-8');
const configs = listRaw
	.trim()
	.replace(/[\r\n]+/g, '\n')
	.replace(/xml:.+/g, 'xml')
	.split('\n')
;
// console.log(configs);

// Main loop
const errors = [];
let ok = 0;
let total = 0;
for (const inFile of configs) {
	const inPath = path.join(jobsDir, inFile);
	const outPath = inPath;
	total++;
	try {
		convert(inPath, outPath);
		ok++;
	} catch (error) {
		errors.push({error, inFile});
		console.error(`[ERROR] Failed to convert "${inFile}".`);
	}
}

// Report
fs.writeFileSync(errorFile, '', 'utf-8');
fs.writeFileSync(errorListFile, '', 'utf-8');
console.error(`\n\nFinal report:`);
for (const e of errors) {
	const {error, inFile} = e;
	console.error(`[ERROR] Failed to convert "${inFile}".`);
	fs.appendFileSync(errorListFile, inFile);
	fs.appendFileSync(errorFile, `\n\n[ERROR] Failed to convert "${inFile}"\n`);
	// fs.appendFileSync(errorFile, error.toString());
	// fs.appendFileSync(errorFile, '\n');
	fs.appendFileSync(errorFile, error.stack);
}
console.log(`\n[INFO] Converted ${ok} of ${total}.`);
