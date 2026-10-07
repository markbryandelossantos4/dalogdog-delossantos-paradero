# Group Contribution and Verification Guide

This guide follows the IT415 Acceptance Checklist. It explains the evidence to gather; it does not count as evidence of a member's implementation work, authorship, review, or identity. Fill the records from actual GitHub activity and the member's own explanation. Do not split an existing snapshot into artificial commits to meet the seven-stage requirement.

## Shared repository

- Repository: <https://github.com/markbryandelossantos4/dalogdog-delossantos-paradero>
- Integration branch: `main`
- Current confirmed collaborators: `paraderomiles-a11y` (Write) and `ainzekiel` (Write; Arnel Dalogdog).
- Have the repository owner confirm each member's account and that the instructor can access the repository. Record the instructor's verification and a demonstrated local clone in the supplied checklist.

## Per-member feature workflow

Each member should do these steps from their own GitHub account and computer after choosing a real, agreed feature or task:

1. Clone the shared repository if it is not already cloned, then update `main`:

   ```bash
   git clone https://github.com/markbryandelossantos4/dalogdog-delossantos-paradero.git
   cd dalogdog-delossantos-paradero
   git switch main
   git pull origin main
   ```

2. Create a descriptive branch for that member's actual task. For example, use `feature/<short-task>`; do not use the same generic branch name for multiple members:

   ```bash
   git switch -c feature/<short-task>
   ```

3. Implement and verify the assigned change on that branch. Run `pnpm test` and `pnpm build` when applicable. Commit meaningful, related changes with messages that explain the change.

4. Push the feature branch:

   ```bash
   git push -u origin feature/<short-task>
   ```

5. Open a pull request from that feature branch **into `main`**. Describe the feature, changed files, verification performed, and any AI assistance used and evaluated.

6. A different group member reviews the actual diff before merge. Record the reviewer's GitHub username and review outcome. Address requested changes, push the updates, and only then merge the PR into `main`.

7. Record the branch name, commit SHA(s), PR URL/number, reviewer, and merge status in the checklist and the evidence register below. If GitHub deletes a branch after merge, preserve its name and contribution evidence through the merged PR and commit history.

Useful checks before opening a PR:

```bash
git status
pnpm test
pnpm build
```

## Development-stage evidence

The checklist asks for at least seven **real** development stages in Git history, covering setup, interface, core functionality, validation, bug fixing, refactoring, and documentation. This repository currently began with a single initial snapshot commit; that commit does not prove seven stages. As the group performs genuine follow-up work, use focused commits and reviewed PRs so the history records the work as it happens. Never backdate, split, or invent commits to simulate the earlier development process. If earlier work really happened, retain existing authentic records (for example, dated commits or PRs) and let the instructor assess them.

## Evidence register

Replace or complete rows only with information confirmed by each member and the repository. Add rows for the rest of the group as needed. Do not infer legal names from email addresses or treat account permission alone as proof of authorship.

| Member ID | Member name (confirmed) | GitHub username / profile | Feature branch(es) | Actual feature / task | Commit SHA(s) | PR URL / number | Reviewer | PR status |
|---|---|---|---|---|---|---|---|---|
|  |  | `paraderomiles-a11y` |  |  |  |  |  |  |
|  | Arnel Dalogdog | `ainzekiel` |  |  |  |  |  |  |

## Individual member verification

For each member, the instructor/group should verify and record Pass, Fail, or N/A against the checklist using repository evidence and a live explanation/demo:

- GitHub account matches the recorded member.
- Feature branch and assigned work are identifiable.
- Authored, meaningful commits are visible and the branch was pushed to the shared repository.
- PR ownership and the actual feature changes are demonstrated.
- PR review, requested changes (if any), and merge status are explained.
- AI generation/debugging/refactoring use is identified; outputs are evaluated and adapted where needed.
- Member explains the code and demonstrates their contribution.

Commit counts, collaborator permissions, and this guide alone do not prove individual contribution. Keep personal passwords and access tokens private; each member must authenticate with their own account.

## Group development-process verification

Before marking the process checklist, verify from actual GitHub evidence that:

- the shared repository URL exists, instructor access was checked, and a local clone was demonstrated;
- source files are organized and tracked;
- the genuine development history shows the required stages and meaningful messages;
- every member's account, real task, feature branch, commits, PR, reviewer, and merge status are recorded;
- feature work was pushed from branches, reviewed before merge, and merged into `main`;
- the final application demonstrated is the version at the recorded `main` integration commit;
- the README documents setup/run steps, technology/storage choices, group contributions, and the group's AI prompts, responses, evaluations, and modifications.
