const readline = require('readline');
const http = require('http');
const url = require("url");
const fs = require('fs');

const FILE_PATH_REGEX = RegExp('^\.\/([A-z0-9-_+]+\/)*([A-z0-9]+\.(txt))');
const { connectToDb, saveToDb } = require('./dbConnectionMongo');


const getSourceType = (source) => {
    if (url.parse(source).hostname != null) {
        return 'url';
    } else
    if (FILE_PATH_REGEX.test(source)) {
        return 'file';
    }

    return 'string';
}

const splitByWords = (text) => {
    // clean text from non-alpha numeric characters
    const alphaNumericText = text.replace(/[^0-9a-z ]/gi, '');
    // split string by spaces (including spaces, tabs, and newlines)
    const wordsArray = alphaNumericText.toLowerCase().split(/\s+/);
    return wordsArray;
}

// create map for word counts

const createWordMap = (wordsArray) => {
    // wordsMap = { 'hi': 2, 'my': 3, ...}
    let wordsMap = {};
    wordsArray.forEach(function (key) {
        if (wordsMap.hasOwnProperty(key)) {
            wordsMap[key]++;
        } else {
            wordsMap[key] = 1;
        }
    });

    return wordsMap;
}

const analyzeString = async (input) => {
    let wordsArray = splitByWords(input);
    let wordsMap = createWordMap(wordsArray);

    try {
        await saveToDb(wordsMap);
        process.exit(0);
    } catch (err) {
        console.log("Error found within analyzeString: " + err);
        process.exit(1);
    }
}

const readFromFile = (filePath) => {
    let myInterface = readline.createInterface({
        input: fs.createReadStream(filePath)
    });

    myInterface.on('line', function (line) {
        console.log(line);
        analyzeString(line);
    });
}

const readFromUrl = (inputUrl) => {
    const fileName = url.parse(inputUrl).hostname + ".txt";
    const file = fs.createWriteStream(fileName);

    http.get(inputUrl, function (response) {
        response.pipe(file);
    });
    file.on('finish', function () {

        const filePath = "./" + fileName;
        console.log("File Path is: ", filePath);
        readFromFile(filePath);
    });
}

const getText = (sourceType, userInput) => {
    switch (sourceType) {
        case 'url':
            readFromUrl(userInput);
            break;

        case 'file':
            readFromFile(userInput);
            break;

        default: //handle string input
            analyzeString(userInput);
    }
}


console.log("Word counter is up and running");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

connectToDb((err) => {
    if (err){
        console.log(err);
        process.exit(1);
    }
    console.log('connected to Db correctly');
    rl.question('Please enter your String source: \n' +
        '(1) a url should start with \'http://\' \n' +
        '(2) a text file path should start with \'./\' and end with \'.txt\' \n' +
        '(3) or just a plain string \n', (source) => {

        console.log(`Thank you for your input: ${source}`);
        rl.close();
    const sourceType = getSourceType(source);
    console.log("Type of source is: ", sourceType);
    getText(sourceType, source);
    });
});