#!/usr/bin/env python3
"""
Downloads photos from Google Drive links listed in an Excel file and renames
them according to a "Profile ID" column.

Excel format expected:
    Column A: "Profile ID"        -> used as the output file name
    Column B: "Google Drive URL"  -> one or more Drive share links,
                                      separated by commas and/or whitespace/newlines

If a cell in "Google Drive URL" contains multiple links, the files are named:
    <ProfileID>.jpg, <ProfileID>-2.jpg, <ProfileID>-3.jpg, ...

Requirements (install once):
    pip install pandas openpyxl gdown requests --break-system-packages
"""

from __future__ import annotations

import argparse
import logging
import re
import sys
from pathlib import Path
from urllib.parse import urlparse, parse_qs

try:
    import pandas as pd
    import requests
except ImportError as e:
    print("=" * 60)
    print("MISSING REQUIRED PACKAGE(S).")
    print(f"Details: {e}")
    print()
    print("Please install dependencies first by double-clicking")
    print("'install_requirements.bat', then try again.")
    print("=" * 60)
    input("\nPress Enter to close this window...")
    sys.exit(1)

try:
    import gdown
except ImportError:
    gdown = None  # We'll warn about this at runtime if it's actually needed


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("photo_downloader")


# --------------------------------------------------------------------------- #
# URL parsing
# --------------------------------------------------------------------------- #

def extract_file_id(url: str) -> str | None:
    """Pull the Google Drive file ID out of any common share-link format."""
    url = url.strip()
    if "drive.google.com" not in url:
        return None

    # Format 1: https://drive.google.com/file/d/<ID>/view?usp=sharing
    match = re.search(r"/file/d/([a-zA-Z0-9_-]+)", url)
    if match:
        return match.group(1)

    # Format 2: https://drive.google.com/open?id=<ID>
    #           https://drive.google.com/uc?id=<ID>&export=download
    query_id = parse_qs(urlparse(url).query).get("id")
    if query_id:
        return query_id[0]

    return None


def split_urls(cell_value: str) -> list[str]:
    """A cell may contain multiple links separated by commas/whitespace/newlines."""
    if not cell_value or pd.isna(cell_value):
        return []
    cleaned = str(cell_value).replace("\n", " ").replace(",", " ")
    return [u.strip() for u in cleaned.split() if u.strip()]


# --------------------------------------------------------------------------- #
# Downloading
# --------------------------------------------------------------------------- #

def guess_extension(response: requests.Response, default: str = ".jpg") -> str:
    """Try to figure out a sensible file extension from the response headers."""
    content_type = response.headers.get("Content-Type", "")
    mapping = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
        "image/heic": ".heic",
    }
    return mapping.get(content_type.split(";")[0].strip().lower(), default)


def download_with_gdown(file_id: str, output_path_no_ext: Path) -> Path | None:
    """
    Preferred method: gdown correctly handles Google Drive's confirmation-token
    flow for larger files (something plain `requests` calls fail on).
    Returns the final path (with extension) on success, else None.
    """
    if gdown is None:
        return None
    try:
        result = gdown.download(
            id=file_id,
            output=str(output_path_no_ext) + ".tmp",
            quiet=True,
        )
        if not result:
            return None

        tmp_path = Path(result)

        # Work out a good extension by sniffing the downloaded bytes' header,
        # falling back to .jpg for anything unrecognized.
        ext = sniff_extension(tmp_path)
        final_path = output_path_no_ext.with_suffix(ext)
        tmp_path.rename(final_path)
        return final_path
    except Exception as e:
        log.warning(f"gdown failed for file ID {file_id}: {e}")
        return None


def sniff_extension(path: Path, default: str = ".jpg") -> str:
    """Detect image type from magic bytes so files get a correct extension."""
    try:
        with open(path, "rb") as f:
            header = f.read(12)
        if header.startswith(b"\xff\xd8\xff"):
            return ".jpg"
        if header.startswith(b"\x89PNG\r\n\x1a\n"):
            return ".png"
        if header[:6] in (b"GIF87a", b"GIF89a"):
            return ".gif"
        if header[:4] == b"RIFF" and header[8:12] == b"WEBP":
            return ".webp"
    except Exception:
        pass
    return default


