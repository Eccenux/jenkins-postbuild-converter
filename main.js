import * as fs from 'fs';
import path from 'path';
import { convert } from './convert.js';

const listFile = path.join('io', 'list.txt');
const jobsDir = path.join('io', 'jobs');

// const allConfigs = readConfigs(jobsDir);
// const configs = allConfigs.filter(f=>...);

// grep "postbuildscript@0." **/config.xml > ../list.txt
const listRaw = fs.readFileSync(listFile, 'utf-8');
const configs = listRaw
	.replace(/[\r\n]+/g, '\n')
	.replace(/xml:.+/g, 'xml')
	.split('\n')
;
console.log(configs);

for (const inFile of configs) {
	const inPath = path.join(jobsDir, inFile);
	const outPath = inPath;
	try {
		convert(inPath, outPath);
	} catch (error) {
		console.error(`[ERROR] Failed to convert "${inFile}".`, error);
	}
}