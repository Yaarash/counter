const { connectToDb, getDb } = require('./dbConnectionMongo');


connectToDb( async ( err ) => {
    if (err){
        console.log(err);
        process.exit(1);
    }

    console.log('connected to Db correctly');
    const db = getDb();
    try {
        await db.collection('words').deleteMany({});
        console.log("Cleared db from words!");
        process.exit(0);
    } catch (err) {
        console.log("Error found within clear command: "+err);
        process.exit(1);
    }

});