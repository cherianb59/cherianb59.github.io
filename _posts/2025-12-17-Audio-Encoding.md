---
layout: post
title: Audio Encoding
description: Digitising audio
date: 2025-12-17 11:12:30 +1000
tags: Life
---

### What is sound?

Sound is vibration moving through a medium, usually air. When something vibrates, it pushes and pulls nearby air molecules, creating pressure waves that travel outward. Your ears detect those pressure changes and your brain turns them into music, speech.

To store sound on a computer, we take these smooth, continuous waves and turn them into numbers. This process is called **digital audio encoding**. Once sound becomes numbers, it can be copied, edited, streamed, compressed by a computer.

---

### Bit depth and sample rate

Digitising is taking something continous and making it discrete. Digitising audio this is dominated by two core ideas: how often we measure the sound, and how precise each measurement is. For audio this would be sample rate and bit depth. For video it is fps and resolution.

#### Sample rate

The sample rate is how often the audio signal is measured per second, it's like taking snapshots of a moving wave.

Common sample rates include:

- **8 kHz** – Telephone quality, just enough for intelligible speech  
- **22 kHz** – Early digital audio and low bandwidth applications  
- **44.1 kHz** – CD quality, still the most common for music  
- **48 kHz** – Standard for video and broadcast  

A sample rate of 2*n Hz will be able to capture an frequency of up to n Hz. This is why an 8kHz sample rate will sound bad, it can only record sounds up to 4 kHz in frequency.

---

### Bit depth

Bit depth describes how detailed each individual sample is. If sample rate is how often you measure, bit depth is how finely you measure.

Common bit depths:

- **8-bit** – Very low resolution, audible noise and distortion  
- **16-bit** – CD quality, enough dynamic range for most listening  
- **24-bit** – Studio standard, more headroom and lower noise  
- **32-bit (float)** – Used internally in audio software, very forgiving for processing

Higher bit depth means a wider dynamic range and less quantisation noise. It does not make things louder by itself, it makes quiet details cleaner and mixing mistakes less painful.

---

### Compression

Raw digital audio files are large. Very large. A few minutes of uncompressed stereo audio can easily weigh in at tens of megabytes. Compression exists to reduce file size while trying not to annoy listeners.

There are two broad families of audio compression: **lossless** and **lossy**.

---

#### FLAC and ALAC

These are **lossless** formats. They reduce file size without throwing away any audio information.

- **FLAC** stands for Free Lossless Audio Codec  
- **ALAC** is Apple Lossless Audio Codec  

When decoded, the audio is bit-for-bit identical to the original. Think zip files, but for sound. Ideal for archiving, editing, and people who like knowing nothing was sacrificed.

---

#### MP3, Ogg, AAC

These are **lossy** formats. They reduce size by removing information that is considered less audible to humans.

A brief history:

- **MP3** dominated the early internet era. Portable players, file sharing, and questionable rips all lived here.
- **Ogg Vorbis** was created as a free alternative, avoiding patents and licensing issues. No one uses this.
- **AAC** improved on MP3 and became widely used by Apple, YouTube, and streaming services.

Modern implementations of AAC and Ogg can sound excellent at modest bitrates. MP3 still works, but it shows its age.

---

#### Opus

**Opus** is the modern multitool of audio codecs.

It handles speech and music, scales well from very low to high bitrates, and performs beautifully for real-time communication. Voice chat, streaming, conferencing, and gaming all benefit from Opus. It is efficient, flexible, and good, it was released in 2012.

---

#### ML audio codecs

Machine learning has entered the chat.

**ML-based codecs**, such as **TSAC**, use neural networks to model how audio behaves and how humans perceive it. Instead of hand-crafted rules, they learn patterns from large datasets.

These codecs promise higher quality at lower bitrates, but they come with trade-offs: higher computational cost, hardware dependence, and complexity. Still early days, but the direction is clear. Audio compression is learning to listen.

Meta has created a codec called encoder which . As the owner of messenger and whatsapp Meta have a large incentive to compress audio at a high quality.

---

### Table 

