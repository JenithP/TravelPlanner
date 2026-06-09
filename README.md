# Triply — AI Travel Booking Experiment

A static, English-language prototype of an online travel-booking site with an AI travel
assistant, built to run a between-subjects experiment on **AI autonomy level**.

## Conditions (randomly assigned)

| Code | Name | Flow |
|------|------|------|
| **C1** | Low AI autonomy | AI assistant **recommends** a stay; the user makes the final choice and books it. |
| **C2** | High AI autonomy | An autonomous AI agent **selects and books** the stay automatically; the user only reviews the result. |
| **C3** | Control (no AI) | No AI. The user **searches, browses, and books** a stay manually. |

All three conditions converge on the same booked stay (**Riverview Stay Hotel**,
$142, non-refundable), then receive the same negative post-booking feedback, then a
debriefing. There is **no survey** — this is the booking experience itself.

## Running

It's a plain static site. Either:

- Double-click `index.html`, **or**
- Serve it (recommended, so image fallbacks behave consistently):
  ```
  python -m http.server 8000
  ```
  then open http://localhost:8000

## Condition assignment

- By default the condition is assigned **at random** on load.
- For testing / piloting, force a condition with a URL query:
  - `index.html?c=1` → C1 (low autonomy)
  - `index.html?c=2` → C2 (high autonomy)
  - `index.html?c=3` → C3 (control)

The assigned condition label is shown on the final debrief screen.

## Flow

1. Consent
2. Travel scenario
3. Confirm conditions
4. **Condition-specific AI / search step** (C1 / C2 / C3)
5. Booking confirmed
6. Negative post-booking feedback (45 min away, stairs/hills, non-refundable)
7. Debriefing → restart

## Images (optional)

The site works **without any images** — every photo falls back to a colored gradient with
the hotel name. To use real photos, drop JPGs into `images/` with these exact names:

| File | Used for |
|------|----------|
| `images/hero.jpg` | Landing hero banner (wide travel photo) |
| `images/riverview.jpg` | Riverview Stay Hotel (the booked stay, all conditions) |
| `images/citycenter.jpg` | City Center Inn (control listing only) |
| `images/hillside.jpg` | Hillside Guesthouse (control listing only) |
| `images/gardenpark.jpg` | Garden Park Hotel (control listing only) |

Recommended size ~800×600 (cards) and ~1200×500 (hero).
