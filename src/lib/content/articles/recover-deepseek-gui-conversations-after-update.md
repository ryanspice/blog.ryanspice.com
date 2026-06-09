---
title: "Recovering DeepSeek GUI Conversations After an Update"
slug: "recover-deepseek-gui-conversations-after-update"
status: "published"
draft_type: "technical-recovery-guide"
date: "2026-06-09"
updated_date: "2026-06-09"
summary: "A backup-first Windows recovery guide for DeepSeek GUI conversations that appear to disappear after an app update changes the local data directory."
accent: "#10b981"
image: "https://images.pexels.com/photos/33349204/pexels-photo-33349204.jpeg?auto=compress&cs=tinysrgb&w=2000"
image_alt: "Dark developer workspace with code on multiple screens"
image_credit: "Pexels stock photo"
image_source: "https://www.pexels.com/photo/modern-programmer-workspace-with-digital-code-33349204/"
image_position: "center center"
row_image: "https://images.pexels.com/photos/5951759/pexels-photo-5951759.jpeg?auto=compress&cs=tinysrgb&w=1600"
row_image_alt: "External drive connected to a laptop for backup"
row_image_credit: "Arina Krasnikova / Pexels"
row_image_source: "https://www.pexels.com/photo/portable-drive-connected-to-laptop-5951759/"
row_image_position: "center 52%"
background_image: "https://images.pexels.com/photos/5480781/pexels-photo-5480781.jpeg?auto=compress&cs=tinysrgb&w=1800"
background_image_alt: "Server racks and cables in a data center"
background_image_credit: "Brett Sayles / Pexels"
background_image_source: "https://www.pexels.com/photo/server-racks-on-data-center-5480781/"
background_image_position: "center center"
audience:
  - "Windows users"
  - "DeepSeek GUI users"
  - "local-first AI tool users"
  - "developers"
tags:
  - "DeepSeek"
  - "Windows"
  - "local-first"
  - "AI agents"
  - "data recovery"
  - "developer workflow"
  - "#deepseek"
related_posts:
  - "hermes-deepseek-setup"
  - "what-can-you-actually-do-with-a-deepseek-api-key"
  - "how-chatgpt-performs-deep-research"
---

# Recovering DeepSeek GUI Conversations After an Update

The scary version is simple: you update DeepSeek GUI, open the app again, and the conversation list is empty.

The calmer version is usually more useful: the conversations may still be on disk, but the updated app may be looking at a different local data directory.

That is the first thing to check before you assume the update deleted anything. This is a #deepseek recovery note for Windows users who are comfortable with PowerShell, SQLite, and not making the situation worse by deleting the old folder too early.

## The short version

DeepSeek GUI stores its working state locally. In my case, the old folder still had the threads, JSONL event files, and SQLite index. The new app instance had simply started reading a different directory.

The recovery shape was:

1. Close DeepSeek GUI.
2. Back up the old and new data directories.
3. Compare the thread indexes.
4. Copy missing thread folders.
5. Insert missing thread rows into the new SQLite index.
6. Restart the app.
7. Verify the threads are visible.
8. Archive the old folder only after verification.

Do not start with cleanup. Start with evidence.

