"""
Normaliza los nombres de carpetas de FotosDisfraces.

- Renombra las carpetas de genero a nombres consistentes (Niño/Niña/Hombre/Mujer).
- Corrige typos conocidos y espacios dobles.
- Es idempotente: si ya esta renombrado, no hace nada.
"""
from pathlib import Path

BASE = Path(r"D:\17.ProyectoSistemaInventario\FotosDisfraces")

# genero actual -> genero normalizado
GENEROS = {
    "1.Boy_man": "1.Niño",
    "2.Girl_woman": "2.Niña",
    "3.Hombre_adulto": "3.Hombre",
    "4.Mujer_adulta": "4.Mujer",
}

# nombre de carpeta de producto actual -> corregido (sin el prefijo de genero)
RENOMBRES = {
    "2.Capitan américa 45 soles (escudo,chaqueta,pantalón) Talla 4-8":
        "2.Capitán América 45 soles (escudo,chaqueta,pantalón) Talla 4-8",
    "3.Gekko polinan 50 soles (eneterizo, mascara,cola) Talla 4-8":
        "3.Gekko polinan 50 soles (enterizo, mascara, cola) Talla 4-8",
    "4.Skye Paw Patrol  Aviadora (niña mujer)":
        "4.Skye Paw Patrol Aviadora (niña mujer)",
    "5.Blanca Nieves tela razo modelo 1 (niña mujer)":
        "5.Blanca Nieves tela raso modelo 1 (niña mujer)",
    "1.Aeoroman Hombre adulto 55 soles (mascara,polo,pantalón) Talla 14":
        "1.Aeroman Hombre adulto 55 soles (mascara,polo,pantalón) Talla 14",
    "2.Preso Reo Hombre adulto 60 soles  (gorro,polo,pantalón) Talla M":
        "2.Preso Reo Hombre adulto 60 soles (gorro,polo,pantalón) Talla M",
    "1.Gatubela 90 soles (mascara, correa,cola) Talla Small":
        "1.Gatúbela 90 soles (mascara, correa, cola) Talla Small",
}


def main() -> None:
    # 1) renombrar generos
    for old, new in GENEROS.items():
        src, dst = BASE / old, BASE / new
        if src.exists() and not dst.exists():
            src.rename(dst)
            print(f"[genero] {old}  ->  {new}")
        else:
            print(f"[genero] {old}: sin cambios")

    # 2) renombrar productos dentro de cada genero normalizado
    for genero in GENEROS.values():
        gpath = BASE / genero
        if not gpath.is_dir():
            continue
        for sub in list(gpath.iterdir()):
            if not sub.is_dir():
                continue
            if sub.name in RENOMBRES:
                dst = sub.parent / RENOMBRES[sub.name]
                if not dst.exists():
                    sub.rename(dst)
                    print(f"[producto] {sub.name}  ->  {dst.name}")

    print("Normalizacion terminada.")


if __name__ == "__main__":
    main()
