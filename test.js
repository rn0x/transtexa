import TranslationModel from './src/index.js';

const translator = new TranslationModel();

const sourceLanguage = 'ar'; // اللغة المصدر
const targetLanguage = 'en'; // اللغة الهدف
const textToTranslate = 'مرحبا، كيف حالك؟';

const translateText = await translator.translateText(sourceLanguage, targetLanguage, textToTranslate);

console.log("translateText: ", translateText);