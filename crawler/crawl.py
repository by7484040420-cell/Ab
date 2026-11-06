#!/usr/bin/env python3
"""NaradSearch crawler v2 - GitHub Actions par chalta hai (sirf Python standard library).

1. sources.json (110 sarkari site) + my_sites.json (aapki apni sites) ke page padhta hai
2. bharti / admit card / result ke naye link jodta hai
3. AI (Gemini) naye jobs ki notification padh kar last date, post, vacancy nikalta hai
   (date tabhi jab notification ke text me sach me likhi ho)
4. Jis job ki last date nikal gayi - AUTOMATIC delete. Purani / hat chuki entries bhi delete.
5. data/manual_jobs.json me haath se likhi jobs bhi shamil hoti hain (wo bhi date par delete)
"""
import hashlib, json, os, re, sys, time, urllib.request, urllib.error, urllib.robotparser
from datetime import date, datetime, timedelta, timezone
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import enrich

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
SOURCES = os.environ.get("SOURCES", P("crawler", "sources.json"))
MY_SITES = os.environ.get("MY_SITES", P("crawler", "my_sites.json"))
MANUAL = os.environ.get("MANUAL", P("data", "manual_jobs.json"))
DEAD = os.environ.get("DEAD", P("data", "dead.json"))
OUT_JOBS = os.environ.get("OUT_JOBS", P("docs", "jobs.json"))
OUT_STATUS = os.environ.get("OUT_STATUS", P("docs", "status.json"))
DELAY = float(os.environ.get("DELAY", "2"))
AI_DELAY = float(os.environ.get("AI_DELAY", "5"))
AI_MAX = int(os.environ.get("AI_MAX", "40"))

NO_DATE_DAYS = 30      # jis job/news ki date nahi mili, itne din baad hata do
GONE_DAYS = 21         # site se itne din gayab rahe to hata do
DEAD_KEEP_DAYS = 120   # hata hui entry itne din yaad rakho (wapas na judne ke liye)
MAX_ITEMS = 5000
PER_SOURCE = 60
PER_SOURCE_ALL = 150
MAX_BYTES = 2_000_000
repo = os.environ.get("GITHUB_REPOSITORY", "")
UA = "NaradSearchBot/1.0 (sarkari info search; +https://github.com/%s)" % repo

KIND = [
    ("admit", re.compile(r"admit card|hall ticket|call letter|e-?admit|प्रवेश पत्र|एडमिट कार्ड|प्रवेश-पत्र", re.I)),
    ("result", re.compile(r"result|merit list|cut ?-?off|answer key|score ?card|final list|परिणाम|रिजल्ट|उत्तर ?कुंजी|मेरिट", re.I)),
    ("job", re.compile(r"recruitment|vacanc|notification|advertisement|\badvt\b|apply online|online form|walk[- ]in|bharti|bharty|"
                       r"भर्ती|विज्ञापन|अधिसूचना|रिक्ति|आवेदन", re.I)),
]
NOISE = re.compile(r"tender|\brti\b|contact us|about us|privacy|disclaimer|sitemap|screen reader|skip to|feedback|"
                   r"\blogin\b|sign ?in|register now|archive|annual report|gallery|press release|निविदा|"
                   r"\bhome\b|syllabus pdf|telegram|whatsapp|youtube|follow us|download app", re.I)
LAST = re.compile(r"(?:last date|closing date|last day|अंतिम तिथि|अन्तिम तिथि)[^0-9]{0,25}(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})", re.I)


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links, self._href, self._buf, self._skip = [], None, [], 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "noscript"):
            self._skip += 1
        if tag == "a":
            self._href = dict(attrs).get("href")
            self._buf = []

    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript") and self._skip:
            self._skip -= 1
        if tag == "a" and self._href is not None:
            self.links.append((self._href, re.sub(r"\s+", " ", "".join(self._buf)).strip()))
            self._href = None

    def handle_data(self, data):
        if self._href is not None and not self._skip:
            self._buf.append(data)


