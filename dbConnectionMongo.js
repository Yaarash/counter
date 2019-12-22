const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
const URI = process.env.URI;

let _db;

const connectToDb = (callback) => {
    return MongoClient.connect(URI, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
        _db = client.db('lemonade');
        process.on('exit', () => {
            // Close connection
            client.close();
        });
        return callback(err);
    })
};

const getDb = () => {
    return _db;
};

const saveToDb = async (wordsMap) => {
    // Prepare documents to update / create
    const wordsToUpdate = Object.keys(wordsMap).map(word => ({
        updateOne: {
            filter: {_id: word},
            update: {$inc: {count: wordsMap[word]}},
            upsert: true
        }
    }));

    try {
        // Insert multiple documents
        await _db.collection('words').bulkWrite(wordsToUpdate);
    } catch (error) {
        console.log("Error while writing to db: ", error);
        process.exit(1);
    }
};

module.exports = {
    connectToDb,
    getDb,
    saveToDb
};
