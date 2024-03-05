import * as fs from 'fs';
import { JSDOM } from 'jsdom';
import { convertPostBuildScript } from './PostBuildHelper.js';

/**
 * Convert config.xml.
 * @param {String} inPath Path to config.xml.
 * @param {String} outPath Some output path (can be the same).
 * @returns === true if everything was converted.
 */
export function convert(inPath, outPath) {
	// Load your XML file
	const xmlData = fs.readFileSync(inPath, 'utf-8');

	// Parse the XML
	const dom = new JSDOM(xmlData, { contentType: 'application/xml' });
	const document = dom.window.document;

	// Convert
	const {doneNodes, totalNodes} = convertPostBuildScript(document);

	// Write the modified XML back to a file
	if (doneNodes) {
		let header = `<?xml version='1.0' encoding='UTF-8'?>\n`;
		fs.writeFileSync(outPath, header + dom.serialize(), 'utf-8');
	}

	if (totalNodes == 0) {
		console.log(`[DEBUG] Nothing to convert in "${inPath}"`);
	} else if (doneNodes == totalNodes) {
		console.log(`[INFO] OK. Converted "${inPath}"`);
		return true;
	} else if (doneNodes != totalNodes) {
		console.warn(`[WARN] Not fully converted. Converted ${doneNodes} of ${totalNodes} nodes in "${inPath}"`);
	} else {
		console.error(`[ERROR] What happend? ${doneNodes} of ${totalNodes} nodes in "${inPath}"`);
	}
	return {doneNodes, totalNodes};
}
