## transtexa

### `translate.py`

Handles text translation using pretrained models from Hugging Face's Transformers library

- Loads or downloads models based on provided IDs.
- Translates input text using loaded models and tokenizers.
- Supports command-line arguments for model ID, input text, and storage directory.


### `index.js`

Manages communication with `translate.py` from Node.js:

- Locates Python executable dynamically.
- Installs Python dependencies from `requirements.txt`.
- Uses `config.json` for configuration and `models_with_languages.json` for model selection.
- Spawns Python subprocesses for translation tasks.

### `models_with_languages.json`

Metadata about available translation models:

- Lists model IDs, source and target languages.

### Helsinki-NLP

Refers to NLP research at the University of Helsinki, known for AI leadership. It focuses on advancements in language processing.


<div align="center">

<img align="center" src = "https://komarev.com/ghpvc/?username=rn0x-transtexa&label=REPOSITORY+VIEWS&style=for-the-badge" alt ="transtexa"> <br><br>

</div>

### Usage

1. **Setup**:
   - Ensure Python 3.x and Node.js are installed.
   - Run `npm install transtexa`

2. **Translation**:
   - Use `TranslationModel` methods (`translateText`, `getSupportedLanguages`) in Node.js.

3. **Customization**:
   - Modify `models_with_languages.json` to adjust models and languages.
   - Configure `config.json` for Python paths.

### Example

```javascript
import TranslationModel from './index.js';

const translator = new TranslationModel();

translator.translateText('zh', 'en', '你好吗？').then(translated => {
    console.log(translated); // Outputs: "How are you?"
}).catch(err => {
    console.error('Translation error:', err);
});
```

#### Node.js Integration with Telegram Bot

```javascript
import Telegraf from 'telegraf';
import TranslationModel from './index.js';

const bot = new Telegraf('YOUR_TELEGRAM_BOT_TOKEN');
const translator = new TranslationModel();

bot.on('text', async (ctx) => {
    const sourceLanguage = 'en'; // Assuming English as input language
    const targetLanguage = 'fr'; // Assuming French as output language
    const textToTranslate = ctx.message.text;

    try {
        const translatedText = await translator.translateText(sourceLanguage, targetLanguage, textToTranslate);
        ctx.reply(translatedText);
    } catch (error) {
        console.error('Translation error:', error);
        ctx.reply('Translation failed. Please try again later.');
    }
});

bot.launch();
```

#### Node.js Integration with Express.js Server

```javascript
import express from 'express';
import TranslationModel from './index.js';

const app = express();
const port = 3000;
const translator = new TranslationModel();

app.use(express.json());

app.post('/translate', async (req, res) => {
    const { sourceLanguage, targetLanguage, text } = req.body;

    try {
        const translatedText = await translator.translateText(sourceLanguage, targetLanguage, text);
        res.json({ translatedText });
    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({ error: 'Translation failed. Please try again later.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
```