#!/usr/bin/env python3
"""Structural sanity checks for index.html: tag balance and nav-link
anchors resolving to an actual section id. Same checks that were being
run manually by hand before each merge."""
import re
import sys

with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

failures = []

for tag in ["details", "div", "section", "ul", "dl"]:
    opens = len(re.findall(rf"<{tag}[ >]", content))
    closes = len(re.findall(rf"</{tag}>", content))
    if opens != closes:
        failures.append(f"<{tag}> imbalance: {opens} open vs {closes} close")

nav_match = re.search(r'<ul class="nav-links".*?</ul>', content, re.S)
if nav_match:
    hrefs = re.findall(r'href="#([a-zA-Z0-9_-]+)"', nav_match.group(0))
    ids = set(re.findall(r'id="([a-zA-Z0-9_-]+)"', content))
    for h in hrefs:
        if h not in ids:
            failures.append(f'Nav link href="#{h}" has no matching id="{h}"')
else:
    failures.append("Could not find nav-links element to check")

if failures:
    print("::error::HTML structural check failed:")
    for f_ in failures:
        print(f"  - {f_}")
    sys.exit(1)

print("HTML structural check passed.")
