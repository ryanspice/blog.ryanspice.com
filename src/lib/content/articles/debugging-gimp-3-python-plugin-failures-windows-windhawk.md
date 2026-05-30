---
title: "Debugging GIMP 3 Python Plug-in Failures on Windows: When the Culprit Wasn’t GIMP"
slug: "debugging-gimp-3-python-plugin-failures-windows-windhawk"
status: "published"
draft_type: "technical-blog-post"
date: "2026-05-28"
audience:
  - "Windows power users"
  - "developers debugging desktop runtime issues"
  - "GIMP 3 users"
  - "creative tooling / indie game development workflows"
possible_publication_targets:
  - "AI Wiki inbox"
  - "ryanspice.com"
  - "canopydigital.ca"
  - "Canopy Digital internal/process content"
tags:
  - gimp
  - gimp-3
  - windows-11
  - windhawk
  - python-plugins
  - pango
  - dll-debugging
  - desktop-tooling
  - troubleshooting
related_posts:
  - "2026-05-28-gimp-3-repair-photogimp-pixelboats-workstation.md"
summary: "A companion debugging article about GIMP 3 Python plug-in failures on Windows, the misleading libgraphite2/_Unwind_Resume symptom, Pango/GI failures, PATH/DLL pollution, and the Windhawk hook layer."
source_context:
  gimp_install_path: "<USER_HOME>\\AppData\\Local\\Programs\\GIMP 3\\bin\\gimp-3.exe"
  active_gimp_profile: "<USER_HOME>\\AppData\\Roaming\\GIMP\\3.2"
  companion_article: "2026-05-28-gimp-3-repair-photogimp-pixelboats-workstation.md"
references:
  - "https://github.com/ramensoftware/windhawk/issues/380"
  - "https://developer.gimp.org/resource/writing-a-plug-in/tutorial-python/"
  - "https://discuss.pixls.us/t/completely-unexpected-bug-in-win-gimp-3-0-0-no-python-plug-ins-work/48948"
---

# Debugging GIMP 3 Python Plug-in Failures on Windows: When the Culprit Wasn’t GIMP

This is the companion debugging article to the PixelBoats GIMP workstation writeup.

The other article tells the production story: repairing GIMP, installing PhotoGIMP, adding G'MIC-Qt, setting up a Fluent-ish theme, and building a PixelBoats kit.

This one is narrower and more searchable: why GIMP 3’s Python plug-ins appeared to be broken on Windows, why the first error was misleading, and why Windhawk ended up being the most important suspect.

## The Misleading First Error

The first visible error looked like this:

```text
entrypoint _Unwind_Resume could not be located in the dynamic link library
...\GIMP 3\bin\libgraphite2.dll
```

That is a terrible clue because it points at `libgraphite2.dll`, but the DLL named in the dialog is not necessarily the true cause. On Windows, especially with GTK-based desktop applications, one missing entrypoint can mean a dependency chain is loading the wrong runtime DLL from somewhere else.

In other words, the error message was not useless, but it was not enough.

It suggested one of these broad possibilities:

- GIMP’s install folder was corrupted.
- GIMP was loading a mismatched DLL.
- Something external was injecting into the process.
- Another application’s runtime DLLs were visible globally through `PATH`.
- The old GIMP profile had plug-ins or config pointing at stale paths.

The install had been manually moved between folders earlier, so a clean reinstall was still the right first move. But the fresh install did not fully solve it.

## The Better Clue: Pango and GI Failures

Launching GIMP with console output showed a more useful failure:

```text
Failed to load shared library 'libpango-1.0-0.dll' referenced by the typelib:
'libpango-1.0-0.dll': The specified procedure could not be found.
```

Then a lot of bundled GIMP Python plug-ins failed while importing `gi.repository`:

```text
spyro-plus
python-eval
python-console
palette-sort
palette-offset
foggify
file-openraster
colorxhtml
```

That changed the investigation.

Python itself was probably not the root cause. Python was where the GTK/GObject/Pango runtime issue became visible.

GIMP 3’s Python plug-in system uses Python 3 and GObject-Introspection bindings. The official GIMP plug-in documentation specifically frames Python 3 plug-ins through `gi.repository` / GObject-Introspection, so failures around `gi.repository`, typelibs, Pango, and GTK are runtime-loading problems, not normal “my script has a syntax error” problems.

