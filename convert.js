import fs from 'fs';
import { JSDOM } from 'jsdom';
import { convertPostBuildScript } from './PostBuildHelper.js';

const in_path = './test/config.xml';
const out_path = './test/config_result.xml';

// Load your XML file
const xmlData = fs.readFileSync(in_path, 'utf-8');

// Parse the XML
const dom = new JSDOM(xmlData, { contentType: 'application/xml' });
const document = dom.window.document;

// Convert
convertPostBuildScript(document);

// Write the modified XML back to a file
fs.writeFileSync(out_path, dom.serialize(), 'utf-8');

console.log(`XML modified and saved as "${out_path}"`);
