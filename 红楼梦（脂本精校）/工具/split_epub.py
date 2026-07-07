#!/usr/bin/env python3
"""Split 红楼梦 EPUB into chapter text files."""

import re
import shutil
import xml.etree.ElementTree as ET
from pathlib import Path

from bs4 import BeautifulSoup, NavigableString, Tag

PROJECT = Path(__file__).resolve().parent.parent
EPUB_DIR = PROJECT / "_epub_temp" / "EPUB"
TOC_PATH = EPUB_DIR / "toc.ncx"
OUTPUT_DIR = PROJECT / "章节"


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


def sorted_html_files(epub_dir: Path):
    files = []
    for path in epub_dir.glob("index_split_*.html"):
        m = re.search(r"index_split_(\d+)\.html$", path.name)
        if m:
            files.append((int(m.group(1)), path.name))
    files.sort()
    return [name for _, name in files]


def chapter_file_set(chapters):
    return {ch["file"] for ch in chapters}


def files_for_chapter(chapters, all_files, start_file: str):
    chapter_starts = chapter_file_set(chapters)
    try:
        idx = all_files.index(start_file)
    except ValueError:
        return [start_file]
    group = [start_file]
    for name in all_files[idx + 1 :]:
        if name in chapter_starts:
            break
        group.append(name)
    return group


def element_text(el: Tag) -> str:
    parts = []
    for child in el.descendants:
        if isinstance(child, NavigableString):
            text = str(child)
            if text.strip():
                parts.append(text)
    text = "".join(parts)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def classify_paragraph(p: Tag):
    cls = " ".join(p.get("class", []))
    text = element_text(p)
    if not text:
        return None

    if "calibre_11" in cls:
        return "title", text.replace("<br/>", "\n").replace("<br>", "\n")
    if "calibre_12" in cls:
        if text.startswith("【"):
            return "marker", text
        return "marker", text
    if "calibre_14" in cls:
        return "preface", text
    if "calibre_15" in cls or "calibre_16" in cls:
        return "poetry", text
    if "calibre_19" in cls or "calibre_20" in cls:
        return "note", text
    if any(x in cls for x in ("calibre_13", "calibre_17", "calibre_18", "calibre_21")):
        return "body", text
    if "calibre2" in cls or "calibre_5" in cls or "calibre_6" in cls or "calibre_7" in cls:
        return "info", text
    if "calibre_4" in cls:
        return "info", text
    return "body", text


def html_to_text(html_path: Path) -> str:
    soup = BeautifulSoup(html_path.read_text(encoding="utf-8"), "html.parser")
    body = soup.body
    if body is None:
        return ""

    lines = []
    for el in body.children:
        if not isinstance(el, Tag):
            continue
        if el.name == "blockquote":
            text = element_text(el)
            if text:
                lines.append(f"　　{text}")
            continue
        if el.name != "p":
            continue
        result = classify_paragraph(el)
        if result is None:
            continue
        kind, text = result
        if kind == "title":
            lines.append(f"# {text}\n")
        elif kind == "marker":
            lines.append(text)
            lines.append("")
        elif kind == "preface":
            lines.append(f"> 【回前墨】{text}\n")
        elif kind == "poetry":
            lines.append(f"　　{text}")
        elif kind == "note":
            if text.startswith("["):
                lines.append(f"> 【注释】{text}")
            else:
                lines.append(f"> 【脂批】{text}")
        elif kind == "info":
            lines.append(text)
            lines.append("")
        else:
            lines.append(text)
            lines.append("")

    return "\n".join(lines).strip()


def merge_html_text(paths: list[Path]) -> str:
    chunks = []
    for path in paths:
        text = html_to_text(path)
        if text:
            chunks.append(text)
    return "\n\n".join(chunks).strip() + "\n"


def main():
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)
    OUTPUT_DIR.mkdir(parents=True)

    chapters = parse_toc(TOC_PATH)
    all_files = sorted_html_files(EPUB_DIR)
    index_lines = ["# 红楼梦（脂本精校）目录\n"]

    for ch in chapters:
        html_names = files_for_chapter(chapters, all_files, ch["file"])
        html_paths = [EPUB_DIR / name for name in html_names]
        missing = [p for p in html_paths if not p.exists()]
        if missing:
            print(f"SKIP missing: {missing[0]}")
            continue

        order = ch["order"]
        title = ch["title"]
        filename = f"{order:03d}_{sanitize_filename(title)}.txt"
        out_path = OUTPUT_DIR / filename

        content = merge_html_text(html_paths)
        header = f"《{title}》\n{'=' * min(len(title) + 2, 60)}\n\n"
        out_path.write_text(header + content, encoding="utf-8")

        extra = len(html_names) - 1
        suffix = f" (+{extra}注)" if extra else ""
        index_lines.append(f"{order:03d}. {title}  →  {filename}{suffix}")
        print(f"OK {filename}{suffix}")

    (OUTPUT_DIR / "000_目录.txt").write_text("\n".join(index_lines) + "\n", encoding="utf-8")
    print(f"\nDone: {len(chapters)} entries -> {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
