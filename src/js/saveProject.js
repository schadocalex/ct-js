(function(window) {
	/* global nw */
	const fs = require("fs-extra"),
        path = require("path");
        
    const resources = {
        types: ['onstep', 'ondraw', 'oncreate', 'ondestroy'],
        rooms: ['onstep', 'ondraw', 'onleave', 'oncreate'],
        scripts: ['code'],
        actions: [],
        textures: [],
        sounds: [],
        styles: [],
    };

	/**
	 * Checks file format and loads it
	 *
	 * @param {String} proj The path to the file.
	 * @returns {void}
	 */
	const saveProjectArray = async (subDir, array, jsFilesProperties) => {
		// List files or dirs
		await fs.ensureDir(subDir);
		const files = await fs.readdir(subDir);

		// Create a files to remove set. At the end, all the remaining files in the set will be removed.
		const filesToRemove = new Set(files);

		if(jsFilesProperties.length > 0) {
			for(const item of array) {
				const metaObject = Object.assign({}, item);

                const metaFile = item.name + '.json';
                const metaFilePath = path.join(subDir, metaFile);
                const dirName = item.name;
                const dirPath = path.join(subDir, dirName);
                await fs.ensureDir(dirPath);
                
                filesToRemove.delete(metaFile);
                filesToRemove.delete(dirName);

				// Clean dir from unexpected files
				for(const subFile of (await fs.readdir(dirPath))) {
					if(jsFilesProperties.indexOf(subFile.replace(".js", "")) < 0) {
						await fs.remove(dirPath + "/" + subFile);
					}
				}

				// Write sub files
				for(const jsFileProperty of jsFilesProperties) {
					await fs.writeFile(path.join(dirPath, jsFileProperty + '.js'), item[jsFileProperty]);
					delete metaObject[jsFileProperty];
				}

				// Write metadata file
				await fs.outputJSON(metaFilePath, metaObject, {
					spaces: 2
				});
			}
		} else {
			for(const item of array) {
                const filePath = path.join(subDir, item.name + '.json');
                filesToRemove.delete(filePath);

                // Write file
				await fs.outputJSON(filePath, item, {
					spaces: 2
                });
			}
		}

		// Remove old unused files
		for(const fileToRemove of filesToRemove) {
			await fs.remove(subDir + "/" + fileToRemove);
		}
	};

	window.saveProject = async (projDir, currentProject) => {
		if(currentProject.settings.fileBasedStructure) {
			// Store non array values
			const generalSettings = {};

			for(const [key, value] of Object.entries(currentProject)) {
                const subDir = path.join(projDir, key);
                if(resources[key]) {
                    await saveProjectArray(subDir, value, resources[key]);
                } else {
                    generalSettings[key] = value;
                }
			}

			return fs.outputJSON(projDir + '.ict', generalSettings, {
				spaces: 2
            });
		} else {
			return fs.outputJSON(projDir + '.ict', currentProject, {
				spaces: 2
			});
		}
	};
})(this);