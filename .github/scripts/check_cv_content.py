#!/usr/bin/env python3
"""Sanity-check that both CV PDFs still contain the expected current-state
anchors (current role, correct previous-employer end date). Catches a bad
regeneration automatically rather than relying on someone remembering to
check by hand."""
import sys
from pypdf import PdfReader

CHECKS = {
    "Manzano_CV_Finance.pdf": ["RGP (Hong Kong)", "Oct 2023 – Aug 2026"],
    "Manzano_CV_ERP-PM.pdf": ["RGP (Hong Kong)", "Oct 2023 – Aug 2026"],
}

failures = []
for path, required in CHECKS.items():
    try:
        reader = PdfReader(path)
        text = "".join(p.extract_text() or "" for p in reader.pages)
    except Exception as e:
        failures.append(f"Could not read {path}: {e}")
        continue
    for req in required:
        if req not in text:
            failures.append(f'{path} is missing expected text: "{req}"')

if failures:
    print("::error::CV content check failed:")
    for f_ in failures:
        print(f"  - {f_}")
    sys.exit(1)

print("CV content check passed.")
