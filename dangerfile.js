import { danger, error, message, schedule, warn } from 'danger';

const modifiedFiles = danger.git.modified_files;
const newFiles = danger.git.created_files;

const modifiedSrcFiles = modifiedFiles.filter(file => file.startsWith('src/'));
const modifiedTestFiles = modifiedFiles.filter(file => file.startsWith('test/unit/'));
const newSrcFiles = newFiles.filter(file => file.startsWith('src/'));
const newTestFiles = newFiles.filter(file => file.startsWith('test/unit/'));

const touchedSrcFiles = modifiedSrcFiles.concat(newSrcFiles).length > 0;
const touchedTestFiles = modifiedTestFiles.concat(newTestFiles).length > 0;

const pr = danger.github.pr;

if (touchedSrcFiles) {
    if (!touchedTestFiles) {
        warn(`🛠 There are modified src files, but no test changes. Add tests if you're able to.`);
    }
}

if (!pr.assignees.length && !pr.requested_reviewers.length) {
    warn(`🔎 Assign some reviewers or assignees.`);
}

if (!pr.milestone) {
    warn(`🗿 Set a milestone. It should be the ticket's fix version in JIRA.`);
}

schedule(async () => {
    await checkExactPackageVersion();
});

async function checkExactPackageVersion() {
    const diff = await danger.git.diffForFile('package.json');
    if (diff && diff.added && diff.added.match(/([\^~])/)) {
        error(`🥕 Only save exact versions of a dependency, without a ~ or ^.`);
    }
}

