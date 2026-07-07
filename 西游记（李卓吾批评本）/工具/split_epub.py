#!/usr/bin/env python3
"""Split 西游记 EPUB into chapter text files."""

import re
import shutil
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent
EPUB_TEXT_DIR = PROJECT / "_epub_temp" / "OEBPS" / "Text"
TOC_PATH = PROJECT / "_epub_temp" / "OEBPS" / "toc.ncx"
OUTPUT_DIR = PROJECT / "章节"


class ChapterHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.blocks = []
        self._current = None
        self._buffer = []
        self._in_title = False
        self._in_commentary = False
        self._in_body = False
        self._in_poetry = False
        self._in_inline_comment = False
        self._skip_img = False

    def _flush(self):
        if self._current is None:
            return
        text = "".join(self._buffer).strip()
        text = re.sub(r"\s+", " ", text)
        if text:
            self.blocks.append((self._current, text))
        self._buffer = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        cls = attrs.get("class", "")

        if tag == "h2" and "title" in cls:
            self._flush()
            self._current = "title"
            self._in_title = True
        elif tag == "h2" and "mulu" in cls:
            self._flush()
            self._current = "section"
            self._in_title = True
        elif tag == "p" and cls == "zp1":
            self._flush()
            self._current = "commentary"
            self._in_commentary = True
        elif tag == "p" and cls.startswith("content"):
            self._flush()
            self._current = "body"
            self._in_body = True
        elif tag == "p" and cls in ("shi", "shi1"):
            self._flush()
            self._current = "poetry"
            self._in_poetry = True
        elif tag == "p" and cls == "info":
            self._flush()
            self._current = "info"
        elif tag == "p" and cls == "wen":
            self._flush()
            self._current = "document"
        elif tag == "span" and cls == "pz":
            self._in_inline_comment = True
        elif tag == "img":
            self._skip_img = True
        elif tag == "br":
            self._buffer.append("\n")

    def handle_endtag(self, tag):
        if tag in ("h2", "p"):
            self._flush()
            self._current = None
            self._in_title = False
            self._in_commentary = False
            self._in_body = False
            self._in_poetry = False
        elif tag == "span":
            self._in_inline_comment = False
        elif tag == "img":
            self._skip_img = False

    def handle_data(self, data):
        if self._skip_img:
            return
        if self._current is None:
            return
        self._buffer.append(data)


def sanitize_filename(title: str, max_len: int = 80) -> str:
    title = title.replace("\u3000", " ").strip()
    title = re.sub(r'[<>:"/\\|?*]', "", title)
    title = re.sub(r"\s+", "_", title)
    return title[:max_len].rstrip("_")


def parse_toc(toc_path: Path):
    ns = {"ncx": "http://www.daisy.org/z3986/2005/ncx/"}
    tree = ET.parse(toc_path)
    root = tree.getroot()
    chapters = []
    for nav in root.findall(".//ncx:navPoint", ns):
        label_el = nav.find("ncx:navLabel/ncx:text", ns)
        content_el = nav.find("ncx:content", ns)
        if label_el is None or content_el is None:
            continue
        title = (label_el.text or "").strip()
        src = content_el.get("src", "")
        html_name = Path(src).name
        play_order = int(nav.get("playOrder", len(chapters) + 1))
        chapters.append({"order": play_order, "title": title, "file": html_name})
    chapters.sort(key=lambda x: x["order"])
    return chapters


def html_to_text(html_path: Path) -> str:
    parser = ChapterHTMLParser()
    parser.feed(html_path.read_text(encoding="utf-8"))
    parser.close()

    lines = []
    for kind, text in parser.blocks:
        if kind == "title":
            lines.append(f"# {text}\n")
        elif kind == "section":
            lines.append(f"## {text}\n")
        elif kind == "commentary":
            lines.append(f"> 【批语】{text}\n")
        elif kind == "body":
            lines.append(text)
            lines.append("")
        elif kind == "poetry":
            lines.append(f"　　{text}")
        elif kind in ("info", "document"):
            lines.append(text)
            lines.append("")

    return "\n".join(lines).strip() + "\n"


def main():
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)
    OUTPUT_DIR.mkdir(parents=True)

    chapters = parse_toc(TOC_PATH)
    index_lines = ["# 西游记（李卓吾批评本）目录\n"]

    for ch in chapters:
        html_path = EPUB_TEXT_DIR / ch["file"]
        if not html_path.exists():
            print(f"SKIP missing: {html_path}")
            continue

        order = ch["order"]
        title = ch["title"]
        filename = f"{order:03d}_{sanitize_filename(title)}.txt"
        out_path = OUTPUT_DIR / filename

        content = html_to_text(html_path)
        header = f"《{title}》\n{'=' * min(len(title) + 2, 60)}\n\n"
        out_path.write_text(header + content, encoding="utf-8")

        index_lines.append(f"{order:03d}. {title}  →  {filename}")
        print(f"OK {filename}")

    (OUTPUT_DIR / "000_目录.txt").write_text("\n".join(index_lines) + "\n", encoding="utf-8")
    print(f"\nDone: {len(chapters)} chapters -> {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
