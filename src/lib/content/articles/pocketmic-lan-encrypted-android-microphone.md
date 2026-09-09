---
title: "My Cat Ate the Microphone, So I Built PocketMic LAN"
seo_title: "PocketMic LAN: An Encrypted Android Microphone for Windows"
slug: "pocketmic-lan-encrypted-android-microphone"
status: "published"
draft_type: "build-log"
date: "2026-09-09"
updated_date: "2026-09-09"
release_date: "2026-09-09"
release_time: "09:00"
summary: "A practical build note on PocketMic LAN: turning an Android phone into an encrypted Windows microphone over a private LAN, with QR pairing, authenticated UDP audio, and an honest release boundary."
seo_description: "How PocketMic LAN turns an Android phone into an encrypted Windows microphone over a private LAN, and what its v0.1.4 source currently proves."
accent: "#b88a3b"
image: "https://canopydigital.github.io/pocketmic-lan/og-image.png"
image_alt: "PocketMic LAN encrypted microphone landing page visual"
image_credit: "PocketMic LAN"
image_source: "https://canopydigital.ca/sites/pocketmic-lan/"
image_position: "center center"
audience:
  - "Windows users"
  - "Android developers"
  - "open-source builders"
  - "audio and streaming practitioners"
tags:
  - "Android"
  - "Windows"
  - "Open source"
  - "Networking"
  - "Audio"
  - "Privacy"
  - "Build log"
credits:
  - "Ryan Spice"
co_authors:
  - "OpenAI Codex|https://openai.com/codex/|Organization"
references:
  - "Ryan Spice launch post on X|https://x.com/RyanSpice/status/2097543171995566427"
  - "PocketMic LAN source repository|https://github.com/ryanspice/pocketmic-lan"
  - "PocketMic LAN landing page|https://canopydigital.ca/sites/pocketmic-lan/"
  - "PocketMic LAN protocol v1|https://github.com/ryanspice/pocketmic-lan/blob/master/pocketmic-lan-v0.1.4/PROTOCOL.md"
  - "PocketMic LAN v0.1.4 changelog|https://github.com/ryanspice/pocketmic-lan/blob/master/pocketmic-lan-v0.1.4/CHANGELOG.md"
  - "VB-CABLE|https://vb-audio.com/Cable/"
link_terms:
  - "PocketMic LAN source|https://github.com/ryanspice/pocketmic-lan"
  - "PocketMic LAN site|https://canopydigital.ca/sites/pocketmic-lan/"
  - "PocketMic protocol|https://github.com/ryanspice/pocketmic-lan/blob/master/pocketmic-lan-v0.1.4/PROTOCOL.md"
---

> [!status-brief] Build read
>
> **The clean read.** PocketMic LAN turns an Android phone into a Windows microphone without sending the audio through a cloud service. It is a small, useful answer to a very ordinary hardware problem.
>
> **The operator read.** The interesting work is underneath the demo: authenticated packets, sequence handling, prebuffering, loss concealment, QR pairing, encrypted key storage, and diagnostics that do not get in the way of the audio loop.
>
> | Area | Current stance |
> | --- | --- |
> | Core product | Android phone to Windows audio over a private LAN |
> | Wire format | 48 kHz mono PCM16, 10 ms UDP frames, AES-256-GCM |
> | Current source | v0.1.4 tree with Android, Windows, web, scripts, and verification tools |
> | Ready to claim | Open-source build and protocol work |
> | Still needs proof | Signed binaries, a normal installer, and repeatable physical end-to-end testing |

The original problem was not grand. It was a missing microphone.

I had Zoom meetings to do, my cat had apparently eaten the microphone, and the obvious expensive answer was to buy another piece of hardware. The more interesting answer was to use the hardware already sitting on the desk: an Android phone, a Windows PC, and the private Wi-Fi network between them.

