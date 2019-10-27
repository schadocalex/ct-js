(function(window) {
	/* global nw */
	const fs = require("fs-extra"),
        path = require("path");
        
    window.CT_RESOURCES = {
        types: ['onstep.js', 'ondraw.js', 'oncreate.js', 'ondestroy.js'],
        rooms: ['onstep.js', 'ondraw.js', 'onleave.js', 'oncreate.js', 'backgrounds.json', 'copies.json', 'tiles.json'],
        scripts: ['code.js'],
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
					if(jsFilesProperties.indexOf(subFile) < 0) {
						await fs.remove(dirPath + "/" + subFile);
					}
				}

				// Write sub files
				for(const jsFilePath of jsFilesProperties) {
                    const [jsFileProperty, ext] = jsFilePath.split('.');
                    if(ext === 'js') {
                        await fs.writeFile(path.join(dirPath, jsFilePath), item[jsFileProperty]);
                    } else if(ext === 'json') {
                        await fs.outputJSON(path.join(dirPath, jsFilePath), item[jsFileProperty], {
                            spaces: 2
                        });
                    }
					delete metaObject[jsFileProperty];
				}

				// Write metadata file
				await fs.outputJSON(metaFilePath, metaObject, {
					spaces: 2
				});
			}
		} else {
			for(const item of array) {
                const fileName = item.name + '.json';
                const filePath = path.join(subDir, fileName);
                filesToRemove.delete(fileName);

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
                if(window.CT_RESOURCES[key]) {
                    await saveProjectArray(subDir, value, window.CT_RESOURCES[key]);
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