Reference:
https://developer.gimp.org/resource/writing-a-plug-in/tutorial-python/

## The Suspects

At this point the list of suspects was:

```text
1. Broken GIMP install
2. Old/stale GIMP profile
3. External DLL pollution through PATH
4. Tesseract-OCR's MinGW/GTK-ish DLLs
5. Android platform-tools DLLs
6. Windhawk process hooks/mods
7. Old third-party GIMP scripts or plug-ins
```

The old profile was parked aside. That helped rule out stale user config.

The fresh GIMP install was confirmed under:

```text
<USER_HOME>\AppData\Local\Programs\GIMP 3\bin\gimp-3.exe
```

The active profile was:

```text
<USER_HOME>\AppData\Roaming\GIMP\3.2
```

The Start Menu shortcut was correct.

So the next question became: what outside the GIMP folder could be influencing process startup?

## PATH Pollution Was Real

Running `where.exe` showed external runtime DLLs from Tesseract-OCR:

```text
C:\Program Files\Tesseract-OCR\libgcc_s_seh-1.dll
C:\Program Files\Tesseract-OCR\libstdc++-6.dll
C:\Program Files\Tesseract-OCR\libwinpthread-1.dll
C:\Program Files\Tesseract-OCR\libgraphite2.dll
C:\Program Files\Tesseract-OCR\libpango-1.0-0.dll
```

That does not automatically prove Tesseract caused the failure. But it is the sort of thing that can create confusing Windows desktop runtime failures.

A lot of developer machines accumulate global CLI tooling. OCR tools, Git tools, MSYS2, Android tools, Python installs, and language runtimes can all put DLLs somewhere visible. Most of the time that is fine. Sometimes a GUI app with its own runtime starts loading the wrong thing.

So the next test was not “uninstall everything.” It was isolation.

## The Test That Changed the Diagnosis

The useful test was a hard-isolated GIMP launch.

The launch environment was reduced to:

```text
GIMP bin
C:\Windows\System32
C:\Windows
C:\Windows\System32\Wbem
C:\Windows\System32\WindowsPowerShell\v1.0
```

The following were cleared for the test:

```text
PYTHONPATH
PYTHONHOME
GI_TYPELIB_PATH
GTK_PATH
GTK_DATA_PREFIX
GIO_MODULE_DIR
```

That isolated launch worked.

At around the same time, a Windhawk plug-in was disabled because Windhawk had previously caused issues with Python programs on this same machine.

That is where the “spoiler” enters the story.

## The Spoiler: Windhawk Was a Strong Suspect

There is a public Windhawk issue titled “GIMP 3.0 RC's fail to run python plugins.” In that thread, a GIMP developer notes that a reporter found disabling Windhawk allowed GIMP’s Python plug-ins to run.

Reference:
https://github.com/ramensoftware/windhawk/issues/380

That does not mean every GIMP 3 Python plug-in failure on Windows is Windhawk. It does mean the pattern is real enough to document:

```text
GIMP 3
Windows
Python plug-ins
GObject-Introspection / Pango / GTK runtime
Windhawk or hook-style desktop customization layer
```

That combination deserves suspicion.

The key point is that the error messages do not necessarily say “Windhawk.” They say things like `libgraphite2.dll`, `_Unwind_Resume`, `libpango-1.0-0.dll`, `gi.repository`, or `AssertionError`.

That is why the issue is hard to Google.

## Why This Was Hard to Search

The search terms you naturally try are things like:

```text
GIMP _Unwind_Resume libgraphite2.dll
GIMP libpango-1.0-0.dll procedure could not be found
GIMP 3 Python plug-ins not working Windows
GIMP gi.repository Pango AssertionError
```

Those terms point toward GIMP, Python, GTK, DLLs, or Pango. They do not naturally point toward a Windows desktop modding tool.

That is the gap this article is trying to fill.

If you are debugging this, add these search terms:

```text
GIMP 3 Python plug-ins Windhawk
GIMP Windows Python plug-ins Windhawk
GIMP 3 libpango Windhawk
GIMP GObject Introspection Windhawk
```

Even if Windhawk is not your exact problem, testing without process hooks is a good debugging move.

## Safe Repair Sequence

This was the repair order that worked.

### 1. Confirm the Start Menu target

The Start Menu shortcut pointed to:

```text
<USER_HOME>\AppData\Local\Programs\GIMP 3\bin\gimp-3.exe
```

