import { JSDOM } from 'jsdom';

/**
 * Convert config string to a string.
 * 
 * @param {Array} warnings Array for warnings.
 * @param {String} xml Config XML string.
 * @returns {output, doneNodes, totalNodes}
 */
export function convertXml(xml, warnings = []) {
	let header = `<?xml version='1.0' encoding='UTF-8'?>\n`;
	let totalNodes = 0;
	let doneNodes = 0;
	let output = xml.replace(/<org.jenkinsci.plugins.postbuildscript.PostBuildScript[^>]+>[\s\S]+?<\/org.jenkinsci.plugins.postbuildscript.PostBuildScript>/g, (tag) => {
		totalNodes++;

		// Parse the XML
		const dom = new JSDOM(header + tag, { contentType: 'application/xml' });
		const document = dom.window.document;
		const oldNodes = document.getElementsByTagName('org.jenkinsci.plugins.postbuildscript.PostBuildScript');
		const node = oldNodes[0];
		const newNode = convertConfig(document, node, warnings);
		if (newNode) {
			doneNodes++;
			return newNode.outerHTML;
			// node.parentNode.replaceChild(newNode, node);
			// return dom.serialize();
		}

		return tag;
	});
	return {output, doneNodes, totalNodes};
}

/**
 * Convert config document.
 * 
 * Note! This is NOT SAFE. Serialization might change other nodes and e.g. break shell scripts.
 * 
 * @param {Array} warnings Array for warnings.
 * @param {Document} document 
 */
export function convertDocument(document, warnings = []) {
	const oldNodes = document.getElementsByTagName('org.jenkinsci.plugins.postbuildscript.PostBuildScript');
	const totalNodes = oldNodes?.length;
	let doneNodes = 0;
	if (oldNodes && oldNodes.length) {
		for (let index = 0; index < oldNodes.length; index++) {
			const node = oldNodes[index];
			const newNode = convertConfig(document, node, warnings);
			if (newNode) {
				node.parentNode.replaceChild(newNode, node);
				doneNodes++;
			}
		}
	}
	return {doneNodes, totalNodes};
}

// installed/destination versions (should probably work fine when actual version is higher)
let postbuildVersion = 'postbuildscript@3.2.0-550.v88192b_d3e922';
let groovyVersion = 'groovy@457.v99900cb_85593';


/** Simple bool check helper. */
function valueIsFalse(parentNode, selector) {
	const element = parentNode.querySelector(selector);
	return element && element.textContent === 'false';
}

function warningInfo(warnings, message) {
	warnings.push(message);
	console.warn(message);
}

/**
 * Create new build config.
 * @param {Array} warnings Array for warnings.
 * @param {Document} document Parent document.
 * @param {Element} srcNode Source node.
 * @returns {Element} converted node.
 */
function convertConfig(document, srcNode, warnings = []) {
	// Initial check
	let srcVersion = srcNode.getAttribute('plugin');
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
	if (!valueIsFalse(srcNode, 'scriptOnlyIfSuccess')) {
		warningInfo(warnings, '[WARN] scriptOnlyIfSuccess is not false');
	}
	if (!valueIsFalse(srcNode, 'scriptOnlyIfFailure')) {
		warningInfo(warnings, '[WARN] scriptOnlyIfFailure is not false');
	}

	// Create and add the new structure
	let newStructureXML = `
		<org.jenkinsci.plugins.postbuildscript.PostBuildScript plugin="${postbuildVersion}">
			<config>
				<scriptFiles/>
				<groovyScripts/>
				<buildSteps>
					<org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
						${results}
						<role>BOTH</role>
						<buildSteps></buildSteps>
						<stopOnFailure>false</stopOnFailure>
					</org.jenkinsci.plugins.postbuildscript.model.PostBuildStep>
				</buildSteps>
				<markBuildUnstable>false</markBuildUnstable>
			</config>
		</org.jenkinsci.plugins.postbuildscript.PostBuildScript>
	`;
	const template = document.createElement('template');
	template.innerHTML = newStructureXML.trim();
	const newNode = template.firstChild;

	// Convert/copy steps
	let srcSteps = srcNode.querySelector('buildSteps');
	let dstSteps = newNode.querySelector('buildSteps buildSteps');
	let parentIndent = '						';
	for (let index = 0; index < srcSteps.children.length; index++) {
		const element = srcSteps.children[index];
		dstSteps.appendChild(document.createTextNode('\n\t' + parentIndent));
		convertStep(element, dstSteps, warnings);
	}
	dstSteps.appendChild(document.createTextNode('\n' + parentIndent));

	return newNode;
}

/**
 * Convert build node.
 * @param {Array} warnings
 * @param {Element} step
 * @param {Element} dstParent 
 */
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
 */
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
