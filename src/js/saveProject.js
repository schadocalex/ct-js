(function(window) {
	/* global nw */
	const fs = require("fs-extra"),
		path = require("path");

	/**
	 * Checks file format and loads it
	 *
	 * @param {String} proj The path to the file.
	 * @returns {void}
	 */
	const saveProjectArray = async (subDir, array, fileNameKey, jsFilesProperties) => {
		// List files or dirs
		await fs.ensureDir(subDir);
		const files = await fs.readdir(subDir);

		// Create a files to remove set. A the end, all the remaining files in the set will be removed.
		const filesToRemove = new Set(files);

		// Create a map of existing uid -> name
		const mapUid = {};
		for(const file of files) {
			try {
				const content = await fs.readJson(subDir + "/" + file + (jsFilesProperties ? "/meta.json" : ""));
				if(content && content[fileNameKey]) {
					mapUid[content[fileNameKey]] = content.name;
				}
			} catch(e) { }
		}

		if(jsFilesProperties) {
			for(const item of array) {
				const metaObject = Object.assign({}, item);

				const newName = item.name;
				const oldName = mapUid[item[fileNameKey]];

				// Removes found dirs from remove set
				// Move the dir if not the new name
				// Else ensure a dir exists with the new name
				if(oldName) {
					filesToRemove.delete(oldName)
					if(oldName !== newName) {
						await fs.move(subDir + "/" + oldName, subDir + "/" + newName);
					} else {
            			await fs.ensureDir(subDir + "/" + newName);
					}
				}

				// Clean dir from unused files
				for(const subFile of (await fs.readdir(subDir + "/" + newName))) {
					if(subFile !== "meta.json" && jsFilesProperties.indexOf(subFile.replace(".js", "")) < 0) {
						await fs.remove(subDir + "/" + newName + "/" + subFile);
					}
				}

				// Write sub files
				for(const jsFileProperty of jsFilesProperties) {
					delete metaObject[jsFileProperty];
					await fs.writeFile(subDir + "/" + newName + "/" + jsFileProperty + ".js", item[jsFileProperty]);
				}

				// Write metadata file
				await fs.outputJSON(subDir + "/" + newName + "/meta.json", metaObject, {
					spaces: 2
				})
			}
		} else {
			for(const item of array) {
				const newName = item.name;
				const oldName = mapUid[item[fileNameKey]];

				// Removes found files from remove set
				// Move the file if not the new name
				if(oldName) {
					filesToRemove.delete(oldName + ".json")
					if(oldName !== newName) {
						await fs.move(subDir + "/" + oldName + ".json", subDir + "/" + newName + ".json");
					}
				}

				// Write file
				await fs.outputJSON(subDir + "/" + newName + ".json", item, {
					spaces: 2
				})
			}
		}

		// Remove old unused files
		for(const fileToRemove of filesToRemove) {
			await fs.remove(subDir + "/" + fileToRemove);
		}
	};

	window.saveProject = async (projDir, currentProject) => {
		if(currentProject.settings.fileBasedStructure) {
			const srcDir = projDir + "/src";
			await fs.ensureDir(srcDir);

			// Store non array values
			const generalSettings = {};

			for(const [key, value] of Object.entries(currentProject)) {
				const subDir = srcDir + "/" + key;
				switch(key) {
					case 'types':
						await saveProjectArray(subDir, value, 'uid', ['onstep', 'ondraw', 'oncreate', 'ondestroy'])
						break;
					case 'rooms':
						await saveProjectArray(subDir, value, 'uid', ['onstep', 'ondraw', 'onleave', 'oncreate'])
						break;
					case 'scripts':
						await saveProjectArray(subDir, value, 'name', ['code'])
						break;
					case 'actions':
						await saveProjectArray(subDir, value, 'name')
						break;
					case 'textures':
					case 'sound':
					case 'styles':
						await saveProjectArray(subDir, value, 'uid')
						break;
					default:
						generalSettings[key] = value;
				}
			}

			// Save non array values
			await fs.outputJSON(srcDir + "/settings.json", currentProject, {
				spaces: 2
			});

			return fs.outputJSON(projDir + ".ict", currentProject, {
				spaces: 2
			});
		} else {
			return fs.outputJSON(projDir + ".ict", currentProject, {
				spaces: 2
			});
		}
	};
})(this);
