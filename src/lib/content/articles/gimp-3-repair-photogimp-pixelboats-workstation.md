---
title: "Repairing a Broken GIMP 3 Install and Turning It Into a Pixel Art Workstation"
slug: "gimp-3-repair-photogimp-pixelboats-workstation"
status: "published"
draft_type: "technical-blog-post"
date: "2026-05-28"
audience:
  - "indie game developers"
  - "front-end engineers doing art-adjacent production"
  - "small studios and client teams using practical open-source tooling"
possible_publication_targets:
  - "AI Wiki inbox"
  - "ryanspice.com"
  - "canopydigital.ca"
  - "Canopy Digital internal/process content"
tags:
  - GIMP
  - GIMP 3
  - Windows
  - Pixel Art
  - PhotoGIMP
  - G'MIC
  - Windhawk
  - DLL debugging
  - PixelBoats
  - creative tooling
related_posts:
  - "debugging-gimp-3-python-plugin-failures-windows-windhawk"
summary: "A real-world repair log and workflow writeup covering a broken GIMP 3.2 install, Windows DLL/runtime conflicts, Windhawk suspicion, PhotoGIMP, G'MIC-Qt, a Fluent-ish theme, and a PixelBoats-ready asset kit."
link_terms:
  - "GIMP|https://en.wikipedia.org/wiki/GIMP"
  - "PixelBoats|/?view=compact&tag=PixelBoats"
  - "PhotoGIMP|https://github.com/Diolinux/PhotoGIMP"
  - "G'MIC-Qt|https://gmic.eu/"
  - "Windhawk|https://github.com/ramensoftware/windhawk"
references:
  - "https://github.com/ramensoftware/windhawk/issues/380"
  - "https://developer.gimp.org/resource/writing-a-plug-in/tutorial-python/"
source_context:
  gimp_install_path: "<USER_HOME>\\AppData\\Local\\Programs\\GIMP 3\\bin\\gimp-3.exe"
  active_gimp_profile: "<USER_HOME>\\AppData\\Roaming\\GIMP\\3.2"
  repair_doc: "B:\\Temp\\@Browser\\gimp-repair-shindig.md"
  pixelboats_kit_path: "<USER_HOME>\\AppData\\Roaming\\GIMP\\3.2\\pixelboats-kit"
---

# Repairing a Broken GIMP 3 Install and Turning It Into a Pixel Art Workstation

Sometimes the problem is not that a tool is bad. Sometimes the problem is that Windows, plug-in runtimes, environment variables, app hooks, and one innocent folder move all decide to form a small committee.

This is a writeup of a real repair pass on a Windows 11 GIMP 3.2 setup. The end goal was not merely “make GIMP open again.” The goal was to turn it into a practical art-adjacent workstation for PixelBoats: sprite cleanup, palette work, UI mockups, hot-pink matte separation, texture experiments, and non-artist-friendly image processing.

The short version:

- GIMP had been moved from one folder to another.
- A fresh reinstall still produced runtime errors.
- The visible failures involved `_Unwind_Resume`, `libgraphite2.dll`, `libpango-1.0-0.dll`, and bundled GIMP Python plug-ins.
- A hard-isolated launch worked.
- A Windhawk plug-in was disabled because it had previously caused issues with Python programs.
- Tesseract-OCR DLLs were also visible on `PATH`, which made DLL pollution a secondary suspect.
- Once vanilla GIMP launched cleanly, PhotoGIMP, G'MIC-Qt, a lightweight Fluent-ish theme, and a PixelBoats kit were installed.

The important lesson: do not restore the old GIMP profile wholesale. Restore safe assets only. Leave old plug-ins and scripts quarantined until you can test them one at a time.

## The Symptom

The most obvious startup error was:

```text
entrypoint _Unwind_Resume could not be located in the dynamic link library
...\GIMP 3\bin\libgraphite2.dll
```

That looks like a missing function in `libgraphite2.dll`, but that is usually not the whole story. In a Windows GTK/GIMP install, one DLL error can really mean “something earlier in the dependency chain is wrong, old, injected, or being loaded from the wrong place.”

After launching GIMP from PowerShell with console output, the more useful error surfaced:

