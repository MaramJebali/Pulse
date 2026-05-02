#!/usr/bin/env python3
"""
Instagram Academic Research Pipeline — Scrapfly + Scrapling Edition
=====================================================================
Replaces Apify entirely. Uses:
  • Scrapfly  — anti-bot bypass (TLS fingerprint, residential proxies, ASP)
  • Scrapling — robust JSON/HTML parsing
  • NVIDIA NIM — multimodal LLM judge (free, vision)
  • Groq      — text-only LLM fallback (free, fast)

WHY NOT APIFY:
  Both apify/instagram-comment-scraper and apify/instagram-scraper
  hard-stop pagination at 15 comments on the free plan:
    "stopping pagination: user is on free plan {hasPaginationToken:true}"
  This is baked into the Apify platform itself — no actor switch fixes it.

WHY SCRAPFLY WORKS:
  1. TLS fingerprinting: Python requests has a detectable TLS signature.
     Instagram blocks it immediately. Scrapfly rotates Chrome-level TLS.
  2. IP blocking: Datacenter IPs (any server/VM) are instantly banned.
     Scrapfly routes through residential IPs.
  3. ASP bypass: asp=True handles Meta's bot detection automatically.
  4. WE OWN THE PAGINATION LOOP — no third party can cap us at 15.

DOC_ID NOTE:
  Instagram rotates GraphQL doc_id values every 2-4 weeks.
  If you get 400/401 errors, update the constants below by inspecting
  Chrome DevTools > Network > XHR while browsing Instagram normally.

Usage:
    python instagram_research_pipeline.py \
        --user gooba_official \
        --topic "Rollo snack campaign" \
        --hours 24 \
        --scrapfly-key YOUR_KEY \
        --nvidia-key YOUR_KEY \
        --output results.json

Requirements:
    pip install scrapfly-sdk scrapling openai groq python-dotenv
"""

import argparse
import json
import logging
import os
import sys
import time
import urllib.parse
from datetime import datetime, timezone, timedelta
from typing import Optional

from scrapfly import ScrapflyClient, ScrapeConfig
from scrapling import Selector
from openai import OpenAI
from groq import Groq
from dotenv import load_dotenv

# ─────────────────────────────────────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("ig_pipeline")

# ─────────────────────────────────────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────────────────────────────────────

# ── Instagram GraphQL doc_ids (verified May 2026) ────────────────────────────
# Update these when Instagram rotates them (every 2-4 weeks).
# How to find them: Chrome DevTools > Network > filter "graphql" > check POST body.
DOC_ID_POST       = "8845758582119845"   # single post + first ~12 comments
DOC_ID_USER_POSTS = "9310670392322965"   # user timeline (paginated)
DOC_ID_COMMENTS   = "6048136521874718"   # comment pagination pages 2+

# ── Instagram required headers ────────────────────────────────────────────────
# x-ig-app-id is Instagram Web's stable public app ID.
# Scrapfly adds TLS fingerprint + proxy on top of these.
IG_HEADERS = {
    "x-ig-app-id":      "936619743392459",
    "x-requested-with": "XMLHttpRequest",
    "Accept-Language":  "en-US,en;q=0.9",
    "Accept":           "*/*",
    "Referer":          "https://www.instagram.com/",
    "Origin":           "https://www.instagram.com",
}

# ── LLM config ────────────────────────────────────────────────────────────────
NVIDIA_BASE_URL     = "https://integrate.api.nvidia.com/v1"
NVIDIA_VISION_MODEL = "meta/llama-3.2-11b-vision-instruct"
GROQ_TEXT_MODEL     = "llama-3.3-70b-versatile"

# ── Pipeline limits ───────────────────────────────────────────────────────────
MAX_POSTS         = 3    # keep at most N latest posts in time window
MAX_COMMENTS      = 200  # max comments per relevant post (raise if needed)
COMMENTS_PER_PAGE = 20   # Raised: fewer pages = fewer Scrapfly credits

# Proxy country rotation pool.
# Instagram soft-blocks IP ranges that make repeated requests from the same country.
# Rotating countries each run = different residential IP pool = much harder to block.
PROXY_COUNTRIES = ["US", "FR", "DE", "GB", "CA", "NL", "IT", "ES"]


# ─────────────────────────────────────────────────────────────────────────────
# LAYER 1 — SCRAPFLY FETCHER
# Anti-bot bypass + HTTP requests
# ─────────────────────────────────────────────────────────────────────────────

