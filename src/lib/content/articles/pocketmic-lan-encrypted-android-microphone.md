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
summary: "A cat-damaged microphone became an Android-to-Windows audio project. Here is how PocketMic LAN pairs, encrypts, buffers, and gets your voice into a meeting."
seo_description: "Turn an Android phone into a Windows microphone with PocketMic LAN. Explore QR pairing, encrypted LAN audio, packet diagrams, setup tips, and a glossary."
accent: "#b88a3b"
image: "https://images.unsplash.com/photo-1599580856824-f5224acb901b?auto=format&fit=crop&w=1600&q=85"
image_alt: "Studio microphone on a stand; an illustrative stock photograph, not PocketMic hardware."
image_credit: "Photo: Cedrik Wesche / Unsplash"
image_source: "https://unsplash.com/photos/black-microphone-on-black-microphone-stand-zn-xrjOKQmc"
image_position: "22% center"
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

> [!status-brief] The short version
>
> Your Android phone captures the sound. PocketMic LAN carries it over your private network to a Windows receiver. A virtual audio cable can then make that sound available as a microphone in your meeting app.
>
> **Start here:** [Project page](https://canopydigital.ca/sites/pocketmic-lan/) · [Source code](https://github.com/ryanspice/pocketmic-lan) · [Setup](#getting-your-voice-into-a-meeting) · [Glossary](#pocket-wiki)

My cat ate my microphone. That is a ridiculous opening for a software project, but it is the one this project got.

I needed a microphone for Zoom meetings. I also had an Android phone: a perfectly useful microphone attached to a small computer with Wi-Fi. PocketMic LAN grew out of connecting that phone to the Windows machine already on my desk.

The [original post on X](https://x.com/RyanSpice/status/2097543171995566427) gives the short origin story, including a thank-you to ChatGPT. This article is the longer version: what the project does, how the audio travels, and why getting a voice across a room involves more than opening a socket.

## A microphone you already own

[PocketMic LAN](https://canopydigital.ca/sites/pocketmic-lan/) is an Android sender and a Windows receiver. The phone captures mono audio; the PC receives, authenticates, decrypts, and plays it through a selected output device.

That last step matters. Sending audio to Windows speakers is useful for checking the connection, but speakers are not a microphone input. To feed a meeting app, the receiver needs an audio route the app can select. A virtual cable supplies that bridge.

The phone-to-PC transport stays on the LAN. There is no cloud relay in that audio path. If you feed the result into Zoom or another online service, that service still handles the meeting audio under its own rules. “Local microphone transport” does not mean “offline meeting.”

## Follow the sound

![PocketMic audio path: Android capture and encryption, private-LAN UDP transport, Windows authentication and buffering, then a virtual cable and meeting app.](/img/articles/pocketmic-audio-path.svg)

*Figure 1. The encrypted transport ends at the Windows receiver. The virtual cable and meeting app are separate parts of the setup.*

The sender packages the microphone signal into **10 ms frames**. Each frame travels as a UDP datagram, with an authenticated header and encrypted audio. The receiver checks it before adding the audio to playback.

There is a reason for sending little pieces frequently. A live microphone is a moving conversation, not a file transfer: an old syllable arriving much later is not automatically useful. The receiver drops older, out-of-order packets instead of waiting indefinitely to reconstruct a perfect recording.

A separate control channel handles discovery, status, and processing settings. Keeping those messages separate makes it easier to explain a failed connection: a receiver that answered with the wrong pairing key is different from a receiver that never answered at all.

The exact fields and sequencing rules are documented in the [versioned protocol](https://github.com/ryanspice/pocketmic-lan/blob/master/pocketmic-lan-v0.1.4/PROTOCOL.md).

## What one packet costs

The audio format is **48 kHz, mono, signed 16-bit PCM**. PCM is uncompressed sample data, so the arithmetic is unusually approachable:

- 48,000 samples per second × 2 bytes = 96,000 audio bytes per second.
- Ten milliseconds contains 480 samples, or **960 bytes of audio**.
- A 24-byte header and 16-byte authentication tag bring each PocketMic datagram to **1,000 bytes**.
- At 100 packets per second, that is **800 kbit/s**, before UDP/IP and network-link overhead.

![Proportional packet chart: 960 bytes of audio, 24 bytes of header, and 16 bytes of authentication tag make a 1000-byte PocketMic datagram.](/img/articles/pocketmic-packet-budget.svg)

*Figure 2. Calculated from the protocol, not a network benchmark. Audio alone is 768 kbit/s; PocketMic framing adds 32 kbit/s. Control traffic and lower-layer overhead are additional.*

That is a deliberate simplicity tradeoff. Uncompressed audio avoids a codec stage, but uses more bandwidth than a compressed voice stream would. It also leaves a clear wire format that someone else can inspect and implement.

## Smooth audio takes a little waiting

Wi-Fi packets do not arrive with a metronome's consistency. The receiver keeps a small reserve of audio before playback starts so an uneven arrival does not immediately become a gap you hear.

The default **prebuffer is 100 ms**, adjustable from **40 to 300 ms**. These are buffer settings, not measurements of total microphone-to-meeting latency. Capture, networking, audio drivers, the virtual cable, and the meeting app can all add delay.

| Receiver behaviour | What it is trying to prevent |
| --- | --- |
| Wait for the prebuffer | Starting playback without enough audio in reserve |
| Conceal gaps of 1–20 frames with a decaying repeat | Turning every short loss into an abrupt crackle |
| Drop older packets | Playing stale speech after the conversation has moved on |
| Clear and prebuffer after larger jumps | Continuing with badly disrupted playback state |
| Trim excess buffered audio during quiet input | Letting delay grow throughout a session |

At the default prebuffer, the high-water mark is 220 ms. It changes with the selected prebuffer; it is not a universal latency target. Loss concealment also cannot recover words that never arrived—it makes a short interruption less abrupt.

For troubleshooting, the useful questions are specific: are packets being lost, arriving late, rejected, or trimmed? Those counters tell a better story than a single green “connected” light.

## Pairing without typing a secret twice

The v0.1.4 source includes QR pairing on the Windows side and a scanner on Android. The phone can pick up the connection details without the ritual of copying an address and key by hand.

The pairing key is sensitive. A pairing QR code is not a harmless screenshot decoration: it carries connection material, including the key. Keep real codes out of public screenshots and screen shares.

For audio, the protocol uses **AES-256-GCM**. This provides encryption and an authentication tag; the receiver can reject packets whose protected content has been altered. The header is authenticated too.

One subtle detail deserves attention: each packet combines a random stream-session identifier with a sequence number to make its nonce. A reconnect keeps the sequence moving. Resetting the counter while reusing the same session and key would repeat a nonce, which is unsafe for GCM.

The key is derived by hashing the pairing phrase with SHA-256. Hashing does not turn a short, guessable phrase into a strong secret. Use a long, randomly generated pairing key, and keep the service on a trusted private LAN. Do not port-forward it onto the internet.

## Getting your voice into a meeting

This is a source-oriented project, so begin with the [repository's current build instructions](https://github.com/ryanspice/pocketmic-lan/tree/master/pocketmic-lan-v0.1.4) and check that the Android and Windows components belong to the same version. The linked source is not a promise of a signed, one-click installer.

1. **Put the phone and PC on the same private network.** Guest-network isolation can prevent devices from talking to each other.
2. **Start the Windows receiver and pair the phone.** Use the QR flow where available, grant microphone permission, and check the receiver address and pairing key.
3. **Allow the receiver through the firewall for the private network.** The default audio port is UDP 49500; the control channel uses the next port, 49501. Scope access to the LAN.
4. **Choose an output route.** Use headphones for a listening check to reduce feedback. For a meeting, a tool such as [VB-CABLE](https://vb-audio.com/Cable/) provides the virtual device pair.
5. **Select the matching microphone in the meeting app.** With VB-CABLE, send PocketMic playback to `CABLE Input`, then select `CABLE Output` as the app's microphone. The names make more sense from the cable's point of view: sound goes into one end and comes out of the other.
6. **Make a short test recording before the call.** Check level, clipping, dropouts, and whether reconnecting restores audio. A moving meter is encouraging; an audible recording is the useful check.

If the phone connects but the meeting hears nothing, inspect that last audio-device pairing before changing network settings. If discovery fails, check the network, firewall, and key first.

## Pocket wiki

A small reference shelf for the terms above. Follow the links for implementation details or the underlying specification.

| Term | In plain English | Read more |
| --- | --- | --- |
| LAN | The local network between the phone and PC—not the meeting service on the internet. | [Project overview](https://canopydigital.ca/sites/pocketmic-lan/) |
| PCM16 | Audio represented as signed 16-bit samples rather than a compressed voice format. | [Audio format](https://github.com/ryanspice/pocketmic-lan/blob/master/pocketmic-lan-v0.1.4/PROTOCOL.md#audio) |
| UDP datagram | One independently sent message; delivery and ordering are not guaranteed. | [UDP specification, RFC 768](https://www.rfc-editor.org/rfc/rfc768) |
| AES-GCM | Authenticated encryption: confidentiality plus a check against tampering. | [NIST GCM specification](https://csrc.nist.gov/pubs/sp/800/38/d/final) |
| Nonce | A value that must not repeat with the same GCM key. | [PocketMic encryption rules](https://github.com/ryanspice/pocketmic-lan/blob/master/pocketmic-lan-v0.1.4/PROTOCOL.md#encryption) |
| Prebuffer | Audio held in reserve before playback to absorb uneven packet arrivals. | [Receiver sequencing policy](https://github.com/ryanspice/pocketmic-lan/blob/master/pocketmic-lan-v0.1.4/PROTOCOL.md#receiver-sequencing-policy) |
| Virtual audio cable | A software connection between one app's output and another app's input. | [VB-CABLE](https://vb-audio.com/Cable/) |

## Where the project stands

The v0.1.4 tree contains the Android sender, Windows receiver, protocol documentation, QR pairing, diagnostics, and verification tools. Its [changelog](https://github.com/ryanspice/pocketmic-lan/blob/master/pocketmic-lan-v0.1.4/CHANGELOG.md) reports 74 passing Windows tests. That is a project-reported result, not an independent hardware test performed for this article.

The remaining acceptance test is wonderfully ordinary: a real phone, a real Windows machine, the intended audio route, and a full meeting-length session. Sleep and wake, reconnects, device changes, and a busy Wi-Fi network all deserve time in that test. This article does not claim those scenarios have passed.

What I like about this project is its size. It starts with a broken microphone and ends with a system small enough to follow: capture, encrypt, send, authenticate, buffer, play. The details are real engineering work, but the point is still simple—use the microphone already in your pocket.

[Explore PocketMic LAN](https://canopydigital.ca/sites/pocketmic-lan/) or [read the source](https://github.com/ryanspice/pocketmic-lan). And perhaps keep the next microphone somewhere the cat cannot reach.