```text
Failed to load shared library 'libpango-1.0-0.dll' referenced by the typelib:
'libpango-1.0-0.dll': The specified procedure could not be found.
```

Then GIMP's bundled Python plug-ins started failing while importing `gi.repository`, including plug-ins such as:

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

That changed the diagnosis. Python was not the core problem. Python was where the runtime collision became visible.

## The First Trap: Fresh Reinstall Did Not Mean Clean Runtime

GIMP was freshly installed through winget as GIMP 3.2.4:

```text
GIMP 3.2.4
GIMP.GIMP
3.2.4.0
```

The Start Menu shortcut pointed to:

```text
<USER_HOME>\AppData\Local\Programs\GIMP 3\bin\gimp-3.exe
```

So the install itself existed and Windows knew where to launch it. But external DLLs were also visible from `PATH`:

```text
C:\Program Files\Tesseract-OCR\libgcc_s_seh-1.dll
C:\Program Files\Tesseract-OCR\libstdc++-6.dll
C:\Program Files\Tesseract-OCR\libwinpthread-1.dll
C:\Program Files\Tesseract-OCR\libgraphite2.dll
C:\Program Files\Tesseract-OCR\libpango-1.0-0.dll
```

That does not automatically prove Tesseract caused the failure. But it does mean the machine had external MinGW/GTK-ish DLLs available globally, which is exactly the kind of thing that can make Windows desktop applications fail in confusing ways.

The stronger clue came from a hard-isolated launch.

## The Useful Test: Hard-Isolated Launch

Instead of launching GIMP with the normal user environment, we launched it with a reduced environment:

- GIMP `bin` first
- Windows system paths only
- no `PYTHONPATH`
- no `PYTHONHOME`
- no `GI_TYPELIB_PATH`
- no `GTK_PATH`
- no `GTK_DATA_PREFIX`
- no `GIO_MODULE_DIR`

That launch worked cleanly.

At around the same point, a Windhawk plug-in was disabled. That mattered because Windhawk had already caused issues with Python programs on this machine before. There are also real-world reports of GIMP 3 / Windows / Python plug-in entrypoint weirdness around Windhawk-style injection, so this was not a random superstition.

The working theory became:

```text
Primary likely cause:
Windhawk hook/mod conflict with GIMP's bundled Python/GI/Pango runtime.

Secondary risk:
Tesseract-OCR DLL pollution in global PATH.
```

This is the kind of conclusion that is annoying but useful. It avoids the worse conclusion: “reinstall Windows” or “GIMP is broken.”

## The Rule That Saved the Setup

Once vanilla GIMP launched cleanly, the next temptation was to restore everything from the old profile.

Do not do that.

The safe restore set was:

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

The intentionally skipped restore set was:

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

That distinction matters. The safe folders are mostly personal assets. The skipped files and folders can restore broken paths, revive incompatible plug-ins, undo PhotoGIMP changes, or bring back old GIMP 2.x assumptions.

## Installing PhotoGIMP

After GIMP launched cleanly, PhotoGIMP was applied to the active profile:

```text
<USER_HOME>\AppData\Roaming\GIMP\3.2
```

PhotoGIMP helped with the human side of GIMP:

- Photoshop-like layout
- Photoshop-like shortcuts
- less hostile default workflow
- better muscle memory for non-GIMP-native users

That matters more than people admit. A tool you avoid because it feels alien is not really “free.”

## Installing G'MIC-Qt

The next install was G'MIC-Qt for GIMP 3.

G'MIC is the practical “make this more usable” layer:

- filters
- texture generation
- dithering and stylization
- sharpening and cleanup
- non-artist-friendly image improvement tools
- rough parchment, wood, water, fog, grain, and UI overlay experiments

At first, `Filters -> G'MIC-Qt` appeared greyed out. That was normal. GIMP disables many filters until an image is open and active.

Once a blank image was created, G'MIC-Qt opened correctly.

## Adding a Fluent-ish Theme

There is no real WinUI/Mica/Fluent mod for GIMP. GIMP is GTK-based, so you can theme colors and some widget styles, but you cannot turn it into a native Windows 11 app with a CSS file.

