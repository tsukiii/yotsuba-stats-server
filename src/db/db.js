const {MongoClient} = require('mongodb');
const config = require('../config/config');

const saveToDB = (stats) => {
    //TODO: maybe migrate to mongoose
    MongoClient.connect('mongodb://localhost:27017/YotsubaStats',{ useNewUrlParser: true }, (error,client) => {
        if (error) {
            return console.log('Unable to connect to server');
        }
    
        console.log('Connected to server');
        const db = client.db('YotsubaStats');
        stats.date = new Date(Date.now());

        db.collection('History').insertOne(stats).then((result) => {
            return result;
        }, (err, result) => {
            if (err) console.log(err);
        });

        client.close();
    });
    
};

const retrieveHistory = () => {
 
    return new Promise((resolve, reject) => {
        let data;

        MongoClient.connect('mongodb://localhost:27017/YotsubaStats',{ useNewUrlParser: true },(error,client) => {
            if (error) {
                throw 'Unable to connect to server';
            }
            
            const db = client.db('YotsubaStats');
            const history = db.collection('History');

            const aggParameters =  {
                        
                '$group' : {
                    '_id': {
                        'year': {'$year': '$date'},
                        'month': {'$month': '$date'},
                        'day': {'$dayOfMonth': '$date'},
                        'hour': {'$hour': '$date'},
                    },
                }
            };
            for (const board of config.boards) {
                aggParameters[`$group`][`${board}`] = {'$avg': `$${board}`};
            }

            try {
                history.aggregate([aggParameters]).toArray().then(documents => {
                    data = documents;
                    client.close();

                    // sort by date ascending
                    data.sort(function(a, b){
                        return (a._id.year - b._id.year) || (a._id.month - b._id.month) || (a._id.day - b._id.day) || (a._id.hour-b._id.hour);
                    });
                    resolve(data);
                });
            }
            catch(err) {
                reject(`Unable to retrieve documents: ${err}`);
            }

        });
    });
};

module.exports = {
    saveToDB,
    retrieveHistory,
};

