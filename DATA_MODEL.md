# Data Model (SQLite)

Tables:

- users(id pk, created_at)

- scans(id pk, taken_at, score, subs_posture, subs_symmetry, subs_skin, subs_hair, photo_uri)

- actions(id pk, title, category, minutes, tip_md)

- plan_items(id pk, scan_id fk, action_id fk, status ENUM('todo','done'))

- badges(id pk, code, title, earned_at)

- settings(id pk, key, value)

Indexes on scans(taken_at), plan_items(scan_id).

