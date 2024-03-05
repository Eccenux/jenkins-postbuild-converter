/**
 * Convert config document.
 * @param {Document} document 
 */
export function convertPostBuildScript(document) {
	const oldNodes = document.getElementsByTagName('org.jenkinsci.plugins.postbuildscript.PostBuildScript');
	if (oldNodes.length) {
		for (let index = 0; index < oldNodes.length; index++) {
			const node = oldNodes[index];
			const newNode = convertConfig(document, node);
			node.parentNode.replaceChild(newNode, node);
		}
	}
}

// installed/destination versions (should probably work fine when actual version is higher)
let postbuildVersion = 'postbuildscript@3.2.0-550.v88192b_d3e922';
let groovyVersion = 'groovy@457.v99900cb_85593';


/** Simple bool check helper. */
function valueIsFalse(parentNode, selector) {
	const element = parentNode.querySelector(selector);
	return element && element.textContent === 'false';
}

/**
 * Create new build config.
 * @param {Document} document Parent document.
 * @param {Element} srcNode Source node.
 * @returns {Element} converted node.
 */
function convertConfig(document, srcNode) {

	// TODO: should depend on scriptOnlyIfSuccess/scriptOnlyIfFailure
	let results = `
					<results>
						<string>SUCCESS</string>
						<string>FAILURE</string>
						<string>UNSTABLE</string>
					</results>
	`.trim();
	// check values for now
	if (!valueIsFalse(srcNode, 'scriptOnlyIfSuccess')) {
		console.warn('scriptOnlyIfSuccess is not false');
	}
	if (!valueIsFalse(srcNode, 'scriptOnlyIfFailure')) {
		console.warn('scriptOnlyIfFailure is not false');
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
		convertStep(element, dstSteps);
	}
	dstSteps.appendChild(document.createTextNode('\n' + parentIndent));

	return newNode;
}

/**
 * Convert build node.
 * @param {Element} step
 * @param {Element} dstParent 
 */
function convertStep(step, dstParent) {
	// TODO: convert SystemGroovy
	dstParent.appendChild(step);
}

/*`
        <hudson.plugins.groovy.SystemGroovy plugin="groovy@1.29">
          <scriptSource class="hudson.plugins.groovy.FileScriptSource">
            <scriptFile>/var/www/jenkins-groovy-helpers/JenkinsBuildHelper/UniwersalBuildChecker.groovy</scriptFile>
          </scriptSource>
          <bindings></bindings>
          <classpath></classpath>
        </hudson.plugins.groovy.SystemGroovy>

							<hudson.plugins.groovy.SystemGroovy plugin="${groovyVersion}">
								<source class="hudson.plugins.groovy.FileSystemScriptSource">
									<scriptFile>/var/www/jenkins-groovy-helpers/JenkinsBuildHelper/UniwersalBuildChecker.groovy</scriptFile>
								</source>
							</hudson.plugins.groovy.SystemGroovy>
`*/