That is where [PocketMic LAN](https://github.com/ryanspice/pocketmic-lan) came from.

The first version could have been a thin “send some audio over UDP” experiment. That would have been enough to make a demo and not enough to make something I wanted to use. A microphone path has to survive the boring conditions: the receiver starts late, a packet goes missing, the Wi-Fi link jitters, the output device disappears, the phone goes into the background, or the pairing key is wrong.

The project is now a compact Android transmitter and Windows receiver with a public [landing page](https://canopydigital.ca/sites/pocketmic-lan/), a documented protocol, build scripts, and a growing set of verification tools. It is still a small project. That is part of the appeal.

## The useful shape of the system

The path is deliberately direct:

~~~
Android phone
    microphone -> 48 kHz PCM16 -> encrypt -> UDP over private LAN
                                                       |
                                                       v
Windows receiver
    authenticate -> sequence/reorder -> prebuffer -> speakers, VB-CABLE, or VoiceMeeter
~~~

The phone does not need an account. The PC does not need to send the audio to a hosted service. If the goal is to get a better microphone into Discord, OBS, Teams, Zoom, or a game, PocketMic can play into a Windows output endpoint and a virtual cable can expose that output as a recording device.

That last step matters. PocketMic is not trying to become a separate audio ecosystem for every application. It gives Windows an audio signal and lets Windows’ existing device-routing tools do the rest. Install [VB-CABLE](https://vb-audio.com/Cable/), choose ‘CABLE Input’ in PocketMic Receiver, then choose ‘CABLE Output’ as the microphone in the target application.

## One packet, ten milliseconds

The wire format is refreshingly explicit. PocketMic sends one authenticated encrypted datagram for every 10 ms microphone frame:

| Part | Size | Meaning |
| --- | ---: | --- |
| Header | 24 bytes | ‘PMIC’, protocol version, flags, session ID, sequence, sample rate |
| Encrypted audio | 960 bytes | 480 mono PCM16 samples at 48,000 Hz |
| GCM tag | 16 bytes | Authentication for the packet |

That makes each datagram exactly 1,000 bytes and produces 100 packets per second, or 768 kbit/s of raw mono PCM audio before the normal network framing overhead.

The encryption boundary is equally clear. The pairing key is hashed with SHA-256 to produce the AES-256-GCM key. The 24-byte header is authenticated data, so changing the session, sequence, or sample-rate fields invalidates the packet rather than quietly changing how the receiver interprets it. A stream gets a random session ID, and the sequence number is never allowed to wrap inside that session.

The reconnect rule is the kind of detail that separates a protocol from a screenshot. A dropped link does not reset the counter. Resetting it could reuse a key-and-nonce pair. A genuine new stream gets a new random session ID instead.

There is also a separate authenticated control channel on the next UDP port for discovery and live status. That channel has its own HMAC-derived key rather than reusing the audio cipher key for a different job. The project treats parsing and authentication as separate steps, which lets it report “a receiver answered but the key is wrong” instead of collapsing every failure into silence.

## Pairing without making the user type a LAN address

The current v0.1.4 work added the small piece of UX that makes a network tool feel usable: QR pairing.

The Windows receiver can show a QR code containing a ‘pmic://host:port/key’ payload. The Android app scans it with CameraX and ML Kit, fills in the connection fields, and stores the pairing key with Android Keystore-backed encrypted preferences. Manual IPv4 entry remains available as a fallback, but it is no longer the default experience.

That is a good example of the kind of feature that looks cosmetic until you use the system. A microphone tool should not make a person copy an IP address and a long key while they are already trying to join a call. The QR code is not the security model; it is the human-friendly transport for the security configuration that the encrypted stream still enforces.

## Audio reliability is mostly about controlled imperfection

The receiver does not pretend that UDP is a reliable audio transport. It builds the useful parts of reliability around it:

- a 100 ms playback prebuffer;
- a configurable prebuffer range rather than one hard-coded latency promise;
- unsigned sequence arithmetic that survives counter rollover;
- rejection of malformed, unauthenticated, or wrong-version packets;
- bounded concealment for small gaps by repeating the last good frame at a decaying level;
- a fresh prebuffer after a large jump or genuinely new session;
- latency trimming above a high-water mark instead of allowing buffering to drift forever;
- controlled shutdown when a Windows output device disappears.

This is not studio-clock synchronization, Opus compression, or a universal low-latency audio stack. It is a sensible conversational-audio policy for a private Wi-Fi link. The project keeps PCM16 because it is easy to reason about and easy to verify; the tradeoff is bandwidth.

The phone’s capture loop and network send loop are separated. A bounded queue can drop the oldest packet rather than stalling the microphone forever. The input meter is throttled, and diagnostics run away from the hot path. These are small decisions, but they reflect the right priority: the microphone should keep capturing even when observability or the network is having a bad moment.

## What the project proves — and what it does not

The public source is in a better place than a marketing-only demo. It includes Android and Windows code, Kotlin and receiver tests, PowerShell build helpers, firewall setup, protocol checks, receiver-logic checks, source verification, and a web surface with real product captures.

The current changelog records the v0.1.4 QR pairing work and a Windows receiver build with 74 passing tests. That is useful evidence. It is not the same as proving that every Android phone, Wi-Fi access point, Windows audio driver, virtual cable, and target meeting application behaves perfectly together.

The repository is also honest about the remaining boundary: there is no signed Android release, no Windows installer, no updater, and end-to-end behaviour still needs physical Android/Windows/Wi-Fi/VB-CABLE testing. At the time of writing, the release page is the public handoff target, while the source build is the clearest reproducible path.

That distinction is important to me. “The protocol test passes” and “this worked for a full meeting on my hardware” are different statements. PocketMic has enough structure to make the second statement testable, but the first statement should not be inflated into it.

There is one more boundary worth keeping precise. The audio path is LAN-only and has no cloud dependency. The landing page also uses a separate web analytics snippet, so I would keep the product claim focused on the microphone data path rather than casually turning “no cloud” into a blanket claim about every page or every form of telemetry.

## Why this is a good AI-assisted build

The X post thanks ChatGPT, and that is fair. AI assistance is useful here because there are many connected implementation details: Android foreground services, UDP framing, encryption, sequence arithmetic, WinForms audio playback, QR encoding, protocol tests, build scripts, and a marketing page that should not promise more than the binaries prove.

But the valuable part is not asking a model to generate “a wireless microphone app” and accepting the first answer. The useful loop is narrower:

1. define the network and trust boundary;
2. make the packet format inspectable;
3. write small tests around crypto, control messages, and sequence behaviour;
4. run the Android and Windows paths separately;
5. exercise loss, reordering, reconnect, and device failure;
6. keep the release story aligned with what was actually built.

That is the pattern I want from AI-assisted engineering: faster implementation, more explicit checks, and fewer excuses when a claim is not yet proven.

## The practical bottom line

PocketMic LAN is a useful little answer to a cat-sized hardware failure. It turns an Android phone into a private-LAN microphone for Windows, keeps the audio packets authenticated, gives the user QR pairing instead of a wall of setup text, and includes enough diagnostics to investigate the parts that usually fail.

It is not a hardened internet voice service. It is not a signed consumer release yet. It is not a replacement for a good USB microphone in every environment.

It is a focused, open-source build with a clear next proof gate: produce the release artifacts, run the physical matrix, and record what happens on real phones, real Wi-Fi, real Windows outputs, and real meeting software.

For a project that began because the microphone disappeared, that is a pretty good place to be.

## Sources

- [Ryan’s launch post on X](https://x.com/RyanSpice/status/2097543171995566427)
- [PocketMic LAN source repository](https://github.com/ryanspice/pocketmic-lan)
- [PocketMic LAN landing page](https://canopydigital.ca/sites/pocketmic-lan/)
- [Protocol v1](https://github.com/ryanspice/pocketmic-lan/blob/master/pocketmic-lan-v0.1.4/PROTOCOL.md)
- [v0.1.4 changelog](https://github.com/ryanspice/pocketmic-lan/blob/master/pocketmic-lan-v0.1.4/CHANGELOG.md)
- [VB-CABLE](https://vb-audio.com/Cable/)