class ScrapflyFetcher:
    """
    All HTTP goes through Scrapfly. It handles:
      - Chrome-level TLS fingerprint (not Python requests — Instagram detects that)
      - Residential IP rotation (datacenter IPs are blocked by Instagram)
      - ASP bypass (Meta bot detection, Cloudflare)
      - Header management
    We call _fetch() and get back clean text content.
    """

    def __init__(self, api_key: str, country: str = "US"):
        self.client  = ScrapflyClient(key=api_key)
        self.country = country
        log.info(f"✅ Scrapfly client initialized (proxy country: {country})")

    def _fetch(self, url: str, method: str = "GET", body: str = None,
               extra_headers: dict = None, render_js: bool = False,
               max_retries: int = 3, asp: bool = True,
               cache: bool = False) -> str:
        """
        Scrapfly request with exponential backoff retry.

        USE FOR: GraphQL queries, comment pagination, post details.
        DO NOT USE FOR: get_user_id — use _fetch_once() there instead.

        WHY THE DISTINCTION:
          get_user_id has its own 3-strategy fallback (REST → ?__a=1 → HTML).
          Adding retry to each strategy makes failures take 3×9=27 seconds
          and produces confusing log noise when Instagram is just slow.
          GraphQL endpoints benefit from retry because empty body there means
          a transient rate-limit that resolves in a few seconds.

        RETRY DELAYS: 3s → 6s → 12s (exponential backoff)
        """
        headers = {**IG_HEADERS, **(extra_headers or {})}
        config  = ScrapeConfig(
            url=url,
            method=method,
            body=body,
            headers=headers,
            asp=asp,
            country=self.country,  # rotated per run — no single IP pool gets flagged
            render_js=render_js,
            cache=cache,
        )
        last_exc = None
        for attempt in range(1, max_retries + 1):
            try:
                response = self.client.scrape(config)
                content  = response.content
                if not content or not content.strip():
                    raise ValueError("Empty response body (transient rate-limit)")
                return content
            except Exception as exc:
                last_exc = exc
                if attempt < max_retries:
                    wait = 3 * (2 ** (attempt - 1))  # 3s, 6s, 12s
                    log.warning(
                        f"  ⚠️  Attempt {attempt}/{max_retries} failed: {exc} "
                        f"— retrying in {wait}s ..."
                    )
                    time.sleep(wait)
        raise last_exc

    def _fetch_once(self, url: str, method: str = "GET", body: str = None,
                    extra_headers: dict = None, render_js: bool = False,
                    asp: bool = True, cache: bool = False) -> str:
        """
        Single attempt with NO retry — for get_user_id fallback chain.
        Fails fast so the caller can try its next strategy immediately.
        Returns empty string (not raises) on empty body, so callers can
        check with `if not content` rather than catching ValueError.
        """
        headers = {**IG_HEADERS, **(extra_headers or {})}
        config  = ScrapeConfig(
            url=url,
            method=method,
            body=body,
            headers=headers,
            asp=asp,
            country=self.country,  # same rotation as _fetch
            render_js=render_js,
            cache=cache,
        )
        response = self.client.scrape(config)
        return response.content or ""

    # ── Step 1: resolve username → numeric user_id ────────────────────────────
    def get_user_id(self, username: str) -> str:
        """
        Instagram's post timeline GraphQL needs a numeric user_id, not the username.
        We try 3 endpoints in order, most reliable first.
        """
        log.info(f"🔎 Resolving user_id for @{username} …")

        # Strategy A: REST web_profile_info — primary, most stable
        # Uses _fetch() with max_retries=2 (one retry with 3s wait).
        # This was the approach that worked reliably before — reverted here.
        log.info("  Trying /api/v1/users/web_profile_info/ …")
        try:
            content = self._fetch(
                f"https://www.instagram.com/api/v1/users/web_profile_info/?username={username}",
                max_retries=2,
                asp=False,   # Plain JSON API — no ASP needed: saves ~48 credits/call
                cache=True,  # user_id never changes — 0 credits on repeat calls
            )
            data = json.loads(content)
            uid  = str(data["data"]["user"]["id"])
            log.info(f"  ✅ user_id={uid} (via REST API)")
            return uid
        except Exception as e:
            log.warning(f"  REST API failed: {e}")

        # Strategy B: ?__a=1 endpoint
        log.info("  Trying /?__a=1 …")
        try:
            content = self._fetch(
                f"https://www.instagram.com/{username}/?__a=1&__d=dis",
                max_retries=2,
                asp=False,   # JSON endpoint — no ASP needed: saves ~48 credits
                cache=True,  # Stable data — 0 credits on cache hit
            )
            data = json.loads(content)
            uid  = str(data["graphql"]["user"]["id"])
            log.info(f"  ✅ user_id={uid} (via ?__a=1)")
            return uid
        except Exception as e:
            log.warning(f"  ?__a=1 failed: {e}")

        # Strategy C: profile HTML with JS rendering
        log.info("  Trying profile page HTML (JS render) …")
        try:
            content = self._fetch(
                f"https://www.instagram.com/{username}/",
                render_js=True,
                max_retries=2,
                asp=True,    # Profile HTML needs real bypass (most expensive ~100cr)
                cache=True,  # Profile page stable — 0 credits on cache hit
            )
            sel = Selector(text=content)
            for script in sel.css("script[type='application/json']").getall():
                try:
                    blob = json.loads(script)
                    uid  = self._find_user_id_in_blob(blob, username)
                    if uid:
                        log.info(f"  ✅ user_id={uid} (via profile HTML)")
                        return uid
                except Exception:
                    continue
        except Exception as e:
            log.warning(f"  Profile HTML parse failed: {e}")

        raise RuntimeError(
            f"Could not resolve user_id for @{username}. "
            "Check your Scrapfly key and credits. "
            "If doc_ids changed, update DOC_ID_POST / DOC_ID_USER_POSTS constants."
        )

    @staticmethod
    def _find_user_id_in_blob(blob, username: str) -> Optional[str]:
        """Recursively search nested dict/list for a user node containing the username."""
        if isinstance(blob, dict):
            if blob.get("username") == username and "id" in blob:
                return str(blob["id"])
            for v in blob.values():
                r = ScrapflyFetcher._find_user_id_in_blob(v, username)
                if r:
                    return r
        elif isinstance(blob, list):
            for item in blob:
                r = ScrapflyFetcher._find_user_id_in_blob(item, username)
                if r:
                    return r
        return None

    # ── Step 2: fetch recent posts ────────────────────────────────────────────
    def fetch_posts(self, user_id: str, username: str, hours: int) -> list[dict]:
        """
        Multi-strategy post fetcher with diagnostic logging.
        Strategy A: REST /api/v1/feed/user/ (stable, no rotating doc_id)
        Strategy B: GraphQL timeline (fallback, doc_id rotates every 2-4 weeks)
        """
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        log.info(f"📥 Fetching posts for @{username} newer than {cutoff.strftime('%Y-%m-%dT%H:%M:%SZ')}")

        log.info("  [Strategy A] REST /api/v1/feed/user/ ...")
        rest_result = self._fetch_posts_rest(user_id, cutoff)
        if rest_result is not None:
            log.info(f"📦 Strategy A OK: {len(rest_result)} post(s)")
            return rest_result

        log.info("  [Strategy B] GraphQL timeline (doc_id may be stale) ...")
        gql_result = self._fetch_posts_graphql(user_id, username, cutoff)
        log.info(f"📦 Strategy B: {len(gql_result)} post(s)")
        return gql_result

    def _fetch_posts_rest(self, user_id: str, cutoff: datetime) -> "list | None":
        """
        REST feed endpoint — stable, no doc_id dependency.
        Paginates with next_max_id. Returns None on failure so caller
        falls back to GraphQL.
        """
        all_posts = []
        max_id    = None
        page      = 0

        while True:
            page += 1
            url = f"https://www.instagram.com/api/v1/feed/user/{user_id}/?count=12"
            if max_id:
                url += "&max_id=" + urllib.parse.quote(str(max_id))

            try:
                # asp=False first (saves ~48 credits/page).
                # If empty, retry with asp=True — some residential IPs need bypass.
                content = self._fetch(url, asp=False, max_retries=1)
                if not content or not content.strip():
                    log.info("  REST without ASP empty — retrying with ASP ...")
                    content = self._fetch(url, asp=True, max_retries=2)
                data = json.loads(content)
            except Exception as e:
                log.warning(f"  REST page {page} failed: {e}")
                return None

            if "items" not in data:
                keys_found = list(data.keys())
                sample     = str(data)[:300]
                log.warning(f"  REST unexpected response. Keys: {keys_found}. Sample: {sample}")
                log.warning("  -> Falling back to GraphQL strategy.")
                return None

            items     = data.get("items", [])
            found_old = False
            for item in items:
                ts_raw = item.get("taken_at") or item.get("taken_at_timestamp")
                if ts_raw:
                    ts = datetime.fromtimestamp(int(ts_raw), tz=timezone.utc)
                    if ts < cutoff:
                        found_old = True
                        continue
                all_posts.append(item)

            log.info(f"  REST page {page}: +{len(items)} items (in-window: {len(all_posts)})")

            more   = data.get("more_available", False)
            max_id = data.get("next_max_id")
            if found_old or not more or not max_id or len(all_posts) >= MAX_POSTS * 4:
                break
            time.sleep(1.5)

        return all_posts

    def _fetch_posts_graphql(self, user_id: str, username: str, cutoff: datetime) -> list:
        """
        GraphQL timeline fallback. Auto-detects response key structure.
        When no known key matches, logs the exact response so you know
        what to update in DOC_ID_USER_POSTS.
        """
        all_posts  = []
        end_cursor = None
        page       = 0

        while True:
            page += 1
            variables = {"id": user_id, "first": 12}
            if end_cursor:
                variables["after"] = end_cursor

            body = (
                "variables=" + urllib.parse.quote(json.dumps(variables, separators=(",", ":")))
                + "&doc_id=" + DOC_ID_USER_POSTS
            )

            try:
                content = self._fetch(
                    "https://www.instagram.com/graphql/query",
                    method="POST",
                    body=body,
                    extra_headers={"content-type": "application/x-www-form-urlencoded"},
                )
                data = json.loads(content)
            except Exception as e:
                log.warning(f"  GraphQL page {page} failed: {e}")
                break

            user_data = data.get("data") or {}
            data_keys = list(user_data.keys()) if isinstance(user_data, dict) else []

            # Try all known response key patterns Instagram has used 2022-2026
            timeline = (
                user_data.get("xdt_api__v1__feed__user_timeline_graphql_connection")
                or (user_data.get("user") or {}).get("edge_owner_to_timeline_media")
                or user_data.get("xdt_api__v1__feed__user_timeline_graphql_connection__")
            )

            if timeline is None:
                # DIAGNOSTIC — tells you exactly what to fix
                log.warning("=" * 55)
                log.warning("DIAGNOSTIC: GraphQL returned unknown structure")
                log.warning(f"  data.keys()       = {data_keys}")
                log.warning(f"  DOC_ID_USER_POSTS = {DOC_ID_USER_POSTS} (likely rotated)")
                log.warning("  HOW TO FIX:")
                log.warning(f"    1. Open Chrome -> instagram.com/{username}")
                log.warning("    2. DevTools F12 -> Network -> filter 'graphql/query'")
                log.warning("    3. Scroll the profile page to trigger a post load")
                log.warning("    4. Find the POST request -> copy doc_id from the body")
                log.warning("    5. Update DOC_ID_USER_POSTS constant at top of file")
                log.warning(f"  Response sample: {str(data)[:400]}")
                log.warning("=" * 55)
                break

            edges     = timeline.get("edges", [])
            page_info = timeline.get("page_info", {})
            found_old = False

            for edge in edges:
                node = edge.get("node", edge)
                ts_raw = node.get("taken_at") or node.get("taken_at_timestamp")
                if ts_raw:
                    ts = datetime.fromtimestamp(int(ts_raw), tz=timezone.utc)
                    if ts < cutoff:
                        found_old = True
                        continue
                all_posts.append(node)

            log.info(f"  GraphQL page {page}: +{len(edges)} posts (in-window: {len(all_posts)})")

            if found_old or not page_info.get("has_next_page") or len(all_posts) >= MAX_POSTS * 4:
                break
            end_cursor = page_info.get("end_cursor")
            if not end_cursor:
                break
            time.sleep(1.5)

        return all_posts
    def fetch_post_details(self, shortcode: str) -> dict:
        """Gets full post data including caption, media_url, likes, first comments."""
        variables = {
            "shortcode": shortcode,
            "fetch_tagged_user_count": None,
            "hoisted_comment_id": None,
            "hoisted_reply_id": None,
        }
        body = (
            f"variables={urllib.parse.quote(json.dumps(variables, separators=(',', ':')))}"
            f"&doc_id={DOC_ID_POST}"
        )
        content = self._fetch(
            "https://www.instagram.com/graphql/query",
            method="POST",
            body=body,
            extra_headers={"content-type": "application/x-www-form-urlencoded"},
        )
        return json.loads(content)

    # ── Step 4: fetch ALL comments with cursor pagination ─────────────────────
    def fetch_comments(self, shortcode: str, max_comments: int = MAX_COMMENTS) -> list[dict]:
        """
        Full cursor pagination for comments — owns the loop entirely.

        BUGS FIXED FROM v1:
        ─────────────────────────────────────────────────────────────
        BUG 1: DOC_ID_COMMENTS (6048136521874718) rotated → 400 Bad Request
          FIX:  Use DOC_ID_POST for ALL comment pages (same operation,
                just add "after" cursor for pages 2+). No separate doc_id needed.

        BUG 2: Cursor was malformed — log showed "erse\": true}"
          ROOT CAUSE: Instagram encodes extra pagination metadata INTO
          the end_cursor field as a JSON string on some responses:
            end_cursor = '{"biDirectionalPaginationEnabled": true}'
          We were passing this JSON blob as the `after` value → 400.
          FIX: Validate cursor with is_valid_cursor() before using it.
               A real cursor is a base64 string (no { or " characters).
               If invalid, stop pagination rather than send bad request.

        BUG 3: Only 10 comments on page 1 instead of ~12
          ROOT CAUSE: edge_media_to_parent_comment includes pinned/highlighted
          comments separately; count may vary.
          FIX: Accept whatever page 1 returns, continue paginating.

        COMMENT PAGINATION FLOW:
          Page 1 → embedded in DOC_ID_POST response (no cursor needed)
          Pages 2+ → same DOC_ID_POST endpoint + shortcode + after=cursor
          Each page returns new end_cursor for the next page.
        """
        log.info(f"💬 Fetching comments (cap={max_comments}) for shortcode={shortcode}")
        all_comments = []

        # ── Page 1: from post details response ───────────────────────────────
        try:
            post_data  = self.fetch_post_details(shortcode)
            media_node = (
                post_data.get("data", {}).get("xdt_shortcode_media")
                or post_data.get("data", {}).get("shortcode_media")
            )
            if not media_node:
                log.warning("  No media node in post details — no comments available")
                return []

            comment_edge = (
                media_node.get("edge_media_to_parent_comment")
                or media_node.get("edge_media_to_comment")
                or {}
            )
            page_info = comment_edge.get("page_info", {})

            for edge in comment_edge.get("edges", []):
                all_comments.append(edge.get("node", edge))

            raw_cursor    = self._unwrap_cursor(page_info.get("end_cursor", ""))
            has_next      = page_info.get("has_next_page", False)
            valid_cursor  = bool(raw_cursor)

            log.info(
                f"  Page 1: {len(all_comments)} comments | "
                f"has_next={has_next} | "
                f"cursor_valid={valid_cursor} | "
                f"cursor_preview={repr(raw_cursor[:40])}"
            )

        except Exception as e:
            log.warning(f"  Page 1 failed: {e}")
            return []

        # ── Pages 2+: cursor loop using DOC_ID_POST ───────────────────────────
        # Same endpoint and doc_id as fetch_post_details — just add `after`.
        # This avoids the rotated DOC_ID_COMMENTS entirely.
        page_num = 1
        while has_next and raw_cursor and len(all_comments) < max_comments:
            page_num += 1
            log.info(f"  Page {page_num}: fetching (collected={len(all_comments)}) ...")

            variables = {
                "shortcode":               shortcode,
                "first":                   COMMENTS_PER_PAGE,
                "after":                   raw_cursor,
                "fetch_tagged_user_count": None,
                "hoisted_comment_id":      None,
                "hoisted_reply_id":        None,
            }
            body = (
                "variables=" + urllib.parse.quote(json.dumps(variables, separators=(",", ":")))
                + "&doc_id=" + DOC_ID_POST
            )

            try:
                content = self._fetch(
                    "https://www.instagram.com/graphql/query",
                    method="POST",
                    body=body,
                    extra_headers={"content-type": "application/x-www-form-urlencoded"},
                )
                data = json.loads(content)
            except Exception as e:
                log.warning(f"  Page {page_num} request failed: {e}")
                break

            # Navigate comment edge in pagination response
            sm = (
                data.get("data", {}).get("xdt_shortcode_media")
                or data.get("data", {}).get("shortcode_media")
                or {}
            )
            comment_edge = (
                sm.get("edge_media_to_parent_comment")
                or sm.get("edge_media_to_comment")
                or {}
            )

            if not comment_edge:
                log.warning(f"  Page {page_num}: no comment edge. data keys: {list(data.get('data', {}).keys())}")
                break

            new_nodes = [e.get("node", e) for e in comment_edge.get("edges", [])]
            all_comments.extend(new_nodes)

            page_info    = comment_edge.get("page_info", {})
            raw_cursor   = self._unwrap_cursor(page_info.get("end_cursor", ""))
            has_next     = page_info.get("has_next_page", False)
            valid_cursor = bool(raw_cursor)

            log.info(
                f"  Page {page_num}: +{len(new_nodes)} → total {len(all_comments)} | "
                f"has_next={has_next} | cursor_valid={valid_cursor}"
            )

            # Polite delay between pages — Instagram rate-limits burst requests.
            # After every 5 pages take a longer breath to avoid soft-blocks.
            if page_num % 5 == 0:
                log.info(f"  ⏸  Burst pause after page {page_num} (5-page batch complete) ...")
                time.sleep(4.0)
            else:
                time.sleep(2.0)

        final = all_comments[:max_comments]
        log.info(f"  ✅ {len(final)} comments fetched total")
        if len(all_comments) >= max_comments:
            log.info(f"  ℹ️  Cap reached ({max_comments}). Raise MAX_COMMENTS to get more.")
        return final

    @staticmethod
    def _unwrap_cursor(raw_cursor) -> str:
        """
        Extract a usable pagination cursor from whatever Instagram returns.

        Instagram has used THREE cursor formats:

          Format A — plain base64 string (2022-2024):
            "QVFBdz9yZXZlcnNlIjp0cnVlfQ=="

          Format B — JSON string inside the JSON (2025):
            '{"server_cursor": "QVFER0h...", "is_server_cursor": true}'
            → end_cursor field value is a STRING that contains JSON

          Format C — pre-parsed dict (May 2026, the current bug):
            {"server_cursor": "QVFER0h...", "is_server_cursor": True}
            → Instagram's JSON response has end_cursor already parsed
              as a nested dict by json.loads() — NOT a string
            → isinstance(raw_cursor, str) was False → returned "" → bug

        Fix: handle dict input directly, no need to json.loads() it.
        """
        if not raw_cursor:
            return ""

        # Format C: already a parsed dict (current Instagram behavior May 2026)
        if isinstance(raw_cursor, dict):
            inner = (
                raw_cursor.get("server_cursor")
                or raw_cursor.get("end_cursor")
                or raw_cursor.get("cursor")
            )
            if inner and isinstance(inner, str) and len(inner.strip()) >= 10:
                return inner.strip()
            return ""

        if not isinstance(raw_cursor, str):
            return ""

        s = raw_cursor.strip()
        if not s:
            return ""

        # Format B: JSON string — parse it and extract inner cursor
        if s.startswith("{"):
            try:
                obj = json.loads(s)
                inner = (
                    obj.get("server_cursor")
                    or obj.get("end_cursor")
                    or obj.get("cursor")
                )
                if inner and isinstance(inner, str) and len(inner.strip()) >= 10:
                    return inner.strip()
            except (json.JSONDecodeError, AttributeError):
                pass
            return ""

        # Format A: plain cursor string — validate minimum length
        if len(s) < 10:
            return ""

        return s

    @staticmethod
    def _is_valid_cursor(cursor) -> bool:
        """Returns True if cursor is a usable (non-empty) string after unwrapping."""
        return bool(ScrapflyFetcher._unwrap_cursor(cursor))
