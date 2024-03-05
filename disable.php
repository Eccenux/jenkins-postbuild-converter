<?php
/**
 * Disable Jenkins jobs.
 */

// Define the array of directories
$directories = [];
$baseDir = '.';
require 'disable.config.priv.php';

/** Disable Jenkins job. */
function disableJob($directory) {
	$filePath = $directory . '/config.xml';
	
	// Read the content of the XML file
	$xmlContent = file_get_contents($filePath);
	
	// Check if the content was successfully retrieved
	if ($xmlContent === false) {
		echo "\n[ERROR] Failed reading the file in $directory";
		exit;
	}
	
	// Replace 'disabled>false' with 'disabled>true'
	$modifiedXmlContent = str_replace('disabled>false', 'disabled>true', $xmlContent);
	
	// Save the modified content back to the file
	$result = file_put_contents($filePath, $modifiedXmlContent);
	
	if ($result === false) {
		echo "\n[ERROR] Failed writing the file in $directory";
	} else {
		// File updated successfully
		return 1;
	}
	return 0;
}

// Loop through the array
echo "\nBase: $baseDir";
echo "\nJob count: " . count($directories);
$ok = 0;
foreach ($directories as $directory) {
    $ok += disableJob($baseDir .'/'. $directory);
}
echo "\nReplace count: " . $ok;
