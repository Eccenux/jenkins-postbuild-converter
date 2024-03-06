# Jenkins PostBuildScript Converter

Converts [PostBuildScript](https://plugins.jenkins.io/postbuildscript/) data from version 0.x (from the time of Jenkins 1.x).

Scripts:
  - `main.js` -- Main conversion. Works on `io/list.txt` which contains a list of job names (directory names). You can create the list manually or with grep: `grep "postbuildscript@0." **/config.xml > ../list.txt`.
  - `convert_test.js` -- A test script. Works on test files in the test directory. Check these files to see what to expect from the converter.
  - `disable.php` -- An additional script (PHP) to mass-disable jobs.

Note! I only used the PostBuildScript plugin for extra build steps and used very similar options in each job. You might need to adjust `newStructureTpl` in `PostBuildHelper.js` to fit your needs.
