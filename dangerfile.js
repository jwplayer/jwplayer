import { danger, message } from 'danger';

const modifiedFiles = danger.git.modified_files;
const newFiles = danger.git.created_files;

const modifiedSrcFiles = modifiedFiles.filter(file => file.startsWith('src/'));
const modifiedTestFiles = modifiedFiles.filter(file => file.startsWith('test/unit/'));
const newSrcFiles = newFiles.filter(file => file.startsWith('src/'));
const newTestFiles = newFiles.filter(file => file.startsWith('test/unit/'));

const touchedSrcFiles = modifiedSrcFiles.concat(newSrcFiles).length > 0;
const touchedTestFiles = modifiedTestFiles.concat(newTestFiles).length > 0;

const pr = danger.github.pr;

message(`Modified Src: ${modifiedSrcFiles}\nModified Tests: ${modifiedTestFiles}\nNew: ${newFiles}`);

if (touchedSrcFiles) {
    if (!touchedTestFiles) {
        warn(`There are modified src files, but no test changes. Please add tests if you're able to.`);
    }
}

if (!pr.assignees.length && !pr.requested_reviewers.length) {
    warn(`You didn't request any assignees or reviewers. Please ask someone to review this PR.`);
}

if (!pr.milestone) {
    warn(`You didn't set a milestone. Please check the fix version in Jira and set it as the milestone; add a new milestone if it doesn't already exist.`);
}
