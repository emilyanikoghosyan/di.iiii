# Parallel Agent Workflow

How to run more than one agent on `di.iiii` at the same time without agents clobbering each other's edits.

## The Core Rule

Two agents must never write to the same working directory at the same time. A single shared working tree means uncommitted edits from one agent look like stray/conflicting changes to the other (this happened — see golden_rules.md). Use one of the two isolation modes below instead.

## Mode 1: Git Worktree (preferred for same-repo parallel work)

Each agent gets its own checkout of the repo, sharing the same `.git` history, on its own branch.

```bash
# from the main checkout, create a worktree for agent 2
git worktree add ../di.iiii-agent2 -b agent2/<short-task-name> dev

# agent 2 works entirely inside ../di.iiii-agent2
# agent 1 keeps working in the original directory on its own branch
```

Rules:

- name the branch after the task, not the agent (`agent2/inspector-sliders`, not `agent2-branch`)
- each agent commits and pushes its own branch independently
- merge each branch into `dev` only when its task is done and validated
- remove the worktree when finished: `git worktree remove ../di.iiii-agent2`

## Mode 2: Role-Scoped Same-Branch Work (lighter weight, higher risk)

If a temporary worktree isn't worth the setup, agents can share one working tree only if they have **non-overlapping file scope** for the whole task. Use the role table in [roles/README.md](roles/README.md) to assign each agent a distinct "Owns" lane (e.g. one agent on Inspector/CSS, the other on serverXR routes) and confirm neither agent's file list overlaps before starting.

If you discover mid-task that another agent's uncommitted changes are sitting in files you need to touch:

1. do not edit or discard those files
2. `git stash push -- <file>` to set them aside (never `git checkout --` or `git reset --hard` on someone else's in-progress work)
3. do your unrelated work, commit/push it
4. `git stash pop` to restore the other agent's changes exactly as they were

## Merge Order

- each agent merges its own branch into `dev` when done; don't merge a branch you didn't author without checking with the other agent first
- resolve overlaps by re-reading both diffs, not by preferring whichever lands first
- after merging into `dev`, only merge `dev` into `main` when explicitly asked — that triggers a production deploy
