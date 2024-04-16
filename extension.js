const vscode = require('vscode');
const say = require('say');

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

    // Register the "Read Text Aloud" command and add it to the subscriptions
    let readAloudDisposable = vscode.commands.registerCommand('audio-debugger.readAloud', function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No editor is active');
            return;
        }
        const text = editor.document.getText(editor.selection);
        readTextAloud(text);
    });

    // Register the "AI Debugging" command and add it to the subscriptions
    let aiDebuggingDisposable = vscode.commands.registerCommand('audio-debugger.aiDebugging', function () {
        vscode.window.showInformationMessage('AI Debugging feature is not yet implemented.');
    });

    // Register the "AI Explanation" command and add it to the subscriptions
    let aiExplanationDisposable = vscode.commands.registerCommand('audio-debugger.aiExplanation', function () {
        vscode.window.showInformationMessage('AI Explanation feature is not yet implemented.');
    });

    context.subscriptions.push(readAloudDisposable, aiDebuggingDisposable, aiExplanationDisposable);
}

/**
 * Deactivates the extension.
 * 
 * This function is called when the extension is deactivated. Currently, it does not perform any actions.
 */
function deactivate() {}

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
