// import { JSDOM } from 'jsdom';

/**
 * Convert config string to a string.
 * 
 * @param {Array} warnings Array for warnings.
 * @param {String} xml Config XML string.
 * @returns {output, doneNodes, totalNodes}
 */
export function convertXml(xml, warnings = []) {
	let totalNodes = 0;
	let doneNodes = 0;
	let output = xml.replace(/<org.jenkinsci.plugins.postbuildscript.PostBuildScript([^>]+)>[\s\S]+?<\/org.jenkinsci.plugins.postbuildscript.PostBuildScript>/g, (tag, attr) => {
		totalNodes++;

		// Parse the XML
		const newXml = convertPart(tag, attr, warnings);
		if (newXml) {
			doneNodes++;
			return newXml;
		}

		return tag;
	});
	return {output, doneNodes, totalNodes};
}

// installed/destination versions (should probably work fine when actual version is higher)
let postbuildVersion = 'postbuildscript@3.2.0-550.v88192b_d3e922';
// let groovyVersion = 'groovy@457.v99900cb_85593';


/**
 * Simple tag value check.
 * 
 * Note! The tag is assumed to be a simple tag with either no other tags inside or not self-contained.
 * Bad (won't work): <div><div></div></div>
 * OK (should work): <a href="#">abc</a>
 * 
 * This function will not work for getting attrs on self closed tags.
 * 
 * @param {String} xml
 * @param {String} tagName Simple tag (with short-ish value).
 * @returns {Array} Array of {attr, content} (empty array if no tag was found).
 */
function getTagValue(xml, tagName) {
	const values = [];
	xml.replace(new RegExp(`<${tagName}(\\s[^>]+)?>([\\s\\S]*?)<\\/${tagName}>`, 'g'), (tag, attr, content) => {
		values.push({tag, attr, content});
	});
	return values;
}

/** Warn shorthand. */
function warningInfo(warnings, message) {
	warnings.push(message);
	console.warn(message);
}

/** Simple parser (doesn't work for non-xml attrs - without value). */
function attrParse(attrString) {
	let attrs = {};
	if (typeof attrString == 'string' && attrString.length >= 2) {
		attrString.replace(/([\w.]+)\s*=\s*['"]([^'"]+)['"]/g, (a, name, value) => {
			attrs[name] = value;
		});
	}
	return attrs;
}

/**
 * Create new build config.
 * @param {String} postBuildXml The postbuildscript tag (outer xml).
 * @param {String} attrString Attribute(s).
 * @param {Array} warnings Array for warnings.
 * @returns {String} converted tag.
 */
function convertPart(postBuildXml, attrString, warnings = []) {
	// Initial check
	let attrs = attrParse(attrString);
	let srcVersion = attrs.plugin;
	if (!srcVersion.startsWith('postbuildscript@0.')) {
		warningInfo(warnings, `[WARN] Unsupported version ${srcVersion}`);
		return false;
	}
	// Tested with postbuildscript@0.17, but I'm guessing any `0.` should be fine...
	console.log(`[INFO] Converting version: ${srcVersion}`);

	// TODO: (?) should depend on scriptOnlyIfSuccess/scriptOnlyIfFailure
	let results = `
					<results>
						<string>SUCCESS</string>
						<string>FAILURE</string>
						<string>UNSTABLE</string>
					</results>
	`.trim();
	// check values for now
	let values;
	values = getTagValue(postBuildXml, 'scriptOnlyIfSuccess');
	if (values.length != 1 || values[0].content !== "false") {
		warningInfo(warnings, '[WARN] scriptOnlyIfSuccess is not false: ' + JSON.stringify(values.map(v=>v.content)));
	}
	values = getTagValue(postBuildXml, 'scriptOnlyIfFailure');
	if (values.length != 1 || values[0].content !== "false") {
		warningInfo(warnings, '[WARN] scriptOnlyIfFailure is not false: ' + JSON.stringify(values.map(v=>v.content)));
	}

	// Create and add the new structure
	let newStructureTpl = (buildSteps) => `
		<org.jenkinsci.plugins.postbuildscript.PostBuildScript plugin="${postbuildVersion}">
			<config>
				<scriptFiles/>
				<groovyScripts/>
				<buildSteps>
					<org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
						${results}
						<role>BOTH</role>
						${buildSteps}
						<stopOnFailure>false</stopOnFailure>
					</org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
				</buildSteps>
				<markBuildUnstable>false</markBuildUnstable>
			</config>
		</org.jenkinsci.plugins.postbuildscript.PostBuildScript>
	`;

	// Convert/copy steps
	let srcSteps = getTagValue(postBuildXml, 'buildSteps');
	if (srcSteps.length == 0) {
		warningInfo(warnings, `[WARN] Build steps are empty/missing, this is weird...`)
	}
	else if (srcSteps.length > 1) {
		warningInfo(warnings, `[WARN] There are many step tags (${srcSteps.length}), this is weird...`)
	}
	let dstSteps = '';
	for (let step of srcSteps) {
		// convertStep(step, dstSteps, warnings);
		dstSteps += step.tag;
	}

	return newStructureTpl(dstSteps);
}

/**
 * Convert build node.
 * @param {Array} warnings
 * @param {Element} step
 * @param {Element} dstParent 
 *
function convertStep(step, dstParent, warnings = []) {
	const plugin = step.getAttribute('plugin');
	// convert SystemGroovy script
	if (plugin.startsWith('groovy@1.')) {
		convertGroovy(step, warnings);
	} else {
		warnings.push(`Unknown plugin ${plugin}`);
	}
	dstParent.appendChild(step);
}

/**
 * Convert SystemGroovy node.
 * 
 * Note. At this point it only works with SystemGroovy scripts from a file.
 * 
 * @param {Array} warnings
 * @param {Element} step
 *
function convertGroovy(step, warnings = []) {
	const document = step.ownerDocument;
	const oldSource = step.querySelector('scriptSource');
	const file = oldSource?.querySelector('scriptFile');
	const groovyClass = oldSource?.getAttribute('class');
	if (oldSource && file && groovyClass === 'hudson.plugins.groovy.FileScriptSource') {
		step.setAttribute('plugin', groovyVersion);
		step.removeChild(step.querySelector('bindings'));
		step.removeChild(step.querySelector('classpath'));
		let source = document.createElement('source');
		// source.setAttribute('class', oldSource.getAttribute('class'));
		source.setAttribute('class', 'hudson.plugins.groovy.FileSystemScriptSource');
		source.appendChild(document.createTextNode('\n\t\t\t\t\t\t'));
		source.appendChild(file);
		source.appendChild(document.createTextNode('\n\t\t\t\t\t'));
		oldSource.parentElement.replaceChild(source, oldSource);
	} else {
		warnings.push(`Unknown/risky groovy type; class:${groovyClass}.`);
	}
}
/**/