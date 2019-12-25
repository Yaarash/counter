const readline = require('readline');

const { connectToDb, getDb } = require('./dbConnectionMongo');

const getWordCount = async (word) => {
    try {
        const db = await getDb();
        const result = await db.collection('words').findOne({_id: word});
        if (!result) return 0;
        return result.count;
    } catch (err) {
        console.log("Error found within getWordCount() " + err);
        process.exit(1);
    }
}

const isEmptyCollection = async () => {
    try {
        const db = await getDb();
        const result = await db.collection('words').countDocuments();
        if (!result) return true;
        return false;
    } catch (err) {
        console.log("Error found within isEmptyCollection() " + err);
        process.exit(1);
    }

}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

connectToDb((err) => {
    if (err) {
        console.log(err);
        process.exit(1);
    }
    console.log('connected to Db correctly');
    rl.question('Please enter the requested word: \n', async (source) => {
        console.log(`Thank you for your input: ${source}`);
        rl.close();
        if (!await isEmptyCollection()) {
            // looking for word count while ignoring case
            const result = await getWordCount(source.toLowerCase());
            console.log("The word: " + source + " appeared " + result + " time(s)!");
        } else {
            console.log("The word counter is empty, please run 'npm start' instead");
        }
        process.exit(0);
    });
});