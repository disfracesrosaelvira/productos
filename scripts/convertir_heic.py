"""
Convierte todas las fotos .heic de FotosDisfraces a .jpg.

- Respeta la orientacion EXIF.
- Calidad 90 (suficiente para catalogo web).
- Mueve el HEIC original a una carpeta de respaldo (no se borra).
"""
import shutil
import sys
from pathlib import Path

import pillow_heif
from PIL import Image, ImageOps

pillow_heif.register_heif_opener()

BASE = Path(r"D:\17.ProyectoSistemaInventario\FotosDisfraces")
BACKUP = Path(r"C:\Users\YESIN\AppData\Local\Temp\opencode\heic_backup")
BACKUP.mkdir(parents=True, exist_ok=True)


def main() -> int:
    heics = sorted(
        [p for p in BASE.rglob("*") if p.suffix.lower() in (".heic", ".heif")]
    )
    if not heics:
        print("No hay archivos HEIC. Nada que hacer.")
        return 0

    print(f"Encontrados {len(heics)} HEIC")
    ok, fail = 0, 0

    for src in heics:
        dst = src.with_suffix(".jpg")
        try:
            with Image.open(src) as img:
                img = ImageOps.exif_transpose(img)
                if img.mode not in ("RGB", "L"):
                    img = img.convert("RGB")
                img.save(dst, "JPEG", quality=90, optimize=True)

            if not dst.exists() or dst.stat().st_size == 0:
                raise RuntimeError("Salida vacia")

            rel = src.relative_to(BASE)
            backup_target = BACKUP / rel
            backup_target.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(src), str(backup_target))
            ok += 1
            print(f"  OK  {rel}  ->  {dst.name}  ({dst.stat().st_size // 1024} KB)")
        except Exception as exc:  # noqa: BLE001
            fail += 1
            print(f"  ERR {src}: {exc}", file=sys.stderr)

    print(f"\nConvertidos: {ok} | Errores: {fail}")
    print(f"Respaldos HEIC en: {BACKUP}")
    return 1 if fail else 0


if __name__ == "__main__":
    raise SystemExit(main())
