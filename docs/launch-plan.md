# Domino — Launch Plan

## Pre-Launch Checklist

- [ ] Record a 30-second screen capture GIF of the web dashboard
  - Open http://localhost:3000
  - Click through scenarios (Hormuz → Dollar → AI → Pandemic)
  - Enter profile values, hit "SIMULATE CASCADE"
  - Show the impact numbers appearing
  - Use [ScreenToGif](https://www.screentogif.com/) or [LICEcap](https://www.cockos.com/licecap/)
  - Save as `web/public/demo.gif` and update README

- [ ] Create GitHub repository (public, MIT license)
- [ ] Push code to GitHub
- [ ] Verify README renders correctly on GitHub
- [ ] Verify Quick Start instructions work on a clean clone

## Day 1 Launch: Hacker News

**Timing:** Tuesday-Thursday, 8-10 AM EST (15:00-17:00 Turkey time)

**Title options (pick one):**
- "Show HN: Domino – See how the Iran war cascades into your grocery bill"
- "Show HN: I built an engine that models how global crises hit your wallet"
- "Show HN: Domino – From the Strait of Hormuz to your kitchen table"

**Post text:**
```
I was frustrated that I read 50 news articles a day about the Iran war, oil prices, 
and the dollar crisis, but still had no idea what it actually meant for MY finances.

So I built Domino — an open-source cascading impact engine. You give it a global event 
(war, pandemic, currency crash) and it models the full domino chain down to your 
personal monthly cost.

Example: "Strait of Hormuz blocked" → 15-step cascade → your grocery bill +18% 
within 90 days, fuel +35% within 7 days.

Built with Python, FastAPI, Next.js. Free data from NewsMCP, GDELT, World Bank. 
AI-powered cascade generation via Ollama (local, free).

https://github.com/h4n0m4n/domino
```

## Day 1 Launch: Reddit

Post to (in order):
1. r/dataisbeautiful — Screenshot of the cascade visualization
2. r/economics — "How the Hormuz crisis cascades into household budgets"
3. r/Python — "Open-source cascade simulation engine in Python"
4. r/geopolitics — "Modeling personal impact of the Iran conflict"
5. r/webdev — "Built a crisis impact dashboard with Next.js"

## Day 1 Launch: Twitter/X

**Thread format:**
```
Thread: I built an open-source engine that shows how global crises 
cascade into your daily life.

The Iran war blocked the Strait of Hormuz on Feb 28.

Here's the 15-step domino chain from that event to your kitchen table:

[Screenshot of cascade]

1/ Hormuz blocked → 90% of tanker traffic stops
2/ Global oil supply drops 8M barrels/day
3/ Brent crude surges to $119/barrel (+40%)
...
14/ Bread prices +18%
15/ YOUR grocery bill: +₺1,440/month

Total personal hit: ₺+4,890/month

It's open source. You can:
- Run it with YOUR numbers
- Create scenarios for YOUR country
- Use AI to generate cascades from any event

GitHub: [link]
```

## Week 1: Follow-Up

- Respond to ALL GitHub issues within 24 hours
- Post results/metrics on Twitter
- Write a dev.to or Medium article: "How I built a cascading crisis simulator"
- Submit to Product Hunt

## Key Metrics to Track

- GitHub stars (target: 100 first day, 1,000 first week)
- Hacker News points
- Twitter engagement
- Clone/fork count
- Issue/PR activity
