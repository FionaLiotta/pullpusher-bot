const axios = require(`axios`);

module.exports = class Repo {

    // get the 'username/reponame' from a github url. returns null if unable to match pattern.
    static getRepoId(str) {
        const extractRepo = /(?<=github\.com\/).+[^.git>|>]/;
        return str.match(extractRepo)[0];
    }

    //get user and repo name from a string. returns null if unable to match.
    setRepoUrl(str) {
        let repo = Repo.getRepoId(str);
        console.log(`got ${repo} from regex.`);
        if (repo) {
            this.url = `http://api.github.com/repos/${repo}/pulls?state=open`;
        } else {
            this.url = null;
        }
    }

    //Take a github repo URL and request the open pulls. returns a JSON object.
    async requestPulls(){
        const response = await axios.get(this.url);
        response['data'].forEach( element => {
            let newobj = ({html_url, id, title, updated_at, user:{login}}) => ({url:html_url, id, title, updated_at, user:login});
            this.pulls.push(newobj(element));
        });
    }

    //Check if an object from parseData's array has been updated within dayLimit number of days.
    //returns a boolean.
    isStale(pull) {
        const msLimit = 1000 * 60 * 60  * 24 * this.dayLimit;
        const now = new Date().getTime();
        const update = new Date(pull.updated_at).getTime();
        const delta = now - update;
        return (delta > msLimit);
    }

    //examine each pull in our pull list. returns an array of strings.
    async scanRepo() {
        const result = [];
        await this.requestPulls();
        this.pulls.forEach(pull => {
            if(this.isStale(pull)) {
                result.push('Stale pull found:\n' + 
                `*${pull.title}* by ${pull.user}\n` +
                `Last updated: ${pull.updated_at}\n` +
                `<${pull.url}>`);
            }
        });
        console.log(`in scanRepo\n` + result);
        return result;
    }

    constructor(url) {
        this.setRepoUrl(url);
        this.id = Repo.getRepoId(url);
        this.pulls = [];
        this.dayLimit = 5;
    }
}