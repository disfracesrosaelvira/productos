"""
Fase 2 - Carga masiva a Supabase.

Por cada producto del CSV:
  1. Comprime las fotos a WebP (max. IMG_MAX_SIZE px, calidad IMG_QUALITY).
  2. Sube las fotos al bucket de Storage (con upsert, idempotente).
  3. Inserta/actualiza el producto, sus imagenes y su variante en PostgreSQL.

Uso:
    python scripts/cargar_supabase.py --dry-run
    python scripts/cargar_supabase.py
    python scripts/cargar_supabase.py --limit 2

Requiere un archivo .env con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.
"""
from __future__ import annotations

import argparse
import csv
import io
import os
import re
import sys
import unicodedata
from pathlib import Path

from PIL import Image, ImageOps

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_CSV = BASE_DIR / "data" / "metadatos_productos.csv"
DEFAULT_FOTOS = BASE_DIR / "FotosDisfraces"

GENERO_SKU = {"niño": "NIN", "niña": "NINA", "hombre": "HOM", "mujer": "MUJ", "unisex": "UNI"}
IMG_EXT = {".jpg", ".jpeg", ".png", ".webp"}
ALIAS_CATEGORIA = {"haloween": "halloween"}


def slugify(texto: str) -> str:
    texto = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    texto = re.sub(r"[^\w\s-]", "", texto).strip().lower()
    return re.sub(r"[\s_-]+", "-", texto).strip("-")


def comprimir_webp(src: Path, max_size: int, quality: int) -> bytes:
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im)
        if im.mode not in ("RGB", "L"):
            im = im.convert("RGB")
        im.thumbnail((max_size, max_size), Image.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, "WEBP", quality=quality, method=6)
        return buf.getvalue()


