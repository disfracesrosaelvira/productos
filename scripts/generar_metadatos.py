"""
Genera data/metadatos_productos.csv a partir de las carpetas de FotosDisfraces.

Parsea de cada nombre de carpeta: nombre, precio, talla, accesorios y audiencia.
El resto de columnas quedan para revision manual (categoria, calidad, stock).
"""
import csv
import re
from pathlib import Path

BASE = Path(r"D:\17.ProyectoSistemaInventario\FotosDisfraces")
OUT = Path(r"D:\17.ProyectoSistemaInventario\data\metadatos_productos.csv")

IMG_EXT = {".jpg", ".jpeg", ".png", ".webp"}

AUDIENCIA = re.compile(
    r"^(ni[ñn][oa]|hombre|mujer|unisex)(\s+(ni[ñn][oa]|hombre|mujer|unisex))*$",
    re.IGNORECASE,
)

CATEGORIA = {
    "capit": "superheroes", "superman": "superheroes", "spiderman": "superheroes",
    "maravilla": "superheroes", "aeroman": "superheroes", "gat": "superheroes",
    "batman": "superheroes", "flash": "superheroes",
    "gekko": "series", "skye": "series", "calamar": "series", "paw": "series",
    "blanca nieves": "peliculas", "malefica": "peliculas", "pirate": "peliculas",
}


def limpiar(texto: str) -> str:
    texto = re.sub(r"\s+", " ", texto)
    texto = re.sub(r"\s*,\s*", ", ", texto)
    return texto.strip(" ,;-")


def parsear(nombre_carpeta: str):
    raw = re.sub(r"^\d+\.\s*", "", nombre_carpeta)

    talla = ""
    m = re.search(r"Talla\s+(.+?)\s*$", raw, re.IGNORECASE)
    if m:
        talla = limpiar(m.group(1))
        raw = raw[: m.start()]

    precio = ""
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*soles", raw, re.IGNORECASE)
    if m:
        precio = m.group(1).replace(",", ".")
        raw = raw[: m.start()] + raw[m.end():]

    accesorios, audiencia = [], []
    for grupo in re.findall(r"\(([^)]*)\)", raw):
        valor = limpiar(grupo)
        if not valor:
            continue
        if AUDIENCIA.match(valor):
            audiencia.append(valor.lower())
        else:
            accesorios.append(valor)
    raw = re.sub(r"\([^)]*\)", "", raw)

    nombre = limpiar(raw)
    return {
        "nombre": nombre,
        "precio_soles": precio,
        "talla": talla,
        "accesorios": " | ".join(accesorios),
        "audiencia": " | ".join(audiencia),
    }


def categoria_de(nombre: str) -> str:
    bajo = nombre.lower()
    for clave, cat in CATEGORIA.items():
        if clave in bajo:
            return cat
    return ""


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    filas = []

    for genero_dir in sorted(BASE.iterdir()):
        if not genero_dir.is_dir():
            continue
        genero = re.sub(r"^\d+\.\s*", "", genero_dir.name).lower()

        for prod_dir in sorted(genero_dir.iterdir()):
            if not prod_dir.is_dir():
                continue
            fotos = sorted(
                p.name for p in prod_dir.iterdir()
                if p.is_file() and p.suffix.lower() in IMG_EXT
            )
            datos = parsear(prod_dir.name)
            filas.append({
                "carpeta": f"{genero_dir.name}/{prod_dir.name}",
                "genero": genero,
                "nombre": datos["nombre"],
                "categoria_sugerida": categoria_de(datos["nombre"]),
                "precio_soles": datos["precio_soles"],
                "talla": datos["talla"],
                "accesorios": datos["accesorios"],
                "audiencia": datos["audiencia"],
                "num_fotos": len(fotos),
                "foto_principal": fotos[0] if fotos else "",
                "calidad_tela": "",
                "stock": "",
                "notas": "",
            })

    campos = list(filas[0].keys()) if filas else []
    with OUT.open("w", newline="", encoding="utf-8-sig") as fh:
        writer = csv.DictWriter(fh, fieldnames=campos)
        writer.writeheader()
        writer.writerows(filas)

    print(f"Escrito {OUT} con {len(filas)} productos")


if __name__ == "__main__":
    main()