def fetch_bytes(url, limit=MAX_BYTES):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,application/pdf,*/*;q=0.8", "Accept-Language": "en-IN,hi;q=0.8"})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read(limit), r.headers.get("Content-Type", "")


def decode(raw, ctype):
    m = re.search(r"charset=([\w-]+)", ctype, re.I)
    enc = m.group(1) if m else None
    if not enc:
        mb = re.search(rb"charset=[\"']?([\w-]+)", raw[:2000])
        enc = mb.group(1).decode() if mb else "utf-8"
    try:
        return raw.decode(enc, errors="replace")
    except LookupError:
        return raw.decode("utf-8", errors="replace")


_robots = {}


def robots_ok(url):
    p = urlparse(url)
    host = "%s://%s" % (p.scheme, p.netloc)
    if host not in _robots:
        rp = None
        try:
            raw, ct = fetch_bytes(host + "/robots.txt", 200_000)
            txt = decode(raw, ct)
            if "<html" not in txt[:500].lower():
                rp = urllib.robotparser.RobotFileParser()
                rp.parse(txt.splitlines())
        except Exception:
            rp = None
        _robots[host] = rp
    rp = _robots[host]
    return True if rp is None else rp.can_fetch(UA, url)


def valid_date(d, m, y):
    y = int(y)
    y = y + 2000 if y < 100 else y
    try:
        return date(y, int(m), int(d)).isoformat()
    except ValueError:
        return None


def same_family(link_host, src_host):
    lh, sh = link_host.lower().removeprefix("www."), src_host.lower().removeprefix("www.")
    if lh.endswith(sh) or sh.endswith(lh):
        return True
    return lh.endswith(".gov.in") or lh.endswith(".nic.in") or lh.endswith(".ac.in")


def classify(text):
    for kind, rx in KIND:
        if rx.search(text):
            return kind
    return None


def extract(src, html):
    p = Links()
    try:
        p.feed(html)
    except Exception:
        pass
    host = urlparse(src["url"]).netloc
    mode_all = src.get("mode") == "all"
    cap = PER_SOURCE_ALL if mode_all else PER_SOURCE
    found, seen = [], set()
    for href, text in p.links:
        if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
            continue
        if not (12 <= len(text) <= 220) or NOISE.search(text):
            continue
        kind = classify(text)
        weak = False
        if not kind:
            # aapki apni site (mode=all): titles me keyword na ho to bhi saal wale links lo, AI baad me jaanchega
            if mode_all and re.search(r"20\d\d", text):
                kind, weak = "job", True
            else:
                continue
        url = urljoin(src["url"], href.strip())
        u = urlparse(url)
        if u.scheme not in ("http", "https") or not same_family(u.netloc, host):
            continue
        if url in seen:
            continue
        seen.add(url)
        m = LAST.search(text)
        it = {"title": text, "url": url, "source": src["name"], "kind": kind, "last_date": valid_date(*m.groups()) if m else None}
        if weak:
            it["weak"] = True
        found.append(it)
        if len(found) >= cap:
            break
    return found


def load_json(path, default):
    try:
        return json.load(open(path, encoding="utf-8"))
    except Exception:
        return default


def make_id(url, title):
    return hashlib.sha1((url + "|" + title).encode()).hexdigest()[:12]


def run_ai(old, dead, today):
    """Naye jobs (jinki date nahi hai) ki notification AI se padhwao."""
    if not os.environ.get("GEMINI_API_KEY"):
        print("AI: GEMINI_API_KEY nahi hai - AI step chhoda")
        return 0
    def alive(x):  # jo cleanup me hatne wali hai uspar AI ka call mat kharch karo
        return (today - date.fromisoformat(x["first_seen"])).days <= NO_DATE_DAYS and (today - date.fromisoformat(x["last_seen"])).days <= GONE_DAYS
    queue = [x for x in old.values() if x["kind"] == "job" and not x.get("last_date") and not x.get("ai_tried") and x["source"] != "Manual" and alive(x)]
    queue.sort(key=lambda x: x["first_seen"], reverse=True)
    done = 0
    for it in queue[:AI_MAX]:
        it["ai_tried"] = today.isoformat()
        try:
            if not robots_ok(it["url"]):
                continue
            raw, ct = fetch_bytes(it["url"], 3_000_000)
            if "pdf" in ct.lower() or it["url"].lower().split("?")[0].endswith(".pdf"):
                text = enrich.pdf_to_text(raw)
            else:
                text = enrich.html_to_text(decode(raw, ct))
            if len(text) < 200:
                continue
            ai = enrich.ask_gemini(text)
            if not isinstance(ai, dict):
                continue
            if it.get("weak") and ai.get("is_recruitment") is False:
                dead[it["id"]] = today.isoformat()
                it["_drop"] = True
                continue
            ld = enrich.verified_last_date(ai, text, today)
            if ld:
                it["last_date"] = ld
            for k, n in (("org", 60), ("posts", 100), ("qualification", 80)):
                v = enrich.short(ai.get(k), n)
                if v:
                    it[k] = v
            if isinstance(ai.get("vacancies"), int) and 0 < ai["vacancies"] < 10_000_000:
                it["vacancies"] = ai["vacancies"]
            it["ai"] = True
            done += 1
            print("AI ok  %-9s %s" % (it.get("last_date") or "no-date", it["title"][:60]), flush=True)
        except Exception as e:
            print("AI fail", type(e).__name__, str(e)[:80], "|", it["title"][:50], flush=True)
        time.sleep(AI_DELAY)
    return done


def main():
    today = date.today()
    iso_today = today.isoformat()
    sources = load_json(SOURCES, {"sources": []})["sources"]
    mine = []
    for s in load_json(MY_SITES, {"sites": []}).get("sites", []):
        for u in (s.get("urls") or ([s["url"]] if s.get("url") else [])):
            mine.append({"name": s.get("name") or urlparse(u).netloc, "url": u, "mode": s.get("mode", "all")})
    srcs = mine + [s for s in sources if s["url"] not in {m["url"] for m in mine}]

    old = {x["id"]: x for x in load_json(OUT_JOBS, {}).get("items", [])}
    dead = load_json(DEAD, {})
    status, new_count = [], 0

    for i, s in enumerate(srcs):
        st = {"name": s["name"], "url": s["url"], "status": "ok", "count": 0}
        try:
            if not robots_ok(s["url"]):
                st["status"] = "robots"
            else:
                raw, ct = fetch_bytes(s["url"])
                items = extract(s, decode(raw, ct))
                st["count"] = len(items)
                for it in items:
                    iid = it["id"] = make_id(it["url"], it["title"])
                    if iid in dead:
                        continue
                    if it["last_date"] and it["last_date"] < iso_today:
                        dead[iid] = iso_today           # date nikal chuki - judega hi nahi
                        continue
                    if iid in old:
                        old[iid]["last_seen"] = iso_today
                        if it["last_date"]:
                            old[iid]["last_date"] = it["last_date"]
                    else:
                        it["first_seen"] = it["last_seen"] = iso_today
                        old[iid] = it
                        new_count += 1
                if not items:
                    st["status"] = "empty"
        except urllib.error.HTTPError as e:
            st["status"], st["error"] = "fail", "HTTP %s" % e.code
        except Exception as e:
            st["status"], st["error"] = "fail", type(e).__name__ + ": " + str(e)[:100]
        status.append(st)
        print("%3d/%d %-6s %3d  %s" % (i + 1, len(srcs), st["status"], st["count"], s["name"]), flush=True)
        time.sleep(DELAY)

    # haath se likhi jobs (data/manual_jobs.json)
    for m in load_json(MANUAL, {"jobs": []}).get("jobs", []):
        try:
            title, url, ld = m["title"].strip(), m["url"].strip(), m["last_date"]
            if not (title and url.startswith("http") and re.fullmatch(r"\d{4}-\d{2}-\d{2}", ld)):
                continue
            iid = make_id(url, title)
            if iid in dead:
                continue
            it = old.get(iid) or {"id": iid, "first_seen": iso_today}
            it.update({"title": title, "url": url, "source": "Manual", "kind": m.get("kind", "job"), "last_date": ld, "last_seen": iso_today})
            for k, n in (("org", 60), ("posts", 100), ("qualification", 80)):
                v = enrich.short(m.get(k), n)
                if v:
                    it[k] = v
            old[iid] = it
        except Exception:
            continue

    ai_done = run_ai(old, dead, today)

    # ---- automatic safai: date nikal gayi / bahut purani / site se hat gayi ----
    keep, removed = [], {"date": 0, "old": 0, "gone": 0, "ai": 0}
    for x in old.values():
        if x.get("_drop"):
            removed["ai"] += 1
            continue
        why = None
        ld = x.get("last_date")
        age = (today - date.fromisoformat(x["first_seen"])).days
        gone = (today - date.fromisoformat(x["last_seen"])).days
        if ld and ld < iso_today:
            why = "date"
        elif not ld and age > NO_DATE_DAYS:
            why = "old"
        elif gone > GONE_DAYS:
            why = "gone"
        if why:
            removed[why] += 1
            dead[x["id"]] = iso_today
        else:
            keep.append(x)
    cutoff = (today - timedelta(days=DEAD_KEEP_DAYS)).isoformat()
    dead = {k: v for k, v in dead.items() if v >= cutoff}

    keep.sort(key=lambda x: (x["first_seen"], x["id"]), reverse=True)
    keep = keep[:MAX_ITEMS]
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    for path in (OUT_JOBS, OUT_STATUS, DEAD):
        os.makedirs(os.path.dirname(path), exist_ok=True)
    json.dump({"updated": now, "count": len(keep), "items": keep}, open(OUT_JOBS, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    ok = sum(1 for x in status if x["status"] == "ok")
    json.dump({"updated": now, "ok": ok, "total": len(status), "new": new_count, "ai_read": ai_done, "removed": removed, "sources": status},
              open(OUT_STATUS, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(dead, open(DEAD, "w", encoding="utf-8"), separators=(",", ":"))
    print("Done: %d items | %d naye | AI ne %d padhe | hataye: %s | %d/%d sites theek" % (len(keep), new_count, ai_done, removed, ok, len(status)))
    if ok == 0:
        sys.exit("Koi site nahi chali - network check karein")


if __name__ == "__main__":
    main()