That confirmed Windows was launching the current GIMP install, not some old moved folder.

### 2. Confirm the active GIMP profile

The active profile was the numeric GIMP profile:

```text
<USER_HOME>\AppData\Roaming\GIMP\3.2
```

A bug in an earlier script selected a backup folder because it sorted directories by name and picked:

```text
3.2.before-photogimp-...
```

The fix was to only select numeric folders:

```powershell
Get-ChildItem "$env:APPDATA\GIMP" -Directory |
  Where-Object { $_.Name -match '^\d+(\.\d+)+$' } |
  Sort-Object -Property @{ Expression = { [version]$_.Name }; Descending = $true } |
  Select-Object -First 1
```

That rule is worth keeping.

### 3. Launch GIMP in a hard-isolated environment

The isolated launch proved the app could run cleanly without the normal runtime environment.

### 4. Disable or exclude Windhawk for GIMP

Recommended exclusions:

```text
<USER_HOME>\AppData\Local\Programs\GIMP 3\bin\gimp-3.exe
<USER_HOME>\AppData\Local\Programs\GIMP 3\bin\python.exe
<USER_HOME>\AppData\Local\Programs\GIMP 3\bin\pythonw.exe
```

This is the least dramatic fix. Do not remove your entire desktop customization setup if excluding one app/process is enough.

### 5. Keep Tesseract-OCR out of global PATH if possible

Tesseract can be launched with its full path or a PowerShell function instead of leaving its runtime DLLs globally visible.

Example:

```powershell
& "C:\Program Files\Tesseract-OCR\tesseract.exe" --version
```

Or define a shell function for it.

### 6. Launch vanilla GIMP before installing anything else

This matters. PhotoGIMP, G'MIC, themes, and old assets are all noise until vanilla GIMP starts cleanly.

### 7. Restore safe assets only

Safe restore:

```text
brushes
dynamics
gradients
palettes
patterns
fonts
tool-presets
templates
```

Do not bulk restore:

```text
gimprc
pluginrc
sessionrc
dockrc
toolrc
shortcutsrc
plug-ins
scripts
modules
interpreters
```

Those files can restore broken paths, stale plug-in registries, old UI state, or incompatible scripts.

## What Not to Do

Do not keep reinstalling GIMP over and over without changing the runtime conditions.

Do not bulk-copy an old GIMP profile into a fresh profile.

Do not install random old Python-Fu plug-ins while the bundled Python plug-ins are still failing.

Do not fix a hook/injection problem by adding more hooks.

Do not treat `libgraphite2.dll` as the only suspect just because it appears in the first dialog.

## The Post-Repair Stack

After the debugging phase, the creative workflow setup became:

```text
GIMP 3.2.4
PhotoGIMP
G'MIC-Qt
Fluent-ish Dark theme
PixelBoats palettes
PixelBoats templates
Safe restored personal assets
Windhawk excluded/disabled for GIMP/Python
Old plug-ins and scripts quarantined
```

That became a separate production-workflow article because it serves a different intent.

This article is for the debugging trail. The other article is for the creative tooling outcome.

## The Practical Lesson

When Windows desktop apps bundle their own Python, GTK, GI, Pango, and related runtime pieces, the process environment matters.

So do app hooks.

So do global DLLs.

So do old user profiles.

The fix is not always “install the missing DLL.” Sometimes the fix is to stop the app from seeing the wrong DLL or from being modified at process startup.

That is boring, but it is the boring answer that works.

## Companion Post

After this runtime issue was handled, the repaired install was turned into a PixelBoats art workstation with PhotoGIMP, G'MIC-Qt, a lightweight Fluent-ish theme, palettes, templates, and safer restore rules.

Related draft:

```text
2026-05-28-gimp-3-repair-photogimp-pixelboats-workstation.md
```

When publishing both posts, do not duplicate/canonicalize them as the same article. Treat this one as the Windows debugging article, and the other as the production workflow article.


## Related Production Workflow Note

This debugging article has a companion production workflow post focused on repairing GIMP into a PixelBoats art workstation with PhotoGIMP, G'MIC-Qt, palettes, templates, and safer restore rules:

- [[2026-05-28-gimp-3-repair-photogimp-pixelboats-workstation|Repairing a Broken GIMP 3 Install and Turning It Into a Pixel Art Workstation]]




