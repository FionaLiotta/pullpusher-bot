const Repo = require(`./Repo.js`);
module.exports = class RepoList {
    constructor() {
        this._repoMap = new Map();
        this.updateFrequency = 24;
        this._context;
        this._lastChecked = new Date(0).getTime();
    }

    // Return an array of Repo objects.
    get repos() {
        const cloneMap = new Map(this._repoMap);
        return cloneMap;
    }

    get context() {
        return this._context;
    }

    set context(message) {
        this._context = message.channel;
        console.log(`context now ${this._context}`);
    }

    timerExpired() {
        const now = new Date().getTime();
        const delta = now - this._lastChecked;
        const limit = this._lastChecked + (this.updateFrequency * 1000 * 60 * 60);
        console.log({now, delta, limit});
        if(delta >= limit) {
            this._lastChecked = now;
            return true;
        } else {
            return false;
        }
    }

    // Add an object of class Repo to the repo Map. 
    // Log an error if object is the wrong type.
    // return true if successful, false if failed.
    addRepo(repo) {
        if(repo instanceof Repo) {
            this._repoMap.set(repo.id, repo);
            console.log(`Added repo:\n${repo.id}`);
            return true;
        }
        else {
            console.log("Attemped to push invalid repo. Wrong type:\n" 
            + typeof(repo));
            return false;
        }
    }

    // Remove a repo from the repo Map.
    removeRepo(repo) {
        let key = Repo.getRepoId(repo);
        return this._repoMap.delete(key)
    }

    // Check each repo in our repo Map for stale pulls and return all the results as a single array.
    async scanRepos() {
        if(this._repoMap.size > 0) {
            console.log(this._repoMap);
            const promises = [...this._repoMap].map(async (repo) => {
                console.log(repo);
                return await repo[1].scanRepo();
            });
            const results = [];
            // This ugly code waits for all repos to be scanned then flattens the Promise results
            // into a single array for our bot to respond with.
            // TODO: Find a better way to get a flat array of results.
            await Promise.all(promises).then((values) => {
                values.forEach( x => {
                    x.forEach( y => results.push(y));
                });
            });
            return results;
        } else {
            return(['No repos added yet.']);
        }
    }
}