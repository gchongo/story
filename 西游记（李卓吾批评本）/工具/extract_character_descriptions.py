#!/usr/bin/env python3
"""Extract character appearance and personality descriptions from 西游记."""

import re
from pathlib import Path
from collections import defaultdict

PROJECT = Path(__file__).resolve().parent.parent
ROOT = PROJECT / "章节"
OUT = PROJECT / "摘录" / "人物描写摘录.md"

CHARACTERS = {
    "孙悟空": [
        r"孙悟空", r"悟空", r"猴王", r"美猴王", r"齐天大圣", r"孙行者", r"行者",
        r"心猿", r"石猴", r"猴精", r"老孙", r"猴头", r"猢狲",
    ],
    "唐僧": [
        r"唐僧", r"三藏", r"玄奘", r"陈玄奘", r"江流儿", r"金蝉子", r"禅僧",
        r"师父", r"长老",
    ],
    "猪八戒": [
        r"猪八戒", r"八戒", r"悟能", r"天蓬", r"猪悟能",
    ],
    "沙悟净": [
        r"沙悟净", r"沙僧", r"悟净", r"沙和尚", r"卷帘",
    ],
    "观音菩萨": [r"观音菩萨", r"观世音", r"观音", r"菩萨"],
    "如来佛祖": [r"如来佛祖", r"如来", r"世尊", r"佛祖"],
    "玉皇大帝": [r"玉皇大帝", r"玉帝", r"玉皇", r"天尊"],
    "菩提祖师": [r"菩提祖师", r"须菩提", r"祖师"],
    "白龙马": [r"白龙马", r"龙马", r"小白龙", r"西海龙王三太子"],
    "牛魔王": [r"牛魔王", r"牛大哥"],
    "红孩儿": [r"红孩儿", r"圣婴大王"],
    "白骨精": [r"白骨精", r"白骨夫人"],
    "六耳猕猴": [r"六耳猕猴", r"假猴王"],
    "二郎神": [r"二郎神", r"二郎真君", r"杨戬"],
    "太上老君": [r"太上老君", r"老君"],
}

APPEARANCE_KW = [
    "相貌", "形容", "容貌", "面貌", "面如", "面似", "眼如", "眼似", "目如", "目似",
    "身穿", "头戴", "足踏", "腰围", "身长", "身高", "打扮", "扮相", "长相", "模样",
    "生的", "长得", "真个", "外貌", "颜色", "颜色", "毛脸", "雷公", "身材", "体态",
    "打扮", "装束", "穿着", "衣", "冠", "甲", "棒", "钯", "杖", "箍", "耳", "嘴", "鼻",
    "眉", "发", "须", "齿", "牙", "手", "脚", "爪", "尾", "耳", "金睛", "火眼",
    "胖", "瘦", "矮", "高", "丑", "俊", "美", "怪", "凶", "善",
]

PERSONALITY_KW = [
    "性", "脾气", "性格", "胆大", "胆小", "贪", "懒", "忠", "诚", "顽", "恶", "善",
    "凶", "狠", "慈", "悲", "智", "愚", "勇", "怯", "傲", "谦", "刁", "滑", "呆",
    "乖", "灵", "蠢", "躁", "静", "刚", "柔", "奸", "诈", "直", "曲",
]

# Patterns that often introduce physical description blocks
DESC_PATTERNS = [
    r"但见他[：:]?",
    r"但见那[：:]?",
    r"你看他[：:]?",
    r"你看那[：:]?",
    r"只见那[：:]?",
    r"真个是[：:]?",
    r"打扮[：:]?",
    r"形容[：:]?",
    r"相貌[：:]?",
    r"诗曰[：:]?",
    r"赞曰[：:]?",
    r"正是[：:]?",
]