# ─────────────────────────────────────────────────────────────────────────────
# LAYER 2 — SCRAPLING PARSER
# Robust extraction from Instagram's varying GraphQL structure
# ─────────────────────────────────────────────────────────────────────────────

class InstagramParser:
    """
    Normalises raw GraphQL nodes into clean dicts.

    WHY SCRAPLING:
    Instagram's field names change between API versions:
      caption → edge_media_to_caption.edges[0].node.text (old)
             → caption.text                              (new)
             → caption                                   (string direct)
    Scrapling's Selector handles HTML parsing when needed, and the
    _pick() helper provides robust multi-path fallback for JSON fields.
    """

    @staticmethod
    def _pick(node: dict, *paths, default=None):
        """
        Try dot-notation paths in order, return first non-None value.
        Example: _pick(node, "owner.username", "user.username", "username")
        """
        for path in paths:
            try:
                val = node
                for key in path.split("."):
                    if isinstance(val, list):
                        val = val[int(key)]
                    elif isinstance(val, dict):
                        val = val[key]
                    else:
                        val = None
                        break
                if val is not None:
                    return val
            except (KeyError, IndexError, TypeError, ValueError):
                continue
        return default

    def parse_post(self, node: dict, username: str = "") -> dict:
        p = self._pick

        # Caption — try multiple structures
        caption = (
            p(node, "edge_media_to_caption.edges.0.node.text")
            or p(node, "caption.text")
            or p(node, "caption")
            or ""
        )
        if isinstance(caption, dict):
            caption = caption.get("text", "")

        # Timestamp — Unix int or ISO string
        ts_raw = p(node, "taken_at") or p(node, "taken_at_timestamp") or p(node, "timestamp")
        timestamp = ""
        if ts_raw:
            try:
                if isinstance(ts_raw, (int, float)):
                    timestamp = datetime.fromtimestamp(int(ts_raw), tz=timezone.utc).isoformat()
                else:
                    timestamp = str(ts_raw)
            except Exception:
                pass

        # Media URL — image vs video
        is_video  = bool(p(node, "is_video") or p(node, "video_url"))
        media_url = (
            p(node, "video_url") if is_video
            else p(node, "display_url") or p(node, "thumbnail_src") or ""
        )

        # Engagement metrics
        likes = (
            p(node, "edge_media_preview_like.count")
            or p(node, "edge_liked_by.count")
            or p(node, "like_count")
            or -1
        )
        comments_count = (
            p(node, "edge_media_to_comment.count")
            or p(node, "edge_media_to_parent_comment.count")
            or p(node, "comment_count")
            or -1
        )

        # Identity
        shortcode = p(node, "shortcode") or p(node, "code") or p(node, "id") or ""
        post_id   = p(node, "id") or shortcode
        owner     = p(node, "owner.username") or p(node, "user.username") or username

        return {
            "id":             str(post_id),
            "url":            f"https://www.instagram.com/p/{shortcode}/" if shortcode else "",
            "shortcode":      str(shortcode),
            "owner":          owner,
            "timestamp":      timestamp,
            "caption":        str(caption),
            "likes":          int(likes) if isinstance(likes, (int, float)) else -1,
            "comments_count": int(comments_count) if isinstance(comments_count, (int, float)) else -1,
            "media_url":      str(media_url),
            "is_video":       is_video,
        }

    def parse_comment(self, node: dict) -> dict:
        p = self._pick

        ts_raw = p(node, "created_at") or p(node, "timestamp")
        timestamp = ""
        if ts_raw:
            try:
                timestamp = (
                    datetime.fromtimestamp(int(ts_raw), tz=timezone.utc).isoformat()
                    if isinstance(ts_raw, (int, float))
                    else str(ts_raw)
                )
            except Exception:
                pass

        likes = p(node, "edge_liked_by.count") or p(node, "like_count") or p(node, "likes") or 0
        owner = (
            p(node, "owner.username")
            or p(node, "user.username")
            or p(node, "username")
            or "anonymous"
        )

        return {
            "id":        str(p(node, "id") or ""),
            "text":      str(p(node, "text") or ""),
            "timestamp": timestamp,
            "likes":     int(likes) if isinstance(likes, (int, float)) else 0,
            "owner":     owner,
        }

    def filter_by_timewindow(self, posts: list[dict], hours: int) -> list[dict]:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        valid  = []
        for post in posts:
            ts_str = post.get("timestamp", "")
            if not ts_str:
                valid.append(post)
                continue
            try:
                ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                if ts >= cutoff:
                    valid.append(post)
            except Exception:
                valid.append(post)
        return valid

    def select_latest(self, posts: list[dict], n: int) -> list[dict]:
        def sort_key(p):
            try:
                return datetime.fromisoformat(
                    p.get("timestamp", "").replace("Z", "+00:00")
                ).timestamp()
            except Exception:
                return 0
        return sorted(posts, key=sort_key, reverse=True)[:n]