| Audio format | Bit depth | Sampling rate | Bit rate | Computation | Link |
| ------------ | --------- | ------------- | -------- | ----------- | ---- |
| PCM          | 8 bit     | 8 kHz         |          |             |      |
| PCM          | 8 bit     | 11 kHz        |          |             |      |
| PCM          | 8 bit     | 24 kHz        |          |             |      |
| PCM          | 8 bit     | 48 kHz        |          |             |      |
| PCM          | 16 bit    | 8 kHz         |          |             |      |
| PCM          | 16 bit    | 11 kHz        |          |             |      |
| PCM          | 16 bit    | 24 kHz        |          |             |      |
| PCM          | 16 bit    | 48 kHz        |          |             |      |
| PCM          | 24 bit    | 8 kHz         |          |             |      |
| PCM          | 24 bit    | 11 kHz        |          |             |      |
| PCM          | 24 bit    | 24 kHz        |          |             |      |
| PCM          | 24 bit    | 48 kHz        |          |             |      |
| FLAC         | 8 bit     | 8 kHz         |          |             |      |
| FLAC         | 8 bit     | 11 kHz        |          |             |      |
| FLAC         | 8 bit     | 24 kHz        |          |             |      |
| FLAC         | 8 bit     | 48 kHz        |          |             |      |
| FLAC         | 16 bit    | 8 kHz         |          |             |      |
| FLAC         | 16 bit    | 11 kHz        |          |             |      |
| FLAC         | 16 bit    | 24 kHz        |          |             |      |
| FLAC         | 16 bit    | 48 kHz        |          |             |      |
| FLAC         | 24 bit    | 8 kHz         |          |             |      |
| FLAC         | 24 bit    | 11 kHz        |          |             |      |
| FLAC         | 24 bit    | 24 kHz        |          |             |      |
| FLAC         | 24 bit    | 48 kHz        |          |             |      |
| MP3          | 8 bit     | 8 kHz         |          |             |      |
| MP3          | 8 bit     | 11 kHz        |          |             |      |
| MP3          | 8 bit     | 24 kHz        |          |             |      |
| MP3          | 8 bit     | 48 kHz        |          |             |      |
| MP3          | 16 bit    | 8 kHz         |          |             |      |
| MP3          | 16 bit    | 11 kHz        |          |             |      |
| MP3          | 16 bit    | 24 kHz        |          |             |      |
| MP3          | 16 bit    | 48 kHz        |          |             |      |
| MP3          | 24 bit    | 8 kHz         |          |             |      |
| MP3          | 24 bit    | 11 kHz        |          |             |      |
| MP3          | 24 bit    | 24 kHz        |          |             |      |
| MP3          | 24 bit    | 48 kHz        |          |             |      |
| Ogg          | 8 bit     | 8 kHz         |          |             |      |
| Ogg          | 8 bit     | 11 kHz        |          |             |      |
| Ogg          | 8 bit     | 24 kHz        |          |             |      |
| Ogg          | 8 bit     | 48 kHz        |          |             |      |
| Ogg          | 16 bit    | 8 kHz         |          |             |      |
| Ogg          | 16 bit    | 11 kHz        |          |             |      |
| Ogg          | 16 bit    | 24 kHz        |          |             |      |
| Ogg          | 16 bit    | 48 kHz        |          |             |      |
| Ogg          | 24 bit    | 8 kHz         |          |             |      |
| Ogg          | 24 bit    | 11 kHz        |          |             |      |
| Ogg          | 24 bit    | 24 kHz        |          |             |      |
| Ogg          | 24 bit    | 48 kHz        |          |             |      |
| AAC          | 8 bit     | 8 kHz         |          |             |      |
| AAC          | 8 bit     | 11 kHz        |          |             |      |
| AAC          | 8 bit     | 24 kHz        |          |             |      |
| AAC          | 8 bit     | 48 kHz        |          |             |      |
| AAC          | 16 bit    | 8 kHz         |          |             |      |
| AAC          | 16 bit    | 11 kHz        |          |             |      |
| AAC          | 16 bit    | 24 kHz        |          |             |      |
| AAC          | 16 bit    | 48 kHz        |          |             |      |
| AAC          | 24 bit    | 8 kHz         |          |             |      |
| AAC          | 24 bit    | 11 kHz        |          |             |      |
| AAC          | 24 bit    | 24 kHz        |          |             |      |
| AAC          | 24 bit    | 48 kHz        |          |             |      |
| Opus         | 8 bit     | 8 kHz         |          |             |      |
| Opus         | 8 bit     | 11 kHz        |          |             |      |
| Opus         | 8 bit     | 24 kHz        |          |             |      |
| Opus         | 8 bit     | 48 kHz        |          |             |      |
| Opus         | 16 bit    | 8 kHz         |          |             |      |
| Opus         | 16 bit    | 11 kHz        |          |             |      |
| Opus         | 16 bit    | 24 kHz        |          |             |      |
| Opus         | 16 bit    | 48 kHz        |          |             |      |
| Opus         | 24 bit    | 8 kHz         |          |             |      |
| Opus         | 24 bit    | 11 kHz        |          |             |      |
| Opus         | 24 bit    | 24 kHz        |          |             |      |
| Opus         | 24 bit    | 48 kHz        |          |             |      |
| Codec2       | 8 bit     | 8 kHz         |          |             |      |
| Codec2       | 8 bit     | 11 kHz        |          |             |      |
| Codec2       | 8 bit     | 24 kHz        |          |             |      |
| Codec2       | 8 bit     | 48 kHz        |          |             |      |
| Codec2       | 16 bit    | 8 kHz         |          |             |      |
| Codec2       | 16 bit    | 11 kHz        |          |             |      |
| Codec2       | 16 bit    | 24 kHz        |          |             |      |
| Codec2       | 16 bit    | 48 kHz        |          |             |      |
| Codec2       | 24 bit    | 8 kHz         |          |             |      |
| Codec2       | 24 bit    | 11 kHz        |          |             |      |
| Codec2       | 24 bit    | 24 kHz        |          |             |      |
| Codec2       | 24 bit    | 48 kHz        |          |             |      |
| Encoder      | 8 bit     | 8 kHz         |          |             |      |
| Encoder      | 8 bit     | 11 kHz        |          |             |      |
| Encoder      | 8 bit     | 24 kHz        |          |             |      |
| Encoder      | 8 bit     | 48 kHz        |          |             |      |
| Encoder      | 16 bit    | 8 kHz         |          |             |      |
| Encoder      | 16 bit    | 11 kHz        |          |             |      |
| Encoder      | 16 bit    | 24 kHz        |          |             |      |
| Encoder      | 16 bit    | 48 kHz        |          |             |      |
| Encoder      | 24 bit    | 8 kHz         |          |             |      |
| Encoder      | 24 bit    | 11 kHz        |          |             |      |
| Encoder      | 24 bit    | 24 kHz        |          |             |      |
| Encoder      | 24 bit    | 48 kHz        |          |             |      |

### Postscript

I think the evolution in digital audio compression is amazing. In the 80s PCM was all that was available, and space was at a premium. MP3 codec revolutionzed music, a CD could hold 74 minutes, using PCM. FLAC would double that duration. A CD of MP3s could hold about 6-10 times that . Opus is and now these ML encoders make that 75 times as long.