const axios = require('axios');
const db = require('./db/db');

axios.create({
    timeout: 5000,
    validateStatus: function(status) {
		return status === 200 || status === 304
	}
});

const getCatalog = async (board) => {
    let attempts = 0;
    while(true) {
        try {
            console.log(`Getting information for /${board}/`)
            const response = await axios.get(`https://a.4cdn.org/${board}/catalog.json`);
            return response.data;
        }
        catch (err) {
            attempts++;
            console.log(`Failed to get information for /${board}/ after ${attempts} attempts, retrying again after 3 seconds`);
            await new Promise(resolve => {
				setTimeout(resolve,3000);
			});
        }
    }
};

const processCatalog = (board) => {
    console.log(`Processing data`)
    let threadArr = [];

    for (const page of board) {

        for (const thread of page.threads) {
            if(!thread.closed) {
                let threadTime;
                // sometimes tim is undefined 
                // not sure exactly why, but I've seen it when OP's pic gets deleted
                threadTime = (thread.tim === undefined) ? thread.time * 1000 : thread.tim;

                threadArr.push({
                    no: thread.no,
                    age: Date.now() - threadTime,
                    replyCount: thread.replies,
                    postsPerMinute: thread.replies / ((Date.now() - threadTime) / 60000),
                });

            }
        }
    }

    threadArr.sort(function(a, b) {
        return b.postsPerMinute - a.postsPerMinute;
    });
    return threadArr;
};


const getBoardStats = async (boards) => {
    let boardStats = {};
    for (let board of boards) {
        const response = await getCatalog(board);
        await new Promise(resolve => {
            // set delay to comply with 4chan's api request limit 
            setTimeout(resolve, 1500);
        });
        const stats = processCatalog(response);
        let totalPPM = 0;
        for(const thread of stats) {
            totalPPM += thread.postsPerMinute;
        }
        boardStats[board] = totalPPM;
    }

    await db.saveToDB(boardStats);
    return boardStats;
};

module.exports.getBoardStats = getBoardStats;





