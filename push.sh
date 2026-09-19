#!/usr/bin/env bash
set -e

git config user.name "mahanteshimath"
git config user.email "mahanteshimath@gmail.com"
git remote set-url origin git@github.com:mahanteshimath/supplychain-nexus.git

git add -A
git commit -m "${1:-Update}" || echo "Nothing to commit"
git push origin main
