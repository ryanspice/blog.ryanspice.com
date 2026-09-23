---
title: "PocketMic 0.1.5: Opus Audio, Smarter Buffering"
seo_title: "PocketMic LAN 0.1.5: Opus Audio Codec and Adaptive Jitter"
slug: "pocketmic-lan-v0-1-5-adaptive-opus-audio"
status: "published"
draft_type: "field-note"
date: "2026-09-23"
updated_date: "2026-09-23"
release_date: "2026-09-23"
release_time: "12:00"
image: "/img/articles/pocketmic-lan-v0-1-5-adaptive-opus-audio/hero.svg"
image_alt: "Android phone streams encrypted Opus audio over a private LAN to a Windows receiver, with adaptive buffering between them."
image_credit: "Original diagram by Ryan Spice"
image_source: "/img/articles/pocketmic-lan-v0-1-5-adaptive-opus-audio/hero.svg"
row_image: "/img/articles/pocketmic-lan-v0-1-5-adaptive-opus-audio/hero.svg"
row_image_alt: "PocketMic 0.1.5 audio flow from Android through encrypted Opus and adaptive buffering to Windows."
row_image_credit: "Original diagram by Ryan Spice"
row_image_source: "/img/articles/pocketmic-lan-v0-1-5-adaptive-opus-audio/hero.svg"
summary: "PocketMic LAN 0.1.5 pairs Opus audio with adaptive jitter handling. Its release links now match the published assets, with artifact integrity checked and live-device tests still open."
seo_description: "PocketMic LAN 0.1.5 adds Opus audio and adaptive jitter handling. See verified release downloads, debug-signing details, and the real-device checks still ahead."
accent: "#b88a3b"
audience:
  - "Android users"
  - "Windows users"
  - "open-source builders"
  - "audio and networking practitioners"
tags:
  - "PocketMic LAN"
  - "Android"
  - "Windows"
  - "Audio codec"
  - "Open source"
  - "Audio"
  - "Networking"
credits:
  - "Ryan Spice"
related_posts:
  - "pocketmic-lan-encrypted-android-microphone"
references:
  - "PocketMic LAN 0.1.5 changelog|https://github.com/ryanspice/pocketmic-lan/blob/master/CHANGELOG.md"
  - "PocketMic LAN build evidence|https://github.com/ryanspice/pocketmic-lan/blob/master/BUILD-EVIDENCE.md"
  - "PocketMic LAN stabilization plan|https://github.com/ryanspice/pocketmic-lan/blob/master/STABILIZATION-PLAN.md"
  - "PocketMic LAN GitHub releases|https://github.com/ryanspice/pocketmic-lan/releases"
  - "PocketMic LAN v0.1.5 release|https://github.com/ryanspice/pocketmic-lan/releases/tag/v0.1.5"
  - "Opus audio codec specification (RFC 6716)|https://www.rfc-editor.org/info/rfc6716"
  - "Changes since v0.1.5|https://github.com/ryanspice/pocketmic-lan/compare/v0.1.5...master"
  - "PocketMic LAN landing page|https://canopydigital.ca/sites/pocketmic-lan/"
link_terms:
  - "the first PocketMic LAN article|https://blog.canopydigital.ca/2026/09/09/pocketmic-lan-encrypted-android-microphone/"
  - "PocketMic 0.1.5 changelog|https://github.com/ryanspice/pocketmic-lan/blob/master/CHANGELOG.md"
  - "build evidence|https://github.com/ryanspice/pocketmic-lan/blob/master/BUILD-EVIDENCE.md"
  - "stabilization plan|https://github.com/ryanspice/pocketmic-lan/blob/master/STABILIZATION-PLAN.md"
  - "GitHub Releases page|https://github.com/ryanspice/pocketmic-lan/releases"
  - "PocketMic LAN v0.1.5 release|https://github.com/ryanspice/pocketmic-lan/releases/tag/v0.1.5"
---

