"""AI se notification padhna - last date, post, vacancy nikalna.
Suraksha: AI ki likhi date tabhi maani jaati hai jab wahi tareekh notification ke text me
sach me likhi ho (hum khud check karte hain). Warna date khali rehti hai - galat date nahi dikhegi.
"""
import json, os, re, time, urllib.request, urllib.error
from datetime import date
from html.parser import HTMLParser

MONTHS = {m: i + 1 for i, m in enumerate("jan feb mar apr may jun jul aug sep oct nov dec".split())}


def find_date(text):
    """Text me se pehli saaf tareekh -> 'YYYY-MM-DD' ya None."""
    t = (text or "").lower()
    m = re.search(r"(\d{1,2})\s*[/.\-]\s*(\d{1,2})\s*[/.\-]\s*(\d{2,4})", t)
    cand = None
    if m:
        cand = (int(m.group(3)), int(m.group(2)), int(m.group(1)))
    else:
        m = re.search(r"(\d{1,2})(?:st|nd|rd|th)?[\s,\-]+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?[\s,\-]+(\d{4})", t)
        if m:
            cand = (int(m.group(3)), MONTHS[m.group(2)], int(m.group(1)))
        else:
            m = re.search(r"(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})", t)
            if m:
                cand = (int(m.group(3)), MONTHS[m.group(1)], int(m.group(2)))
    if not cand:
        return None
    y, mo, d = cand
    y = y + 2000 if y < 100 else y
    try:
        return date(y, mo, d).isoformat()
    except ValueError:
        return None


class _Text(HTMLParser):
    def __init__(self):
        super().__init__()
        self.out, self.skip = [], 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "noscript", "svg"):
            self.skip += 1
        if tag in ("p", "br", "tr", "li", "div", "h1", "h2", "h3", "td"):
            self.out.append(" ")

    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript", "svg") and self.skip:
            self.skip -= 1

    def handle_data(self, d):
        if not self.skip:
            self.out.append(d)


def html_to_text(html):
    p = _Text()
    try:
        p.feed(html)
    except Exception:
        pass
    return re.sub(r"\s+", " ", "".join(p.out)).strip()


def pdf_to_text(raw):
    try:
        from pypdf import PdfReader
        import io
        r = PdfReader(io.BytesIO(raw))
        return re.sub(r"\s+", " ", " ".join((pg.extract_text() or "") for pg in r.pages[:6])).strip()
    except Exception:
        return ""


def norm(s):
    return re.sub(r"\s+", " ", (s or "").lower()).strip()


PROMPT = """You read an Indian government recruitment notification (text below).
Reply with ONLY a JSON object:
{"is_recruitment": true/false,
 "last_date_text": "the EXACT words/date copied from the text for the last date to apply, or null",
 "last_date": "YYYY-MM-DD or null",
 "org": "recruiting organisation (max 60 chars) or null",
 "posts": "post names (max 100 chars) or null",
 "vacancies": integer or null,
 "qualification": "minimum qualification (max 80 chars) or null"}
Rules: use ONLY what is written in the text. Never guess. If the last date to APPLY is not clearly written, use null.
Do not use exam dates, result dates or notification dates as last date.

TEXT:
"""


def ask_gemini(text):
    key = os.environ.get("GEMINI_API_KEY", "")
    if not key:
        return None
    model = os.environ.get("GEMINI_MODEL") or "gemini-2.5-flash"
    base = os.environ.get("GEMINI_BASE", "https://generativelanguage.googleapis.com")
    url = "%s/v1beta/models/%s:generateContent" % (base, model)
    body = json.dumps({
        "contents": [{"parts": [{"text": PROMPT + text[:12000]}]}],
        "generationConfig": {"temperature": 0, "responseMimeType": "application/json"},
    }).encode()
    for attempt in range(2):
        req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json", "x-goog-api-key": key})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                data = json.loads(r.read().decode())
            txt = data["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(txt)
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 503) and attempt == 0:
                time.sleep(12)
                continue
            raise
    return None


def short(v, n):
    if not isinstance(v, str):
        return None
    v = re.sub(r"\s+", " ", v).strip()[:n]
    return v or None


def verified_last_date(ai, page_text, today):
    """AI ki date tabhi sahi jab (1) likha hua text page me sach me hai, (2) usse hamari
    khud ki nikali date AI ki date se milti hai, (3) date samajh me aane layak saal me hai."""
    lt, ld = ai.get("last_date_text"), ai.get("last_date")
    if not isinstance(lt, str) or not isinstance(ld, str):
        return None
    if norm(lt) not in norm(page_text):
        return None
    mine = find_date(lt)
    if not mine or mine != ld:
        return None
    if not (today.year - 1 <= int(mine[:4]) <= today.year + 1):
        return None
    return mine
