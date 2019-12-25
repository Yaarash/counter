const fs = require("fs");
const stream = require("stream");
const http = require("http");

const {saveToDb} = require("./dbConnectionMongo");

const splitByWords = text => {
    // clean text from non-alpha numeric characters
    const alphaNumericText = text.replace(/[^0-9a-zA-Z ]/gi, " ");
    // split string by spaces (including spaces, tabs, and newlines)
    const wordsArray = alphaNumericText.toLowerCase().split(/\s+/);
    return wordsArray;
};

// create map for word counts
const createWordMap = wordsArray => {
    // wordsMap = { 'hi': 2, 'my': 3, ...}
    let wordsMap = {};
    wordsArray.forEach(function (key) {
        //don't add empty strings (like empty lines etc.)
        if (key === '') return;
        if (wordsMap.hasOwnProperty(key.trim())) {
            wordsMap[key.trim()]++;
        } else {
            wordsMap[key.trim()] = 1;
        }
    });
    return wordsMap;
};

const analyzeString = async input => {
    let wordsArray = splitByWords(input);
    let wordsMap = createWordMap(wordsArray);

    try {
        await saveToDb(wordsMap);
    } catch (err) {
        console.log("Error found within analyzeString: " + err);
        process.exit(1);
    }
};

const readFromFile = async filePath => {
    let count = 0;

    let instream = fs.createReadStream(filePath, {encoding: "utf-8"});
    const writableStream = new stream.Writable();

    writableStream._write = async (chunk, encoding, next) => {
        await analyzeString(chunk.toString())
        console.log("processing chunk number ", ++count);
        next();
    };


    const split = new stream.Transform({
        transform(chunk, encoding, next) {
            //current line so far represented by this.soFar
            let lines = (
                (this.soFar != null ? this.soFar : "") + chunk.toString()
            ).match(/(?:^.*$\r?\n?){1,1500}/gm);
            //split at the newline character
            const cleanLines = lines.map(line => line.replace(/[\n\r]/g, " "));

            // last element of the array is stored in this.soFar
            this.soFar = cleanLines.pop();
            // Each complete line sent as a separate push
            for (let line of cleanLines) {
                this.push(line);
            }
            // finished operations on this chunk.
            next();
        },
        // output remaining this.soFar data from the last line
        flush(done) {
            this.push(this.soFar != null ? this.soFar : "");
            // operations are done.
            done();
        }
    });

    writableStream.on('finish', () => {
        console.log('All writes are now complete.');
        process.exit(0)
    });
    instream.pipe(split).pipe(writableStream);
};

const readFromUrl = inputUrl => {
    const fileName = url.parse(inputUrl).hostname + ".txt";
    const file = fs.createWriteStream(fileName);

    http.get(inputUrl, function (response) {
        response.pipe(file);
    });
    file.on("finish", function () {
        const filePath = "./" + fileName;
        console.log("File Path is: ", filePath);
        readFromFile(filePath);
    });
};

module.exports = {
    analyzeString,
    readFromFile,
    readFromUrl
};