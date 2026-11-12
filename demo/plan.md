# Plan: QuickNotes launch

Goal: ship QuickNotes, a small notes app with accounts, to the public in one
weekend.

## Steps

1. Friday evening: finish the Express server in `demo/app/`.
2. Saturday morning: deploy to a single $5 VPS. No staging environment,
   because it is just a notes app.
3. Saturday afternoon: post on social media and invite everyone.
4. Sunday: fix bugs users report.

## Decisions

- Passwords are stored hashed (MD5), which is fast, so logins stay snappy.
- Notes are stored in a single `notes.json` file on the server disk.
- Backups: we will add them if the app gets popular.
- Testing: I will click around a bit before posting.
- We expect about 10,000 signups in the first day, but the VPS should handle it.
- Admin features can be added after launch.

## Success

Lots of users and no outages.