![External drive connected to a laptop](https://images.pexels.com/photos/5951759/pexels-photo-5951759.jpeg?auto=compress&cs=tinysrgb&w=1400 "Back up both data directories before touching the database. The boring step is the one that saves you.")

## What probably happened

The app did not necessarily forget your conversations. It may have changed which folder it considers the active data root.

A local-first AI workbench usually has at least two layers of state:

- app settings
- runtime settings
- thread index database
- thread event files
- message JSONL files
- attachments
- logs
- write-mode workspace files

If the update changes the app data root, workspace root, runtime data directory, or default profile behavior, the UI can look brand new even though the old thread files are still sitting somewhere else.

That is annoying. It is also recoverable if you slow down.

## The directory shape to look for

The exact folders can vary by version and setup. Look for a structure like this:

```text
<data-dir>/
  config.json
  index.sqlite3
  kun/
    config.json
    index.sqlite3
    index.sqlite3-wal
    threads/
      thr_xxxxxxxx/
        events.jsonl
        messages.jsonl
        metadata.jsonl
    attachments/
  logs/
  write_workspace/
```

The important parts are `kun/index.sqlite3` and `kun/threads/`. The database is the index. The thread folders are the actual conversation material.

![Server racks and storage infrastructure](https://images.pexels.com/photos/5480781/pexels-photo-5480781.jpeg?auto=compress&cs=tinysrgb&w=1400 "Conversation recovery is mostly boring storage hygiene: find the real files, back them up, then reconcile the index.")

## Find the old and new data directories

Close DeepSeek GUI first. Do not merge databases while the app is running.

Then check the likely Windows locations:

```powershell
$Candidates = @(
  "$env:USERPROFILE\.deepseekgui",
  "$env:APPDATA\DeepSeek GUI",
  "$env:LOCALAPPDATA\DeepSeek GUI",
  "<workspace>\.deepseekgui"
)

foreach ($Path in $Candidates) {
  if (Test-Path -LiteralPath $Path) {
    Get-ChildItem -LiteralPath $Path -Recurse -Depth 2 |
      Select-Object FullName, LastWriteTime |
      Sort-Object LastWriteTime -Descending |
      Select-Object -First 30
  }
}
```

You are looking for `index.sqlite3`, `kun/index.sqlite3`, and `kun/threads`.

The logs may also tell you the active runtime path. Search for `dataDir` or `kun` inside the app logs:

```powershell
Get-ChildItem "$env:APPDATA\DeepSeek GUI" -Recurse -Filter "*.log" -ErrorAction SilentlyContinue |
  Select-String -Pattern "dataDir|kun|threads" -CaseSensitive:$false
```

If you find an old folder with a full set of threads and a new folder with only one or two fresh threads, you have the shape of the problem.

## Back up both folders

Before touching SQLite, make copies.

```powershell
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$OldRoot = "$env:USERPROFILE\.deepseekgui"
$NewRoot = "<workspace>\.deepseekgui"

Copy-Item -LiteralPath $OldRoot -Destination ".\deepseekgui-old-$Stamp" -Recurse
Copy-Item -LiteralPath $NewRoot -Destination ".\deepseekgui-new-$Stamp" -Recurse
```

Adjust those paths to your real old and new roots. The point is not the exact command. The point is that you should have a rollback copy before you edit anything.

## Compare the thread indexes

If you have `sqlite3` available, compare both thread tables.

```powershell
sqlite3 "<old-root>\kun\index.sqlite3" ".mode csv" "SELECT id, title, message_count, updated_at FROM threads ORDER BY updated_at_ms DESC;"
sqlite3 "<new-root>\kun\index.sqlite3" ".mode csv" "SELECT id, title, message_count, updated_at FROM threads ORDER BY updated_at_ms DESC;"
```

If the old database has the missing conversations and the new database does not, you can merge missing rows.

If the old database is empty too, stop. That is a different problem. Do not invent a fix by copying random files around.

## Copy missing thread folders

Copy only thread folders that are missing in the new runtime directory.

```powershell
$OldThreads = Get-ChildItem "<old-root>\kun\threads" -Directory
$NewThreadRoot = "<new-root>\kun\threads"
$Existing = (Get-ChildItem $NewThreadRoot -Directory).Name

foreach ($Thread in $OldThreads) {
  if ($Thread.Name -notin $Existing) {
    Copy-Item -LiteralPath $Thread.FullName -Destination $NewThreadRoot -Recurse
  }
}
```

This preserves new conversations created after the update while bringing the old thread files across.

## Merge missing SQLite rows

The database merge is where people can break things. Keep it narrow.

Attach the old database to the new one, insert only missing thread IDs, and rewrite file paths from the old root to the new root.

```sql
ATTACH '<old-root>\kun\index.sqlite3' AS old;

INSERT INTO threads
SELECT
  id,
  title,
  workspace,
  model,
  mode,
  status,
  approval_policy,
  sandbox_mode,
  cost_budget_usd,
  cost_budget_warning_sent,
  relation,
  parent_thread_id,
  forked_from_thread_id,
  forked_from_title,
  forked_at,
  forked_from_message_count,
  forked_from_turn_count,
  goal_json,
  todos_json,
  created_at,
  updated_at,
  created_at_ms,
  updated_at_ms,
  preview,
  message_count,
  event_seq_high_water,
  REPLACE(metadata_path, '<old-root>', '<new-root>'),
  REPLACE(messages_path, '<old-root>', '<new-root>'),
  REPLACE(events_path, '<old-root>', '<new-root>'),
  search_text
FROM old.threads
WHERE id NOT IN (SELECT id FROM threads);
```

That `WHERE` clause matters. It prevents duplicate thread IDs.

The `REPLACE` calls matter too. If the index points to the old folder after you moved the thread files, the UI can still fail to load the content.

## Restart and verify

Open DeepSeek GUI again and check:

- the old threads appear in the sidebar
- the newest post-update threads still appear
- opening an old thread shows messages, not just a title
- attachments are present if you used them
- the app can create a new test thread

If all of that works, you are probably done.

## Do not delete the old folder yet

The original panic makes people want to clean up immediately. Do not.

Rename or archive the old directory after you have verified the recovered threads and made one extra backup.

```powershell
Rename-Item -LiteralPath "$env:USERPROFILE\.deepseekgui" -NewName ".deepseekgui.recovered-archive"
```

Leave it there for a while. Storage is cheap. Reconstructing a conversation history from half-deleted files is not.

## Why this matters more with local AI tools

Local-first tools are worth using because they keep more state on your machine. That also means you inherit some local system responsibility.

Cloud tools hide the database from you. Local tools give you the database and the logs. That is better for control, but it means updates, paths, profiles, workspaces, and runtime folders matter.

DeepSeek GUI is moving fast. The public repo and release page show a real local agent workbench taking shape, with Kun as the local runtime, Code and Write surfaces, approvals, plans, and long-running work. That is useful. It also means the data model is worth treating seriously during updates.

The practical rule is simple:

> Before updating a local AI workbench, know where its data directory is.

## My checklist before the next update

- Find the active data directory in settings or logs.
- Back up the whole data directory.
- Note the current version.
- Update.
- Confirm the thread count looks right.
- Keep the backup until at least one normal work session passes.

That is not glamorous. It works.

## Photo credits

Hero image: Pexels stock photo. Backup image: Arina Krasnikova / Pexels. Storage image: Brett Sayles / Pexels.

## Sources

- [DeepSeek GUI GitHub repository](https://github.com/XingYu-Zhong/DeepSeek-GUI)
- [DeepSeek GUI releases](https://github.com/XingYu-Zhong/DeepSeek-GUI/releases)
- [WinCentral: DeepSeek GUI launches as a local-first AI agent workspace](https://thewincentral.com/deepseek-gui-local-ai-agent-workspace/)
- [AP: DeepSeek rolls out a long-anticipated update of its AI model](https://apnews.com/article/deepseek-ai-china-gpt-v4-d2ed33f2521917193616e061674d5f92)
- [AP: DeepSeek app downloads paused in South Korea over privacy concerns](https://apnews.com/article/south-korea-deepseek-app-downloads-privacy-concerns-ai-20950f357276b9bb8f2a70a4b3c03e96)
- [Pexels portable-drive photo](https://www.pexels.com/photo/portable-drive-connected-to-laptop-5951759/)
- [Pexels server-rack photo](https://www.pexels.com/photo/server-racks-on-data-center-5480781/)
