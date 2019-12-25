const readline = require("readline");
const url = require("url");

const FILE_PATH_REGEX = RegExp("^./([A-z0-9-_+]+/)*([A-z0-9]+.(txt))");
const {connectToDb} = require("./dbConnectionMongo");
const {analyzeString, readFromFile, readFromUrl} = require("./readers");

const getSourceType = source => {
    if (url.parse(source).hostname != null) {
        return "url";
    } else if (FILE_PATH_REGEX.test(source)) {
        return "file";
    }
    return "string";
};

async function wait(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

const getText = (sourceType, userInput) => {
    switch (sourceType) {
        case "url":
            readFromUrl(userInput);
            break;

        case "file":
            readFromFile(userInput);
            break;

        default:
            //handle string input
            analyzeString(userInput);
    }
};

console.log("Word counter is up and running");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

connectToDb(err => {
    if (err) {
        console.log(err);
        process.exit(1);
    }
    console.log("connected to Db correctly");
    rl.question(
        "Please enter your String source: \n" +
        "(1) a url should start with 'http://' \n" +
        "(2) a text file path should start with './' and end with '.txt' \n" +
        "(3) or just a plain string \n",
        source => {
            console.log(`Thank you for your input: ${source}`);
            rl.close();
            const sourceType = getSourceType(source);
            console.log("Type of source is: ", sourceType);
            getText(sourceType, source);
        }
    );
});