def clean_text(text: str) -> str:
    text = re.sub(r"^> 【批语】.*", "", text, flags=re.MULTILINE)
    text = re.sub(r"^#+ .*\n", "", text)
    text = re.sub(r"^《.+》\n=+\n", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def split_paragraphs(content: str):
    paras = []
    for block in content.split("\n\n"):
        block = block.strip()
        if not block or block.startswith("> 【批语】"):
            continue
        if block.startswith("#") or block.startswith("《"):
            continue
        cleaned = clean_text(block)
        if len(cleaned) >= 20:
            paras.append(cleaned)
    return paras


def char_in_para(para: str, patterns):
    return any(re.search(p, para) for p in patterns)


def score_para(para: str, char_patterns):
    score = 0
    if char_in_para(para, char_patterns):
        score += 3
    for kw in APPEARANCE_KW:
        if kw in para:
            score += 2
    for kw in PERSONALITY_KW:
        if kw in para:
            score += 1
    for pat in DESC_PATTERNS:
        if re.search(pat, para):
            score += 4
    # poetry lines with physical imagery
    if re.search(r"[面眉眼口鼻爪毛身高色]", para) and len(para) < 200:
        score += 1
    return score


def extract_for_character(chapter_file: Path, char_name: str, patterns):
    content = chapter_file.read_text(encoding="utf-8")
    chapter_title = chapter_file.stem
    results = []
    for para in split_paragraphs(content):
        if not char_in_para(para, patterns):
            continue
        score = score_para(para, patterns)
        if score >= 4:
            results.append((score, chapter_title, para))
    return results


def dedupe_entries(entries, min_len=30):
    seen = set()
    out = []
    for score, chapter, para in sorted(entries, key=lambda x: (-x[0], x[1])):
        key = para[:80]
        if key in seen:
            continue
        seen.add(key)
        if len(para) >= min_len:
            out.append((score, chapter, para))
    return out


def main():
    all_data = defaultdict(list)
    files = sorted(ROOT.glob("*.txt"))
    files = [f for f in files if not f.name.startswith("000_")]

    for f in files:
        for char_name, patterns in CHARACTERS.items():
            hits = extract_for_character(f, char_name, patterns)
            all_data[char_name].extend(hits)

    lines = [
        "# 西游记（李卓吾批评本）主要人物描写摘录",
        "",
        "> 说明：从全书各回正文中自动检索提取，侧重**外貌、装束、神态、性格**相关描写。",
        "> 批语中的象征性解读（如「石猴即心」）已尽量过滤，保留可直接用于绘画参考的具象描写。",
        "",
    ]

    for char_name in CHARACTERS:
        entries = dedupe_entries(all_data[char_name])
        lines.append(f"## {char_name}")
        lines.append("")
        if not entries:
            lines.append("_（未检索到足够明确的描写段落，见文末补充）_")
            lines.append("")
            continue
        lines.append(f"共摘录 **{len(entries)}** 处相关描写。")
        lines.append("")
        for i, (score, chapter, para) in enumerate(entries[:40], 1):
            lines.append(f"### {i}. [{chapter}]")
            lines.append("")
            lines.append(para)
            lines.append("")

    lines.extend([
        "---",
        "",
        "## 使用建议（给 AI 绘图）",
        "",
        "1. **孙悟空**：重点参考「毛脸雷公相、金睛火眼、头戴金冠/凤翅紫金冠、身穿黄金甲、如意金箍棒、赤足/步云履」等关键词组合。",
        "2. **猪八戒**：重点参考「长嘴大耳、獠牙外露、黑脸短毛、九齿钉钯、大耳、臃肿体态」。",
        "3. **沙悟净**：重点参考「红发蓝面、络腮胡须、项下骷髅念珠、降妖宝杖、身披蓑衣/鹅绒氅」。",
        "4. **唐僧**：重点参考「白面俊朗、细眉长目、身着袈裟、手持锡杖、气质儒雅温和」。",
        "",
    ])

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Written: {OUT}")
    for char_name in CHARACTERS:
        print(f"  {char_name}: {len(dedupe_entries(all_data[char_name]))} entries")


if __name__ == "__main__":
    main()
