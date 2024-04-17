const vscode = require('vscode');
const say = require('say');
const axios = require('axios');

/**
 * Activates the extension.
 * 
 * This function is called when the extension is activated.
 * It registers commands and adds them to the context's subscriptions.
 * 
 * @param {vscode.ExtensionContext} context - The context in which the extension is executed. 
 * This context is provided by Visual Studio Code and contains APIs that the extension can use to interact with the editor.
 */
function activate(context) {
    console.log('Audio Debugger is now active!');

    let readAloudDisposable = vscode.commands.registerCommand('audio-debugger.readAloud', function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No editor is active');
            return;
        }
        const text = editor.document.getText(editor.selection);
        readTextAloud(text);
    });

    let aiDebuggingDisposable = vscode.commands.registerCommand('audio-debugger.aiDebugging', async function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No editor is active');
            return;
        }
        const userQuery = await vscode.window.showInputBox({
            prompt: "What issue would you like help debugging?",
            placeHolder: "Describe the issue with your code"
        });
        if (!userQuery) {
            vscode.window.showInformationMessage('No debugging query provided.');
            return;
        }
        const code = editor.document.getText(editor.selection);
        const debuggingResponse = await getOpenAIDebugging(code, userQuery, context.secrets);
        await presentResponseOptions(debuggingResponse);
    });
    
    let aiExplanationDisposable = vscode.commands.registerCommand('audio-debugger.aiExplanation', async function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No editor is active');
            return;
        }
        const code = editor.document.getText(editor.selection);
        if (!code.trim()) {
            vscode.window.showInformationMessage('No code selected.');
            return;
        }
        const explanation = await getOpenAIExplanation(code, context.secrets);
        await presentResponseOptions(explanation);
    });

    context.subscriptions.push(readAloudDisposable, aiDebuggingDisposable, aiExplanationDisposable);
}

/**
 * Deactivates the extension.
 * 
 * This function is called when the extension is deactivated. Currently, it does not perform any actions.
 */
function deactivate() {}

async function presentResponseOptions(response) {
    const pick = await vscode.window.showQuickPick(['Show Text', 'Read Aloud', 'Both'], {
        placeHolder: 'Choose how you would like the response presented'
    });

    if (pick === 'Show Text') {
        vscode.window.showInformationMessage(response);
    } else if (pick === 'Read Aloud') {
        say.speak(response);
    } else if (pick === 'Both') {
        vscode.window.showInformationMessage(response);
        say.speak(response);
    }
}

async function getOpenAIDebugging(code, query, secrets) {
    const apiKey = await secrets.get('openAIKey');
    if (!apiKey) {
        console.error('OpenAI API key is not set.');
        await storeApiKey(secrets);
        return 'Please enter your OpenAI API key.';
    }

    const data = {
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "system",
                content: "You are a helpful assistant capable of providing debugging assistance and code fixes."
            },
            {
                role: "user",
                content: query + "\nHere is the code:\n" + code
            }
        ]
    };

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', data, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        // Extract the response which should ideally include both the solution and an explanation
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("Error calling OpenAI for debugging:", error);
        return 'Failed to get debugging help from OpenAI.';
    }
}


/**
 * Retrieves and returns the OpenAI API explanation for the provided code.
 * If the API key is not set, it prompts the user to enter it.
 * 
 * @param {string} code - The code snippet to explain.
 * @param {vscode.SecretStorage} secrets - Secret storage to retrieve the API key.
 * @returns {Promise<string>} The explanation from OpenAI.
 */
async function getOpenAIExplanation(code, secrets) {
    
    const apiKey = await secrets.get('openAIKey');
    if (!apiKey) {
        console.error('OpenAI API key is not set.');
        await storeApiKey(secrets); // Prompt to store API Key if not found
        return 'Please enter your OpenAI API key.';
    }

    // Setup the API request payload using the new Chat API format
    const data = {
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "system",
                content: "You are a helpful assistant."
            },
            {
                role: "user",
                content: `Explain what is happening in this code:\n${code}`
            }
        ]
    };

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', data, {
            headers: {
                'Authorization': `Bearer  ${apiKey}`,
            }
        });
        // Assuming the response contains a single completion message
        return response.data.choices[0].message.content;
    } catch (error) {
    if (error.response) {
        // The request was made and the server responded with a status code that falls out of the range of 2xx
        console.error("Error data:", error.response.data);
        console.error("Error status:", error.response.status);
        console.error("Error headers:", error.response.headers);
    } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
    } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error", error.message);
    }
        console.error("Config:", error.config);
        return 'Failed to get explanation from OpenAI.';
    }
}

/**
 * Prompts the user to enter their OpenAI API key and stores it securely using VSCode's secrets API.
 */
async function storeApiKey(secrets) {
    const apiKey = await vscode.window.showInputBox({
        prompt: "Enter your OpenAI API Key",
        ignoreFocusOut: true
    });
    if (apiKey) {
        await secrets.store('openAIKey', apiKey);
    }
}

/**
 * Speaks the provided text using the system's text-to-speech capabilities.
 * 
 * @param {string} text - The text to be spoken.
 */
function readTextAloud(text) {
    say.speak(text, null, 1.0, (err) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log('Text has been spoken.');
    });
}

module.exports = {
    activate,
    deactivate
}
