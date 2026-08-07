#!/usr/bin/env python3
"""Fail the build if any denylisted (confidential) term appears in
public-facing files. The denylist itself comes from the CONFIDENTIAL_TERMS
repo secret at runtime -- it is never committed to this repository.

Deliberately never prints the matched term value, even on failure: this
workflow's logs are public (public repo), and a substring match is not
guaranteed to be auto-redacted by GitHub's secret masking. Failures are
reported by term index and file only.
"""
import os
import sys

TERMS_RAW = os.environ.get("CONFIDENTIAL_TERMS", "").strip()

if not TERMS_RAW:
    print("::error::CONFIDENTIAL_TERMS secret is empty or not set. "
          "Refusing to proceed without a denylist configured.")
    sys.exit(1)

TERMS = [t.strip() for t in TERMS_RAW.split(",") if t.strip()]

TEXT_FILES = ["index.html", "styles.css", "script.js"]
PDF_FILES = ["Manzano_CV_Finance.pdf", "Manzano_CV_ERP-PM.pdf"]

failures = []  # (path, term_index) -- never the term value itself


def scan(path, content):
    lowered = content.lower()
    for idx, term in enumerate(TERMS):
        if term.lower() in lowered:
            failures.append((path, idx))


for path in TEXT_FILES:
    if not os.path.exists(path):
        continue
    with open(path, "r", encoding="utf-8") as f:
        scan(path, f.read())

for path in PDF_FILES:
    if not os.path.exists(path):
        continue
    try:
        from pypdf import PdfReader
        reader = PdfReader(path)
        text = "".join(p.extract_text() or "" for p in reader.pages)
    except Exception as e:
        print(f"::warning::Could not read {path}: {e}")
        continue
    scan(path, text)

if failures:
    print("::error::Confidentiality scan failed -- a denylisted term was found.")
    print("The matched value is intentionally not printed here (public log).")
    for path, idx in failures:
        print(f"  - Denylist term #{idx} found in {path}")
    print("Check locally with CONFIDENTIAL_TERMS set in your own shell to see which term matched.")
    sys.exit(1)

print(f"Confidentiality scan passed ({len(TERMS)} terms checked across "
      f"{len(TEXT_FILES)} text files and {len(PDF_FILES)} PDFs).")
