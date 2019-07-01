const mongoose = require('mongoose');

const repoListSchema = new mongoose.Schema({
    teamID: String,
    channelID: String,
    repoIDs: Array,
    dayLimit: Number,
    updateInterval: Number
});

const RepoList = mongoose.model('RepoList', repoListSchema);

module.exports = function(controller) {
    controller.hears(['addrepo'], ['direct_mention'], async(bot, message) => {
        //extract the repo ID from the message
        const extractRepo = /(?<=github\.com\/).+[^.git>|>]/;
        const repoID = message.incoming_message.text.match(extractRepo)[0];
        console.log(`Extracted repo id: ${repoID}`);
        
        mongoose.connect('mongodb://localhost/testdb', {useNewUrlParser: true});    
        const db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', async function() 
        {
            //check if the team is in the DB already
            RepoList.findOne({'teamID': message.team}, 'teamID, repoIDs', (err, result) => 
            {
                if (err)
                {
                    console.err(err);
                    return;
                }
                if (result)
                {
                    console.log(`Team ${message.teamID} already had a document`);
                    result.repoIDs.push(repoID);
                    result.save((err, repo) => {if (err) console.error(err);});
                }
                else 
                {
                    console.log(`Team ${message.team} does not have a document. Make one!`);
                    const newRepo = new RepoList({
                        teamID: message.team,
                        channelID: message.channel,
                        repoIDs: [repoID],
                        dayLimit: 5,
                        updateInterval: 12
                    });
                    newRepo.save((err, repo) => {if (err) console.error(err);});
                }
            });
        });
    });
}