The first [PocketMic LAN article](https://blog.canopydigital.ca/2026/09/09/pocketmic-lan-encrypted-android-microphone/) started with a simple promise: use an Android phone as a Windows microphone over a private network, with the audio encrypted between the two devices. The v0.1.4 build made that path practical with QR pairing, a Windows receiver, and a documented protocol.

The next source milestone tackles a different problem. A stream can be encrypted and still sound rough when Wi-Fi jitters, packets arrive in bursts, or the phone and PC clocks drift apart. PocketMic's v0.1.5 release adds compressed audio and a receiver designed to adapt to those network conditions.

One naming note before we get into the codec: **Opus here means the Opus audio codec**, standardized in [RFC 6716](https://www.rfc-editor.org/info/rfc6716). It is unrelated to Anthropic's Claude Opus language model. PocketMic uses the codec on the phone and PC audio path; it does not mean Claude or a cloud AI is handling the microphone stream.

The public [GitHub v0.1.5 release](https://github.com/ryanspice/pocketmic-lan/releases/tag/v0.1.5) is marked Latest and was published on September 14. It includes an Android APK, a Windows receiver ZIP, and a checksum file. The verified tag-pinned downloads are the [Android `app-debug.apk`](https://github.com/ryanspice/pocketmic-lan/releases/download/v0.1.5/app-debug.apk), [Windows receiver ZIP](https://github.com/ryanspice/pocketmic-lan/releases/download/v0.1.5/PocketMicReceiver-win-x64.zip), and [SHA256SUMS.txt](https://github.com/ryanspice/pocketmic-lan/releases/download/v0.1.5/SHA256SUMS.txt).

Those distribution mismatches are now corrected in the release notes, README, and landing-page source: each points to the actual `app-debug.apk` asset, and the landing page identifies v0.1.5. The tag-pinned APK, Windows ZIP, and checksum file were downloaded on September 23 and matched the SHA-256 values in the manifest. The Android package signature also verifies as a debug certificate, so it should not be described as a production-signed release.

Since the v0.1.5 tag, the repository has three newer commits, focused on CI and repository maintenance rather than new runtime audio features. That makes the 0.1.5 release notes the right place to understand the codec and buffering changes; the current release page and branch comparison show the release state and the later maintenance commits.

## The big change is the Opus audio codec

The v0.1.4 path sent raw mono PCM16: 48,000 samples per second, split into 10-millisecond frames. That format is easy to inspect, but it spends network capacity on audio that can be represented more compactly.

The 0.1.5 changelog adds protocol v2 with Opus audio payloads, a codec flag, variable payload lengths, and PCM16 fallback. The Android side adds an Opus encoder using 48 kHz audio, 10-millisecond frames, a documented 48 kbps target, and forward error correction. The Windows receiver adds the matching decoder and packet-loss concealment.

The project estimates an Opus payload at roughly 60 bytes compared with 960 bytes for a PCM frame. Its modeled on-wire bandwidth is about 106 kbit/s rather than 822 kbit/s, or roughly an eight-fold reduction. Those figures describe the project's model; they are not a promise that every Wi-Fi network or conversation will achieve the same bandwidth or sound quality.

Keeping PCM fallback gives the protocol a compatibility path. The release notes say a v0.1.5 Android sender can connect to a v0.1.4 Windows receiver using PCM16 fallback, and a v0.1.4 Android sender can connect to a v0.1.5 Windows receiver in PCM16 mode. That is useful for staged upgrades: both ends do not need to change at the same time.

## The receiver starts responding to the network

The other major change is replacing one fixed prebuffer with adaptive jitter handling. The changelog describes a percentile-based estimate of recent packet arrival variation, a target buffer adjusted gradually, bounds that vary by link-quality tier, and clock-drift compensation. The stated target range is 30 to 120 milliseconds, with the effective buffer constrained by the current link classification.

That is a more useful model than assuming every home network has the same delay. A steady wired or clean Wi-Fi path can aim for a smaller wait. A noisier path can retain more audio before playback, reducing dropouts at the cost of latency. Four link-quality tiers—Excellent, Good, Degraded, and Poor—give the receiver a policy for changing that balance.

Packet pacing is part of the same effort. Instead of sending a burst of queued frames at once, the sender aims for even 10-millisecond spacing and resets its pacing schedule after a catch-up event. That should make the stream easier to handle downstream, but a packet capture from a real phone and PC is still needed to show that the timing holds outside a unit test.

There are also practical lifecycle improvements: a battery-optimization prompt for Android, a screen-aware Wi-Fi lock policy, and Windows receiver recovery after an audio-server restart. These address the unglamorous failures that appear after the first successful connection—screen-off behavior, power management, and the output device or audio service changing underneath the receiver.

## A published release, with some hardware evidence still open

The 0.1.5 notes add cross-language test vectors so Python-generated protocol fixtures can be checked by the Windows implementation. The build-evidence document records passing Windows builds and tests, Android packaging checks for native libraries, and fixture coverage for valid and tampered packets.

Those are useful checks, but they do not complete the acceptance story. The build-evidence record now includes September 23 artifact hashes, Windows ZIP contents, and APK signer identity. It preserves September 11 as the date of the original build/test results. Runtime checks remain explicitly blocked: launching the Android encoder, completing an Opus round trip, running a long screen-locked session, capturing packet pacing, and measuring drift convergence against a real clock. The downloadable APK is debug signed, not a production/store-signed release.

That distinction matters. “The decoder test passes” is not the same as “the Android phone sent Opus to the Windows receiver and the audio stayed usable through a long call.” PocketMic is moving toward the latter, but its own checklist says more proof is required.

## The next release-maintenance pass

The distribution correction is complete: source links now use the filenames actually attached to the v0.1.5 release, and evidence distinguishes current artifact checks from older builds and still-blocked hardware runs. The next work is verification, with one repeatable preflight for the next tag:

1. **Keep the existing v0.1.5 release and tag.** It is already published and marked Latest; no duplicate release or tag move is needed.
2. **Fix the Android asset reference.** Complete: the README and release notes now use the attached `app-debug.apk` name; the binary stays unchanged.
3. **Bring the landing page into line.** Complete in source: version, install command, and APK link now use v0.1.5 and the actual filename. The Windows ZIP and checksum links still target the published latest assets.
4. **Verify the package trail.** Complete: APK and Windows ZIP hashes match `SHA256SUMS.txt`; the signer is the Android Debug certificate, now identified in release notes.
5. **Refresh evidence and repeat the release preflight.** The September 23 artifact-integrity and APK-signing checks are recorded. The Android-to-Windows Opus path, long screen-off session, Wi-Fi interruption/reconnect, packet-pacing capture, and clock-drift measurement remain blocked until real-device receipts exist. The new checklist in `BUILD-EVIDENCE.md` ties those results to the next tag alongside builds, checksums, asset names, README/landing links, compatibility notes, and post-publish URL checks.

The release notes describe PCM16 compatibility across the 0.1.4 and 0.1.5 pairings. The project still advises keeping the receiver on a private LAN rather than exposing it to the public internet. The attached Android APK is debug signed; it should not be presented as a production-signed store release.

## A better direction, measured by the right evidence

PocketMic 0.1.5 is a meaningful engineering step: the Opus audio codec can cut the amount of audio sent over the network, and adaptive buffering gives the receiver a way to respond to real link conditions. The battery, Wi-Fi, pacing, and audio-restart work also focuses on how the system behaves after setup, where microphone tools earn or lose trust.

The next milestone is not just another codec mention in a changelog. It is a clean path from release notes to working downloads, plus current evidence from the complete Android-to-Windows path. That is how the project can turn a promising codec-and-buffering redesign into an update people can install with confidence.

## Sources

- [PocketMic LAN 0.1.5 changelog](https://github.com/ryanspice/pocketmic-lan/blob/master/CHANGELOG.md)
- [PocketMic LAN v0.1.5 GitHub release](https://github.com/ryanspice/pocketmic-lan/releases/tag/v0.1.5)
- [Opus audio codec specification (RFC 6716)](https://www.rfc-editor.org/info/rfc6716)
- [Changes since the v0.1.5 tag](https://github.com/ryanspice/pocketmic-lan/compare/v0.1.5...master)
- [PocketMic LAN build evidence](https://github.com/ryanspice/pocketmic-lan/blob/master/BUILD-EVIDENCE.md)
- [PocketMic LAN stabilization plan](https://github.com/ryanspice/pocketmic-lan/blob/master/STABILIZATION-PLAN.md)
- [Current PocketMic LAN GitHub releases](https://github.com/ryanspice/pocketmic-lan/releases)
- [The first PocketMic LAN article](https://blog.canopydigital.ca/2026/09/09/pocketmic-lan-encrypted-android-microphone/)
