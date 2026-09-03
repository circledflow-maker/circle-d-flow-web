"""Restore FAT32 primary boot sector from backup (sector 6) — no format."""
from __future__ import annotations

import struct
import sys

SECTOR = 512


def read_sector(f, n: int) -> bytes:
    f.seek(n * SECTOR)
    return f.read(SECTOR)


def write_sector(f, n: int, data: bytes) -> None:
    f.seek(n * SECTOR)
    f.write(data)


def valid_fat32_boot(sector: bytes) -> bool:
    return (
        len(sector) == SECTOR
        and sector[510:512] == b"\x55\xAA"
        and sector[82:90].startswith(b"FAT32")
    )


def main() -> int:
    drive = sys.argv[1] if len(sys.argv) > 1 else r"\\.\F:"
    print(f"Opening {drive} for boot-sector repair...")
    with open(drive, "r+b") as f:
        s0 = read_sector(f, 0)
        s6 = read_sector(f, 6)
        print(f"Sector 0 valid: {valid_fat32_boot(s0)}")
        print(f"Sector 6 valid: {valid_fat32_boot(s6)}")
        if not valid_fat32_boot(s6):
            print("ERROR: Backup boot sector (6) is not valid FAT32 — aborting.")
            return 1
        if valid_fat32_boot(s0):
            print("Primary boot sector already valid — nothing to do.")
            return 0
        # Preserve volume serial if primary had one (optional; backup is fine)
        write_sector(f, 0, s6)
        f.flush()
    print("OK: Restored sector 6 -> sector 0. Run chkdsk F: /F next.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