def download_with_requests(file_id: str, output_path_no_ext: Path) -> Path | None:
    """Fallback method using plain requests (works for small/unrestricted files)."""
    url = f"https://drive.google.com/uc?id={file_id}&export=download"
    try:
        with requests.Session() as session:
            response = session.get(url, stream=True, timeout=30)
            response.raise_for_status()

            # Google shows an HTML "can't scan for viruses" confirmation page
            # for larger files instead of the actual content.
            if "text/html" in response.headers.get("Content-Type", ""):
                log.warning(
                    f"File {file_id} needs confirmation token (large file) - "
                    "install gdown for reliable downloads of this file."
                )
                return None

            ext = guess_extension(response)
            final_path = output_path_no_ext.with_suffix(ext)
            with open(final_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            return final_path
    except Exception as e:
        log.warning(f"requests download failed for file ID {file_id}: {e}")
        return None


def download_file(file_id: str, output_path_no_ext: Path) -> Path | None:
    """Try gdown first (handles large files), fall back to requests."""
    path = download_with_gdown(file_id, output_path_no_ext)
    if path is None:
        path = download_with_requests(file_id, output_path_no_ext)
    return path


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #

def download_photos_from_excel(excel_path: Path, output_dir: Path) -> None:
    if not excel_path.exists():
        log.error(f"Excel file not found: {excel_path}")
        sys.exit(1)

    df = pd.read_excel(excel_path)

    required_cols = {"Profile ID", "Google Drive URL"}
    if not required_cols.issubset(df.columns):
        log.error(
            f"Excel file must contain columns {required_cols}. "
            f"Found: {list(df.columns)}"
        )
        sys.exit(1)

    output_dir.mkdir(parents=True, exist_ok=True)

    total = ok = failed = skipped = 0

    for _, row in df.iterrows():
        profile_id = str(row["Profile ID"]).strip()
        if not profile_id or profile_id.lower() == "nan":
            continue

        urls = split_urls(row["Google Drive URL"])
        if not urls:
            log.warning(f"[{profile_id}] No URLs found - skipping.")
            continue

        for i, url in enumerate(urls, start=1):
            total += 1
            file_id = extract_file_id(url)
            if not file_id:
                log.warning(f"[{profile_id}] Invalid Google Drive URL: {url}")
                failed += 1
                continue

            suffix = f"-{i}" if i > 1 else ""
            output_path_no_ext = output_dir / f"{profile_id}{suffix}"

            # Skip if a file already exists with this base name (any extension)
            existing = list(output_dir.glob(f"{profile_id}{suffix}.*"))
            if existing:
                log.info(f"[{profile_id}] Already downloaded: {existing[0].name} - skipping.")
                skipped += 1
                continue

            result = download_file(file_id, output_path_no_ext)
            if result:
                log.info(f"[{profile_id}] Downloaded: {result.name}")
                ok += 1
            else:
                log.error(f"[{profile_id}] FAILED to download (file ID: {file_id})")
                failed += 1

    log.info("-" * 50)
    log.info(f"Done. Total links: {total} | Downloaded: {ok} | Skipped: {skipped} | Failed: {failed}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Download Google Drive photos listed in an Excel file.")
    parser.add_argument(
        "excel_file",
        nargs="?",
        default="Photos.xlsx",
        help="Path to the Excel file (default: Photos.xlsx in the script's folder)",
    )
    parser.add_argument(
        "-o", "--output-dir",
        default=None,
        help="Folder to save downloaded photos into (default: 'downloaded_photos' next to the script)",
    )
    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    excel_path = Path(args.excel_file)
    if not excel_path.is_absolute():
        excel_path = script_dir / excel_path

    output_dir = Path(args.output_dir) if args.output_dir else script_dir / "downloaded_photos"

    download_photos_from_excel(excel_path, output_dir)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        log.error(f"Unexpected error: {e}")
    finally:
        # Keep the window open when double-clicked on Windows so the user
        # can actually read the results instead of the window flashing shut.
        input("\nPress Enter to close this window...")
