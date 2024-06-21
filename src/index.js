import { spawn, exec } from 'child_process';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class TranslationModel {
    constructor() {
        this.PYTHON_SCRIPT = path.join(__dirname, 'translate.py');
        this.CONFIG_FILE = path.join(__dirname, "..", 'config.json');
        this.REQUIREMENTS_FILE = path.join(__dirname, "..", 'requirements.txt');
        this.MODELS_FILE = path.join(__dirname, 'models_with_languages.json');
    }

    async findPythonPath() {
        return new Promise((resolve, reject) => {
            const isWindows = os.platform() === 'win32';
            const command = isWindows ? 'where python' : 'which python3';

            exec(command, async (err, stdout, stderr) => {
                if (!err && stdout) {
                    const pythonPath = stdout.split('\n')[0].trim();
                    await this.installRequirements(pythonPath);
                    resolve(pythonPath);
                } else {
                    const fallbackCommand = isWindows ? 'where python' : 'which python';
                    exec(fallbackCommand, async (err2, stdout2, stderr2) => {
                        if (!err2 && stdout2) {
                            const pythonPath = stdout2.split('\n')[0].trim();
                            await this.installRequirements(pythonPath);
                            resolve(pythonPath);
                        } else {
                            reject(new Error('Python is not installed'));
                        }
                    });
                }
            });
        });
    }

    async installRequirements(pythonPath) {
        const command = `"${pythonPath}" -m pip install -r "${this.REQUIREMENTS_FILE}"`;
        console.log(`Installing requirements using command: ${command}`);
        try {
            await this.execCommand(command);
            console.log('Requirements installed successfully.');
        } catch (error) {
            console.error(`Failed to install requirements: ${error.message}`);
            throw error; // throw the error to be caught by the caller
        }
    }

    execCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (err, stdout, stderr) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(stdout);
                }
            });
        });
    }

    async getPythonPath() {
        try {
            const config = await fs.readFile(this.CONFIG_FILE, 'utf8');
            const parsedConfig = JSON.parse(config);
            if (parsedConfig?.pythonPath) {
                return parsedConfig.pythonPath;
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                // Handle case where config.json does not exist
                console.log('config.json not found. Creating a new one...');
                const pythonPath = await this.findPythonPath();
                await fs.writeFile(this.CONFIG_FILE, JSON.stringify({ pythonPath }, null, 2));
                return pythonPath;
            } else {
                throw error; // throw other errors to be caught by the caller
            }
        }

        // If config.json existed and had pythonPath, return it
        const pythonPath = await this.findPythonPath();
        return pythonPath;
    }

    async getModelForLanguages(sourceLanguage, targetLanguage) {
        const modelsData = await fs.readFile(this.MODELS_FILE, 'utf8');
        const models = JSON.parse(modelsData);
        const model = models.find(
            (model) => model.sourceLanguage === sourceLanguage && model.targetLanguage === targetLanguage
        );

        if (!model) {
            throw new Error(`No model found for translating from ${sourceLanguage} to ${targetLanguage}`);
        }

        return model.modelId;
    }

    async translateText(sourceLanguage, targetLanguage, textToTranslate) {
        try {
            const PYTHON_PATH = await this.getPythonPath();
            const modelId = await this.getModelForLanguages(sourceLanguage, targetLanguage);

            return new Promise((resolve, reject) => {
                const pythonProcess = spawn(PYTHON_PATH, [this.PYTHON_SCRIPT, '--model', modelId, '--text', textToTranslate]);

                let translatedText = '';

                pythonProcess.stdout.on('data', (data) => {
                    translatedText += data.toString();
                });

                pythonProcess.stderr.on('data', (data) => {
                    console.error(`Error (spawn): ${data.toString()}`);
                    reject(new Error(data.toString()));
                });

                pythonProcess.on('close', (code) => {
                    if (code !== 0) {
                        console.error(`Python process exited with code ${code}`);
                        reject(new Error(`Python process exited with code ${code}`));
                    } else {
                        resolve(translatedText.trim());
                    }
                });

                pythonProcess.on('error', (err) => {
                    console.error('Failed to spawn Python process:', err);
                    reject(err);
                });
            });

        } catch (error) {
            console.error(`Error: ${error.message}`);
            throw error;
        }
    }


    async getSupportedLanguages() {
        const modelsData = await fs.readFile(this.MODELS_FILE, 'utf8');
        const models = JSON.parse(modelsData);

        const supportedLanguages = models.map(model => ({
            sourceLanguage: {
                code: model.sourceLanguage,
                name: model.sourceLanguageName,
                englishName: model.sourceLanguageEnglishName,
                cities: model.sourceLanguageCities || []
            },
            targetLanguage: {
                code: model.targetLanguage,
                name: model.targetLanguageName,
                englishName: model.targetLanguageEnglishName,
                cities: model.targetLanguageCities || []
            },
            shortName: `${model.sourceLanguage} to ${model.targetLanguage}`
        }));

        return supportedLanguages;
    }

}

export default TranslationModel;