# ─────────────────────────────────────────────────────────────────────────────
# LAYER 3 — MULTIMODAL LLM JUDGE
# ─────────────────────────────────────────────────────────────────────────────

class MultimodalJudge:
    """
    Priority:
      A → NVIDIA NIM vision (image posts, free, llama-3.2-11b-vision)
      B → Groq text (video posts or NVIDIA failure, free, llama-3.3-70b)
      C → Heuristic keyword match (no keys configured)
    """

    def __init__(self, nvidia_key: Optional[str] = None, groq_key: Optional[str] = None):
        self.nvidia_client = OpenAI(base_url=NVIDIA_BASE_URL, api_key=nvidia_key) if nvidia_key else None
        self.groq_client   = Groq(api_key=groq_key) if groq_key else None
        if nvidia_key:
            log.info("✅ NVIDIA NIM judge ready (vision)")
        if groq_key:
            log.info("✅ Groq judge ready (text fallback)")
        if not nvidia_key and not groq_key:
            log.warning("⚠️  No LLM keys — heuristic mode")

    def classify(self, post: dict, topic: str, topic_description: str = "") -> dict:
        caption   = post.get("caption", "")
        media_url = post.get("media_url", "")
        is_video  = post.get("is_video", False)
        ctx = f"Topic: {topic}" + (f"\nDescription: {topic_description}" if topic_description else "")

        if self.nvidia_client and media_url and not is_video:
            try:
                return self._nvidia(caption, media_url, ctx)
            except Exception as e:
                log.warning(f"  NVIDIA failed ({e}), trying Groq")

        if self.groq_client:
            try:
                return self._groq(caption, ctx)
            except Exception as e:
                log.warning(f"  Groq failed ({e}), using heuristic")

        return self._heuristic(caption, topic)

    def classify_text_only(self, post: dict, topic: str, topic_description: str = "") -> dict:
        """
        Caption-only classification — never uses the image even if available.

        WHY THIS EXISTS:
          Phase 1 of the month-scan scans ALL posts cheaply.
          Using NVIDIA NIM vision on 30-50 posts would cost too many credits
          and be too slow. We use text-only (Groq or heuristic) for the
          bulk scan, then call the full classify() with image only for the
          confirmed relevant posts in Phase 2.
        """
        caption = post.get("caption", "")
        ctx     = f"Topic: {topic}" + (f"\nDescription: {topic_description}" if topic_description else "")

        if self.groq_client:
            try:
                result = self._groq(caption, ctx)
                result["model_used"] = GROQ_TEXT_MODEL
                return result
            except Exception as e:
                log.warning(f"  Groq scan failed ({e}), using heuristic")

        return self._heuristic(caption, topic)


    def _nvidia(self, caption, image_url, ctx) -> dict:
        log.info("  🔍 NVIDIA NIM vision …")
        sys_msg = (
            "You are a social-media relevance judge for academic research. "
            "Decide if this Instagram post is relevant to the topic. "
            'Reply ONLY in JSON: {"relevant":true/false,"confidence":"high/medium/low","reason":"one sentence"}'
        )
        r = self.nvidia_client.chat.completions.create(
            model=NVIDIA_VISION_MODEL,
            messages=[
                {"role": "system", "content": sys_msg},
                {"role": "user", "content": [
                    {"type": "image_url", "image_url": {"url": image_url}},
                    {"type": "text",      "text": f"{ctx}\nCaption: {caption or '(none)'}\nJSON only:"},
                ]},
            ],
            max_tokens=200, temperature=0.1,
        )
        result = self._parse_llm_json(r.choices[0].message.content.strip())
        result["model_used"] = NVIDIA_VISION_MODEL
        return result

    def _groq(self, caption, ctx) -> dict:
        log.info("  🔍 Groq text …")
        sys_msg = (
            "You are a social-media relevance judge for academic research. "
            "Decide if this Instagram caption is relevant to the topic. "
            'Reply ONLY in JSON: {"relevant":true/false,"confidence":"high/medium/low","reason":"one sentence"}'
        )
        r = self.groq_client.chat.completions.create(
            model=GROQ_TEXT_MODEL,
            messages=[
                {"role": "system", "content": sys_msg},
                {"role": "user",   "content": f"{ctx}\nCaption: {caption or '(none)'}\nJSON only:"},
            ],
            max_tokens=200, temperature=0.1,
        )
        result = self._parse_llm_json(r.choices[0].message.content.strip())
        result["model_used"] = GROQ_TEXT_MODEL
        return result

    @staticmethod
    def _heuristic(caption: str, topic: str) -> dict:
        words = set(topic.lower().split())
        hits  = sum(1 for w in words if w in (caption or "").lower())
        return {
            "relevant":   hits >= max(1, len(words) // 2),
            "confidence": "low",
            "reason":     f"Heuristic: {hits}/{len(words)} topic words in caption",
            "model_used": "heuristic",
        }

    @staticmethod
    def _parse_llm_json(raw: str) -> dict:
        cleaned = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        try:
            d = json.loads(cleaned)
            return {
                "relevant":   bool(d.get("relevant", False)),
                "confidence": d.get("confidence", "low"),
                "reason":     d.get("reason", ""),
            }
        except json.JSONDecodeError:
            return {
                "relevant":   "true" in cleaned.lower(),
                "confidence": "low",
                "reason":     f"parse error: {raw[:80]}",
            }


# ─────────────────────────────────────────────────────────────────────────────
# PIPELINE ORCHESTRATOR
# ─────────────────────────────────────────────────────────────────────────────

class InstagramResearchPipeline:

    def __init__(self, scrapfly_key: str,
                 nvidia_key: Optional[str] = None,
                 groq_key: Optional[str] = None,
                 country: str = "US"):
        self.fetcher = ScrapflyFetcher(scrapfly_key, country=country)
        self.parser  = InstagramParser()
        self.judge   = MultimodalJudge(nvidia_key, groq_key)

    def run(self, username: str, topic: str, days: int = 30,
            topic_description: str = "") -> dict:
        """
        Full-month brand mention scanner.

        DESIGN:
          Phase 1 — SCAN (cheap):
            Fetch ALL posts in the last `days` days.
            For each post, run LLM judge on caption only (no enrichment,
            no comments). This is fast and credit-efficient.

          Phase 2 — ENRICH (expensive, only for relevant posts):
            For posts the LLM flagged as relevant:
            - Fetch full post details (media URL, exact likes/counts)
            - Fetch ALL comments with cursor pagination

          OUTPUT:
            A complete brand mention timeline showing every time this
            influencer talked about your product across the full period,
            with full context and comments for each mention.

        WHY THIS DESIGN:
          Influencers post dozens of times per month but mention your
          brand only 2-3 times. Scanning captions is cheap (one REST
          call per page of posts). Only fetching comments for the 2-3
          relevant posts saves Scrapfly credits and LLM tokens.
        """
        log.info("=" * 60)
        log.info(f"🔍 BRAND SCAN — @{username} | '{topic}' | last {days} days")
        log.info("=" * 60)
        log.info("💡 TIP: If you ran this pipeline recently, wait 2-3 minutes")
        log.info("   before re-running. Instagram soft-blocks IPs that make")
        log.info("   rapid successive requests. Scrapfly rotates proxies but")
        log.info("   the rotation needs time to pick a fresh residential IP.")

        result = {
            "profile":              username,
            "topic":                topic,
            "scan_period_days":     days,
            "scraped_at":           datetime.now(timezone.utc).isoformat(),
            "posts_scanned":        0,
            "relevant_posts_found": 0,
            "brand_mention_timeline": [],
            "all_posts_summary":    [],   # lightweight scan of ALL posts
            "pipeline_notes":       [],
        }

        # ── Phase 1a: resolve user_id ─────────────────────────────────────────
        try:
            user_id = self.fetcher.get_user_id(username)
        except Exception as e:
            msg = f"user_id resolution failed: {e}"
            log.error(msg)
            result["pipeline_notes"].append(msg)
            return result

        # ── Phase 1b: fetch ALL posts in the scan period ──────────────────────
        log.info(f"\n📅 Phase 1 — Scanning all posts from last {days} days ...")
        try:
            raw_posts = self.fetcher.fetch_posts(user_id, username, days * 24)
        except Exception as e:
            msg = f"Post fetch failed: {e}"
            log.error(msg)
            result["pipeline_notes"].append(msg)
            return result

        if not raw_posts:
            note = f"No posts found for @{username} in the last {days} days."
            log.info(note)
            result["pipeline_notes"].append(note)
            return result

        parsed_posts = [self.parser.parse_post(r, username) for r in raw_posts]
        result["posts_scanned"] = len(parsed_posts)
        log.info(f"  📦 {len(parsed_posts)} posts fetched to scan")

        # ── Phase 1c: cheap LLM scan (caption only, no enrichment) ───────────
        log.info(f"\n🧠 Phase 1 — LLM scan of all {len(parsed_posts)} post captions ...")
        log.info("   (caption-only, no media fetch, no comments — fast scan)")

        relevant_posts = []
        for idx, post in enumerate(parsed_posts, 1):
            cap_preview = (post["caption"][:60] + "…") if len(post["caption"]) > 60 else post["caption"]
            log.info(f"  [{idx:02d}/{len(parsed_posts)}] {post['timestamp'][:10]} | {cap_preview}")

            # Cheap scan: caption text only, no image (saves NVIDIA credits)
            clf = self.judge.classify_text_only(post, topic, topic_description)

            # Build lightweight summary entry for ALL posts
            result["all_posts_summary"].append({
                "shortcode":   post["shortcode"],
                "url":         post["url"],
                "timestamp":   post["timestamp"],
                "caption":     post["caption"],
                "likes":       post["likes"],
                "is_video":    post["is_video"],
                "relevant":    clf["relevant"],
                "confidence":  clf["confidence"],
                "reason":      clf["reason"],
                "model_used":  clf.get("model_used", ""),
            })

            if clf["relevant"]:
                log.info(f"       ✅ RELEVANT ({clf['confidence']}) — {clf['reason']}")
                relevant_posts.append(post)
            else:
                log.info(f"       ⏭  not relevant")

            # Small delay to avoid rate limits on many posts
            if idx % 10 == 0:
                time.sleep(0.5)

        result["relevant_posts_found"] = len(relevant_posts)
        log.info(f"\n  📊 Scan complete: {len(relevant_posts)}/{len(parsed_posts)} posts mention the topic")

        if not relevant_posts:
            note = f"@{username} posted {len(parsed_posts)} times in {days} days but none mention '{topic}'."
            log.info(f"  {note}")
            result["pipeline_notes"].append(note)
            return result

        # ── Phase 2: deep enrichment for relevant posts only ──────────────────
        log.info(f"\n🔬 Phase 2 — Deep enrichment of {len(relevant_posts)} relevant post(s) ...")
        log.info("   (full media details + all comments with cursor pagination)")

        for idx, post in enumerate(relevant_posts, 1):
            log.info(f"\n── Relevant Post {idx}/{len(relevant_posts)} {'─'*35}")
            log.info(f"   shortcode : {post['shortcode']}")
            log.info(f"   timestamp : {post['timestamp']}")
            log.info(f"   caption   : {post['caption'][:80]}{'…' if len(post['caption']) > 80 else ''}")

            # Enrich: full post details (gets real media_url, exact counts)
            if post["shortcode"] and not post["media_url"]:
                try:
                    log.info("  Enriching post details ...")
                    detail     = self.fetcher.fetch_post_details(post["shortcode"])
                    media_node = (
                        detail.get("data", {}).get("xdt_shortcode_media")
                        or detail.get("data", {}).get("shortcode_media")
                    )
                    if media_node:
                        enriched = self.parser.parse_post(media_node, username)
                        for k, v in enriched.items():
                            if not post.get(k) or post[k] in (-1, ""):
                                post[k] = v
                        log.info(f"  ✅ enriched: likes={post['likes']} media_url={'yes' if post['media_url'] else 'no'}")
                except Exception as e:
                    log.warning(f"  Enrichment failed: {e}")

            # Final LLM classification — now with image if available
            log.info("  Running full LLM classification (with image if available) ...")
            clf = self.judge.classify(post, topic, topic_description)
            log.info(f"  🤖 {clf['relevant']} ({clf['confidence']}) [{clf.get('model_used','')}] — {clf['reason']}")

            # Fetch all comments
            comments = []
            if post["shortcode"]:
                log.info("  Fetching all comments (cursor pagination) ...")
                try:
                    raw_comments = self.fetcher.fetch_comments(post["shortcode"])
                    comments     = [self.parser.parse_comment(c) for c in raw_comments]
                    log.info(f"  💬 {len(comments)} comment(s) fetched")
                except Exception as e:
                    log.warning(f"  Comment fetch failed: {e}")

            result["brand_mention_timeline"].append({
                "shortcode":          post["shortcode"],
                "url":                post["url"],
                "timestamp":          post["timestamp"],
                "caption":            post["caption"],
                "likes":              post["likes"],
                "comments_count":     post["comments_count"],
                "media_url":          post["media_url"],
                "is_video":           post["is_video"],
                "llm_classification": clf,
                "comments":           comments,
            })

            if idx < len(relevant_posts):
                log.info("  ⏸  Cooling down before next post (rate limit protection) ...")
                time.sleep(5.0)

        # Sort timeline chronologically (oldest first for easy reading)
        result["brand_mention_timeline"].sort(key=lambda p: p["timestamp"])

        log.info("\n" + "=" * 60)
        log.info(f"✅ SCAN COMPLETE")
        log.info(f"   Posts scanned   : {result['posts_scanned']}")
        log.info(f"   Relevant found  : {result['relevant_posts_found']}")
        log.info(f"   Period          : last {days} days")
        log.info("=" * 60)
        return result


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser(
        description="Instagram Brand Mention Scanner — Scrapfly + Scrapling",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Scan last 30 days for Rollo mentions across @gooba_official's posts
  python scrapper.py --user gooba_official --topic "Rollo snack campaign" --days 30 --output rollo_mentions.json

  # Scan last 7 days, shorter period
  python scrapper.py --user influencer_x --topic "Nike running shoes" --days 7 --output nike_scan.json

  # Multiple influencers: run the command once per influencer, combine JSON files
        """
    )
    p.add_argument("--user",              required=True,  help="Instagram username (no @)")
    p.add_argument("--topic",             required=True,  help='Brand/product topic e.g. "Rollo snack campaign"')
    p.add_argument("--days",              type=int, default=30,
                   help="Scan period in days (default: 30). Use 7 for a week, 90 for a quarter.")
    p.add_argument("--topic-description", default="",    help="Longer description of the topic for the LLM judge")
    p.add_argument("--output",            default="",    help="JSON output file (default: stdout)")
    p.add_argument("--max-comments",      type=int, default=MAX_COMMENTS,
                   help=f"Max comments per relevant post (default: {MAX_COMMENTS})")
    p.add_argument("--country",           default="",
                   help=(
                       "Proxy country for Scrapfly (default: random each run). "
                       f"Options: {chr(44).join(PROXY_COUNTRIES)}. "
                       "Rotating countries prevents Instagram blocking a single IP pool."
                   ))
    p.add_argument("--scrapfly-key",      default="",    help="Scrapfly API key (or SCRAPFLY_API_KEY env)")
    p.add_argument("--nvidia-key",        default="",    help="NVIDIA NIM key (or NVIDIA_API_KEY env)")
    p.add_argument("--groq-key",          default="",    help="Groq key (or GROQ_API_KEY env)")
    args = p.parse_args()

    load_dotenv()
    scrapfly_key = args.scrapfly_key or os.getenv("SCRAPFLY_API_KEY", "")
    nvidia_key   = args.nvidia_key   or os.getenv("NVIDIA_API_KEY",  "") or None
    groq_key     = args.groq_key     or os.getenv("GROQ_API_KEY",    "") or None

    if not scrapfly_key:
        log.error("❌ No Scrapfly key. Pass --scrapfly-key or set SCRAPFLY_API_KEY in .env")
        sys.exit(1)
    if not nvidia_key and not groq_key:
        log.warning("⚠️  No LLM key — heuristic classification will be used.")

    # Override MAX_COMMENTS if specified
    if args.max_comments != MAX_COMMENTS:
        import instagram_research_pipeline as _m
        _m.MAX_COMMENTS = args.max_comments

    # Resolve proxy country — random rotation by default so each run
    # uses a different residential IP pool. Instagram can't block a pattern
    # it can't see. Pass --country XX to force a specific country.
    import random
    country = args.country.upper() if args.country else random.choice(PROXY_COUNTRIES)
    log.info(f"🌍 Proxy country this run: {country} "
             f"({'specified via --country' if args.country else 'auto-rotated'})")

    pipeline = InstagramResearchPipeline(scrapfly_key, nvidia_key, groq_key, country=country)
    result   = pipeline.run(
        username=args.user,
        topic=args.topic,
        days=args.days,
        topic_description=args.topic_description,
    )

    output_json = json.dumps(result, indent=2, ensure_ascii=False)
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(output_json)
        log.info(f"📄 Written to {args.output}")
    else:
        print("\n" + "─" * 60)
        print("FINAL JSON OUTPUT")
        print("─" * 60)
        print(output_json)


if __name__ == "__main__":
    main()