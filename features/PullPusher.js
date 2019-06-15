const repoList = require('./PullPusher/RepoList.js');
const Repo = require('./PullPusher/Repo.js');

module.exports = function(controller) {
    const myRepoList = new repoList();

    // **** For Testing ****
    myRepoList.context = "CKDSY41E2";
    const myRepo = new Repo('https://github.com/microsoft/LightGBM.git');
    myRepoList.addRepo(myRepo);
    const myRepo2 = new Repo('https://github.com/fastify/fastify.git');
    myRepoList.addRepo(myRepo2);

    controller.hears('setcontext', 'direct_mention', async(bot, message) => {
        try {
            myRepoList.context = message;
            await bot.reply(message, `Set context to ${repos.context}`);
        }
        catch (e) {
            await bot.reply(message, `Exception setting context: ${e}`);
        }
    });

    // List tracked repos
    controller.hears(['listrepo', 'listrepos'], ['direct_message', 'mention', 'direct_mention'], async (bot, message) => {
        const list = myRepoList.repos;
        for(x of list){
            await bot.reply(message, `https://github.com/${x[0]}`);
        }
    });

    // Add a GitHub repo
    controller.hears(['addrepo'], ['direct_message', 'mention', 'direct_mention'], async (bot, message) => {
        const myRepo = new Repo(message.text, message);
        if(myRepoList.addRepo(myRepo)) {
            await bot.reply(message, `Added ${myRepo.url}`);
        } else {
            await bot.reply(message, `Could not add repo ${myRepo.url}`);
        }
    });

    // Remove a GitHub repo
    controller.hears(['removerepo', 'deleterepo', 'delrepo', 'remrepo'], ['direct_message', 'mention', 'direct_mention'], async (bot, message) => {
        if(myRepoList.removeRepo(message.text)){
            await bot.reply(message, `Removed repo.`);
        } else {
            await bot.reply(message, `Could not remove repo.`)
        }
    });

    //test our scanning for stale pulls with a fixed repo.
    controller.hears(['test'], ['direct_message', 'mention', 'direct_mention'], async (bot, message) => {
        await bot.reply(message, 'Running test repo scan.');
        const stalePulls = await myRepoList.scanRepos();
        console.log(stalePulls);
        // We must handle promises from bot, even if we're not using the results.
        // TODO: Refactor how we're sending the stale pull messages to make this less ugly.
        const promises = stalePulls.map(async (pull) => {return await bot.reply(message, pull)});
        await Promise.all(promises).then();
    });
}