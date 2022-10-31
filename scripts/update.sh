#! /bin/sh
git checkout master && git pull
git checkout dev
git merge master --strategy-option theirs -m "Merged master"
git push