def leer_csv(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8-sig", newline="") as fh:
        return list(csv.DictReader(fh))


def fotos_de_producto(fotos_dir: Path, carpeta: str) -> list[Path]:
    directorio = fotos_dir / carpeta
    return sorted(p for p in directorio.iterdir() if p.suffix.lower() in IMG_EXT)


def normalizar_slug_categoria(valor: str) -> str:
    slug = slugify(valor)
    return ALIAS_CATEGORIA.get(slug, slug)


def tallas_de(row: dict) -> list[str]:
    partes = re.split(r"[;,]", row.get("talla") or "")
    tallas = [p.strip() for p in partes if p.strip()]
    return tallas or [""]


def prefijo_sku(row: dict, carpeta_producto: str) -> str:
    m = re.match(r"^(\d+)", carpeta_producto)
    num = m.group(1).zfill(2) if m else "00"
    return f"{GENERO_SKU.get(row['genero'], 'GEN')}-{num}"


def conectar():
    from dotenv import load_dotenv
    from supabase import create_client

    load_dotenv(BASE_DIR / ".env")
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        sys.exit("ERROR: faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env")
    return create_client(url, key), url


def asegurar_bucket(client, bucket: str) -> None:
    try:
        client.storage.create_bucket(bucket, options={"public": True})
        print(f"[bucket] creado: {bucket}")
    except Exception:  # ya existe
        pass


def mapa_categorias(client) -> dict[str, str]:
    resp = client.table("categories").select("id, slug").execute()
    return {c["slug"]: c["id"] for c in (resp.data or [])}


def precio_de(row: dict):
    valor = str(row.get("precio_soles") or "").strip().replace(",", ".")
    try:
        return float(valor) if valor else None
    except ValueError:
        return None


def obtener_o_crear_producto(client, row, category_id):
    precio = precio_de(row)
    resp = client.table("products").select("id").eq("name", row["nombre"]).limit(1).execute()
    if resp.data:
        prod_id = resp.data[0]["id"]
        client.table("products").update({
            "category_id": category_id,
            "price": precio,
        }).eq("id", prod_id).execute()
        return prod_id, False

    resp = client.table("products").insert({
        "name": row["nombre"],
        "description": row.get("notas") or None,
        "category_id": category_id,
        "price": precio,
        "active": True,
    }).execute()
    return resp.data[0]["id"], True


def procesar(client, url, bucket, row, fotos_dir, max_size, quality, dry_run) -> dict:
    carpeta = row["carpeta"]
    genero_slug = slugify(row["genero"])
    prod_slug = slugify(row["nombre"])[:60] or "producto"
    fotos = fotos_de_producto(fotos_dir, carpeta)

    resultado = {"producto": row["nombre"], "nuevo": None, "fotos": 0, "detalle": ""}

    if dry_run:
        resultado["fotos"] = len(fotos)
        resultado["detalle"] = (
            f"[dry-run] {len(tallas_de(row))} tallas | "
            f"{len(fotos)} fotos -> {genero_slug}/{prod_slug}/"
        )
        return resultado

    category_id = None
    if row.get("categoria_sugerida"):
        cat_slug = normalizar_slug_categoria(row["categoria_sugerida"])
        category_id = mapa_categorias(client).get(cat_slug)

    prod_id, creado = obtener_o_crear_producto(client, row, category_id)
    resultado["nuevo"] = creado

    # limpiar imagenes previas del producto (idempotencia)
    client.table("product_images").delete().eq("product_id", prod_id).execute()

    urls = []
    for i, foto in enumerate(fotos):
        data = comprimir_webp(foto, max_size, quality)
        dest = f"{genero_slug}/{prod_slug}/{i:02d}-{slugify(foto.stem)}.webp"
        client.storage.from_(bucket).upload(
            dest, data,
            file_options={"content-type": "image/webp", "upsert": "true"},
        )
        public_url = client.storage.from_(bucket).get_public_url(dest)
        urls.append((public_url, i))

    if urls:
        client.table("products").update({"image_url": urls[0][0]}).eq("id", prod_id).execute()
        client.table("product_images").insert([
            {"product_id": prod_id, "image_url": u, "is_primary": i == 0, "position": i}
            for u, i in urls
        ]).execute()
    resultado["fotos"] = len(urls)

    # variantes: una por cada talla (el stock del CSV aplica a cada talla)
    stock = row.get("stock")
    stock = int(stock) if str(stock).strip().isdigit() else 0
    prefijo = prefijo_sku(row, carpeta.split("/")[-1])
    nuevos_skus = []
    for talla in tallas_de(row):
        sku = f"{prefijo}-{slugify(talla) or 'unica'}".upper()
        nuevos_skus.append(sku)
        client.table("variants").upsert({
            "product_id": prod_id,
            "size": talla or None,
            "gender": row["genero"],
            "fabric_quality": row.get("calidad_tela") or None,
            "sku": sku,
            "stock_quantity": stock,
        }, on_conflict="sku").execute()

    # eliminar variantes obsoletas (tallas que ya no estan en el CSV)
    existentes = client.table("variants").select("id, sku").eq("product_id", prod_id).execute().data or []
    for v in existentes:
        if v["sku"] not in nuevos_skus:
            client.table("variants").delete().eq("id", v["id"]).execute()

    resultado["detalle"] = f"{len(nuevos_skus)} tallas ({', '.join(nuevos_skus)}) | {len(urls)} fotos"
    return resultado


def main() -> int:
    ap = argparse.ArgumentParser(description="Carga masiva de disfraces a Supabase")
    ap.add_argument("--csv", type=Path, default=DEFAULT_CSV)
    ap.add_argument("--fotos", type=Path, default=DEFAULT_FOTOS)
    ap.add_argument("--bucket", default=os.getenv("SUPABASE_BUCKET", "disfraces"))
    ap.add_argument("--limit", type=int, default=0, help="procesar solo N productos")
    ap.add_argument("--dry-run", action="store_true", help="no conecta ni sube nada")
    args = ap.parse_args()

    max_size = int(os.getenv("IMG_MAX_SIZE", "1600"))
    quality = int(os.getenv("IMG_QUALITY", "80"))

    filas = leer_csv(args.csv)
    if args.limit:
        filas = filas[: args.limit]
    if not filas:
        sys.exit(f"No hay filas en {args.csv}")

    client = url = None
    if not args.dry_run:
        client, url = conectar()
        asegurar_bucket(client, args.bucket)

    print(f"{'DRY-RUN' if args.dry_run else 'CARGA'} de {len(filas)} productos "
          f"(bucket '{args.bucket}', WebP max {max_size}px q{quality})\n")

    ok = errores = 0
    for row in filas:
        try:
            res = procesar(client, url, args.bucket, row, args.fotos, max_size, quality, args.dry_run)
            estado = "nuevo" if res["nuevo"] else ("reuso" if res["nuevo"] is False else "-")
            print(f"  OK  {res['producto']:<45} [{estado}] {res['detalle']}")
            ok += 1
        except Exception as exc:  # noqa: BLE001
            print(f"  ERR {row.get('nombre')}: {exc}", file=sys.stderr)
            errores += 1

    print(f"\nResumen: {ok} OK, {errores} errores, {len(filas)} total")
    return 1 if errores else 0


if __name__ == "__main__":
    raise SystemExit(main())
