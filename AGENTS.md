# Agent Rules

These rules apply to every agent working in this repository.

1. **Never push to `main` — keep it protected.** All work goes through a
   feature branch and a pull request. The default branch may only change via
   a merged PR; never force-push to it.

2. **Always open a pull request and meet ALL checks before merging — never merge early.** Push the
   feature branch, open the PR, then wait until every required check has
   finished and passed. This includes unit/functional tests, the E2E job, AND
   the test-coverage threshold — if the coverage gate fails, do not merge:
   implement more tests (and fix any broken ones) until coverage is back above
   the threshold. Only when every check is green may the PR be merged; never
   merge (or ask to merge) with failing or still-pending checks.

3. **Do not commit or push until the user confirms.** Finish and verify the
   work, show the result, and wait for explicit approval before creating a
   commit, pushing a branch, or opening a pull request.