The safe compromise was a lightweight `Fluent-ish Dark` theme:

- dark GTK palette
- Windows-like blue accent
- softer controls
- no Windhawk UI hooks
- no system-level injection

The theme was installed into:

```text
<USER_HOME>\AppData\Roaming\GIMP\3.2\themes\Fluent-ish Dark
<USER_HOME>\AppData\Local\Programs\GIMP 3\share\gimp\3.0\themes\Fluent-ish Dark
```

This is the sane approach: theme the app, do not hook the app.

## Creating the PixelBoats GIMP Kit

The final step was turning the repaired tool into a project workstation.

The kit was installed to:

```text
<USER_HOME>\AppData\Roaming\GIMP\3.2\pixelboats-kit
```

It included:

```text
palettes/
templates/
docs/
scripts/
README.md
.thoughts
```

The palettes copied into the GIMP profile were:

```text
PixelBoats Core
PixelBoats Water
PixelBoats UI
PixelBoats Factions
```

The templates included practical working surfaces:

```text
16x16-inventory-icon-template.png
24x24-tiny-pickup-template.png
32x32-skill-icon-template.png
48x48-skill-icon-template.png
64x64-character-frame-template.png
96x96-character-frame-template.png
128x128-ship-frame-template.png
256x256-ui-panel-template.png
256x128-ui-9slice-panel-template.png
hot-pink-sprite-split-template.png
```

The point was not to make GIMP “beautiful.” The point was to reduce decision friction.

When you are not a full-time artist, the blank canvas is the enemy. Templates, palettes, and known export sizes are how you make the tool easier to approach.

## Pixel Art Defaults That Matter

For pixel work, the most important GIMP habit is to avoid blurry transforms.

Recommended settings:

```text
Edit -> Preferences -> Tool Options
Set transform/scaling interpolation to None or Nearest Neighbor where available.
```

For individual files:

```text
View -> Show Grid
View -> Snap to Grid
Image -> Configure Grid
```

Recommended grids:

| Asset | Grid |
|---|---:|
| Inventory icons | 16x16 / 24x24 |
| Skill icons | 32x32 / 48x48 |
| Character frames | 64x64 / 96x96 |
| Ships | 128x128 / 256x256 |
| UI panels | 8px / 16px |

Hot pink is useful, but only as a temporary matte/separation color. Final game sprites should export as PNG with real transparency.

## The Final Working Stack

The repaired and improved stack became:

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

That is a good stack because it is boring in the right way.

No random plug-in archaeology. No fragile UI injection. No old config resurrection. No “copy the whole backup and pray.”

## What This Process Says About Practical Tooling

This is the kind of workflow repair that often gets dismissed as “just fixing my machine,” but it is more than that.

For small studios, solo developers, and client-facing technical teams, the tooling layer is production infrastructure. If a creative tool is unreliable, the project pays for it every time someone avoids opening it.

The real value was not just making GIMP launch again. It was turning a broken, distrusted tool into a repeatable workstation:

- known install path
- documented failure mode
- isolated suspected causes
- safe restore policy
- project-specific palettes
- project-specific templates
- documented next steps

That is how you move from “I fought my computer for an evening” to “I improved the production pipeline.”

## Future Improvements

The next sensible iteration is not more plug-ins. It is better project assets:

- real `.xcf` templates for PixelBoats UI panels
- captain's log page templates
- minimap and inventory templates
- ship sprite-sheet templates
- character walk-cycle templates
- palette extraction from actual approved PixelBoats art
- a layer-group export workflow if GIMP 3 scripting remains stable

The boring conclusion is the right one:

```text
Fix the runtime first.
Customize lightly.
Restore selectively.
Build project-specific workflow assets.
Avoid haunted plug-in piles.
```

That is the difference between tinkering and tooling.


## Related Debugging Note

This production workflow article has a companion Windows debugging post focused on GIMP 3 Python plug-in failures, Pango/GI errors, Windhawk suspicion, and DLL/PATH isolation:

- [[2026-05-28-debugging-gimp-3-python-plugin-failures-windows-windhawk|Debugging GIMP 3 Python Plug-in Failures on Windows]]




