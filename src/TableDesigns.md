# Table Designs

Working draft for the future SQLite database.

Main rule: store facts and definitions. Derive game status from those records when possible.

## Definition Tables

These tables describe things that can exist in the game.

### stats

Stats are tracked skill areas such as Coding, Running, Reading, and Writing.

| column | notes |
| --- | --- |
| id | primary key |
| title | display name |
| created_at | when the stat was created |
| is_active | whether the stat can currently be used |

### activities

Activities are actions the player can log. Each activity belongs to a stat.

| column | notes |
| --- | --- |
| id | primary key |
| title | display name |
| rent_points | default rent points for this activity |
| xp_per_hour | XP earned per hour |
| stat_id | foreign key to `stats.id` |

### quests

Quests are goals the player can complete.

| column | notes |
| --- | --- |
| id | primary key |
| title | display name |
| date_start | when the quest becomes active |
| date_end | optional deadline |
| xp_reward | XP awarded on completion |
| stat_id | foreign key to `stats.id` if the quest rewards one stat |

## Fact Tables

These tables record things that happened.

### activity_entries

An activity entry is one logged activity.

| column | notes |
| --- | --- |
| id | primary key |
| activity_id | foreign key to `activities.id` |
| local_date | game day this activity counts for |
| minutes | how long the activity took |
| rent_points_earned | rent points earned by this specific entry |
| xp_earned | XP earned by this specific entry |
| created_at | when the entry was logged |

### daily_rent_results

Daily rent results record the outcome for a day.

| column | notes |
| --- | --- |
| id | primary key |
| local_date | game day; should be unique |
| rent_paid | whether rent was paid |
| paid_at | when rent was recorded as paid |

### daily_reflections

Daily reflections are journal notes connected to a day, usually after rent is paid.

| column | notes |
| --- | --- |
| id | primary key |
| body | reflection text |
| local_date | game day this reflection belongs to |
| rent_result_id | foreign key to `daily_rent_results.id` |
| created_at | when the reflection was created |
| updated_at | when the reflection was last edited |

### rest_token_uses

Rest token uses protect the streak for a day without increasing it.

| column | notes |
| --- | --- |
| id | primary key |
| local_date | game day protected by the rest token; should be unique |
| used_at | when the rest token was used |

### quest_completions

Quest completions record that a quest was completed.

| column | notes |
| --- | --- |
| id | primary key |
| quest_id | foreign key to `quests.id`; should be unique if quests can only be completed once |
| completed_at | when the quest was completed |

## Later Tables

These are likely useful, but can wait until the first SQLite version is working.

### coin_transactions

Coin transactions should eventually record every coin balance change.

| column | notes |
| --- | --- |
| id | primary key |
| amount | positive for earned coins, negative for spent coins |
| reason | why coins changed |
| source_type | table/type that caused the transaction |
| source_id | id of the source record |
| created_at | when the transaction happened |

## Keys And Constraints

Primary keys:

- `stats.id`
- `activities.id`
- `quests.id`
- `activity_entries.id`
- `daily_rent_results.id`
- `daily_reflections.id`
- `rest_token_uses.id`
- `quest_completions.id`
- `coin_transactions.id`

Foreign keys:

- `activities.stat_id` -> `stats.id`
- `quests.stat_id` -> `stats.id`
- `activity_entries.activity_id` -> `activities.id`
- `daily_reflections.rent_result_id` -> `daily_rent_results.id`
- `quest_completions.quest_id` -> `quests.id`

Unique constraints:

- `daily_rent_results.local_date`
- `rest_token_uses.local_date`
- `quest_completions.quest_id` if each quest can only be completed once

## Derived Values

These should usually be calculated instead of trusted as stored counters.

- current coin balance
- today's rent points
- current streak
- best streak
- total XP
- level
- quest completion status
