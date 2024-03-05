import * as fs from 'fs';
import { convert } from './convert.js';

const inPath = './test/config.xml';
const outPath = './test/config_result.xml';

// clear output
fs.writeFileSync(outPath, '', 'utf-8');

// convert post build steps
convert(inPath, outPath);
// double
convert(outPath, outPath);
