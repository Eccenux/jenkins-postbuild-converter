import { JSDOM } from 'jsdom';

/*
	Missing children in JSDOM processing #2 

	Problem minification attempt.

	Below code seems to work fine though (both children are visible)... weird.
*/

let header = `<?xml version='1.0' encoding='UTF-8'?>\n`;
let xml = `
<root>
      <buildSteps>
        <hudson.plugins.groovy.SystemGroovy plugin="groovy@1.29">
          <scriptSource class="hudson.plugins.groovy.FileScriptSource">
            <scriptFile>/var/www/jenkins-groovy-helpers/JenkinsBuildHelper/UniwersalBuildChecker.groovy</scriptFile>
          </scriptSource>
          <bindings></bindings>
          <classpath></classpath>
        </hudson.plugins.groovy.SystemGroovy>
        <hudson.plugins.groovy.SystemGroovy plugin="groovy@1.29">
          <scriptSource class="hudson.plugins.groovy.StringScriptSource">
            <command>/**/
import hudson.model.*;

def scriptDir = &quot;/var/www/jenkins-groovy-helpers/JenkinsBuildHelper&quot;;
/**/</command>
          </scriptSource>
          <bindings></bindings>
          <classpath></classpath>
        </hudson.plugins.groovy.SystemGroovy>
      </buildSteps>
</root>
`;

const dom = new JSDOM(header + xml, { contentType: 'application/xml' });
const document = dom.window.document;
let srcSteps = document.querySelector('buildSteps');
for (let index = 0; index < srcSteps.children.length; index++) {
	const element = srcSteps.children[index];
	console.log(index, element.outerHTML);
}
