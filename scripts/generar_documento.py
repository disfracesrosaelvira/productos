# -*- coding: utf-8 -*-
"""
Genera la documentacion Word del Sistema de Inventario de Disfraces.
Salida: docs/Documentacion_Sistema_Inventario_Disfraces.docx

Incluye: portada, indice, objetivos, alcances, diagramas (Mermaid renderizados),
mockups de baja y alta fidelidad, modelo de datos, logica de trazabilidad,
backend, frontend, seguridad, despliegue, manual de uso y anexos.
"""
import base64
import os
import textwrap
import urllib.request
import urllib.error
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

ROOT = Path(r"D:\17.ProyectoSistemaInventario")
TMP = Path(r"C:\Users\YESIN\AppData\Local\Temp\opencode\docgen")
TMP.mkdir(parents=True, exist_ok=True)
OUT = ROOT / "docs" / "Documentacion_Sistema_Inventario_Disfraces.docx"
OUT.parent.mkdir(parents=True, exist_ok=True)

FONTS = r"C:\Windows\Fonts"


def font(sz, bold=False):
    name = "arialbd.ttf" if bold else "arial.ttf"
    try:
        return ImageFont.truetype(os.path.join(FONTS, name), sz)
    except Exception:
        return ImageFont.load_default()


# =====================================================================
# 1. DIAGRAMAS MERMAID
# =====================================================================
DIAGRAMAS = {
    "arquitectura": """flowchart TB
    subgraph Users["Usuarios"]
        U1["Personal de inventario"]
        U2["Cliente final (futuro)"]
    end
    subgraph FE["Frontend - GitHub Pages"]
        SV["App Svelte 5 + Vite + Tailwind"]
    end
    subgraph BE["Backend - Railway"]
        API["API Fastify (Node.js 22)"]
        SH["sharp - procesa imagenes"]
    end
    subgraph SB["Supabase"]
        PG[("PostgreSQL 15 + RLS")]
        ST["Storage - bucket disfraces"]
        RT["Realtime - WebSockets"]
        AU["Auth"]
        CR["pg_cron - tareas"]
    end
    U1 --> SV
    U2 -.-> SV
    SV -- "JWT / REST" --> API
    SV -- "Realtime directo" --> RT
    SV -- "upload fotos" --> ST
    API --> PG
    API --> ST
    API --> AU
    API --> SH
    PG -- "eventos" --> RT
    CR --> PG""",

    "subida_fotos": """sequenceDiagram
    participant U as Usuario
    participant S as Svelte
    participant ST as Supabase Storage
    participant API as API Fastify
    participant DB as PostgreSQL
    participant RT as Realtime
    U->>S: Selecciona/toma foto
    S->>S: Comprime (browser-image-compression a WebP)
    S->>API: POST /products/:id/images (multipart)
    API->>API: sharp redimensiona y convierte a WebP
    API->>ST: upload() a bucket disfraces
    ST-->>API: URL publica
    API->>DB: INSERT product_images
    DB->>RT: Evento INSERT
    RT-->>S: Notificacion WebSocket
    S-->>U: UI actualizada""",

    "stock": """sequenceDiagram
    participant V as Vendedor
    participant S as Svelte
    participant API as API Fastify
    participant DB as PostgreSQL
    participant RT as Realtime
    participant C as Otros clientes
    V->>S: Registrar venta
    S->>API: POST /sales (items)
    API->>DB: INSERT sales + sale_items
    DB->>DB: TRIGGER restar_stock (valida y descuenta)
    DB->>DB: TRIGGER recalcular_total_venta
    DB->>RT: Evento UPDATE en variants
    RT-->>S: WebSocket
    RT-->>C: WebSocket
    S-->>V: Confirmacion visual
    C-->>C: UI actualizada sin recargar""",

    "bajo_nivel": """flowchart LR
    subgraph FE["Frontend Svelte"]
        A1["Login"]
        A2["Catalogo"]
        A3["Detalle"]
        A4["Nuevo/Editar + fotos"]
        A5["Ventas"]
        A6["Reportes"]
        A7["Realtime listener"]
    end
    subgraph BE["Backend Fastify"]
        B1["Auth middleware (JWT)"]
        B2["/products"]
        B3["/variants"]
        B4["/sales"]
        B5["/reports"]
        B6["sharp (imagenes)"]
    end
    subgraph SB["Supabase"]
        C1["PostgreSQL + RLS"]
        C2["Storage"]
        C3["Realtime"]
        C4["Auth"]
    end
    A1 --> C4
    A2 --> B2
    A3 --> B2
    A4 --> B2
    A4 --> B6
    A5 --> B4
    A6 --> B5
    A7 --> C3
    B2 --> C1
    B3 --> C1
    B4 --> C1
    B5 --> C1
    B6 --> C2""",

    "er": """erDiagram
    CATEGORIES ||--o{ PRODUCTS : clasifica
    PRODUCTS ||--o{ VARIANTS : tiene
    PRODUCTS ||--o{ PRODUCT_IMAGES : posee
    PRODUCTS ||--o{ PRODUCT_TAGS : etiqueta
    TAGS ||--o{ PRODUCT_TAGS : aplica
    VARIANTS ||--o{ SALE_ITEMS : vendido_en
    SALES ||--o{ SALE_ITEMS : contiene
    PROFILES ||--o{ SALES : registra
    CATEGORIES {
        uuid id PK
        text name
        text slug
        uuid parent_id FK
    }
    PRODUCTS {
        uuid id PK
        text name
        text description
        text image_url
        numeric price
        uuid category_id FK
        boolean active
    }
    VARIANTS {
        uuid id PK
        uuid product_id FK
        text size
        text gender
        text fabric_quality
        text sku UK
        int stock_quantity
    }
    PRODUCT_IMAGES {
        uuid id PK
        uuid product_id FK
        text image_url
        boolean is_primary
        int position
    }
    SALES {
        uuid id PK
        date sale_date
        numeric total_amount
        text customer
        uuid user_id FK
    }
    SALE_ITEMS {
        uuid id PK
        uuid sale_id FK
        uuid variant_id FK
        int quantity
        numeric unit_price
    }
    PROFILES {
        uuid id PK
        text email
        text role
    }""",

    "despliegue": """flowchart LR
    subgraph DEV["Desarrollo local"]
        L1["Vite dev :5173"]
        L2["Fastify dev :3000"]
    end
    subgraph GH["GitHub"]
        R["Repo productos"]
        AC["GitHub Actions"]
    end
    subgraph PROD["Produccion"]
        P1["GitHub Pages (frontend)"]
        P2["Railway (backend)"]
    end
    S1["Supabase Cloud (DB, Storage, Auth, Realtime)"]
    R --> AC
    AC --> P1
    R --> P2
    P1 -- "HTTPS + JWT" --> P2
    P2 --> S1
    P1 -- "Realtime/Storage" --> S1""",
}


def render_mermaid(name, code):
    path = TMP / f"diag_{name}.png"
    if path.exists():
        return path
    b64 = base64.urlsafe_b64encode(code.encode("utf-8")).decode("ascii")
    url = f"https://mermaid.ink/img/{b64}?type=png&bgColor=FFFFFF"
    for intento in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=40) as r:
                path.write_bytes(r.read())
            return path
        except Exception as exc:  # noqa: BLE001
            print(f"  reintento {name}: {exc}")
    print(f"  NO se pudo renderizar {name}")
    return None


# =====================================================================
# 2. MOCKUPS (Pillow) - baja y alta fidelidad
# =====================================================================
W, H = 1000, 700


def pal(hi):
    if hi:
        return dict(ink=(15, 23, 42), muted=(100, 116, 139), line=(203, 213, 225),
                    bg=(241, 245, 249), card=(255, 255, 255), accent=(124, 58, 237),
                    accent2=(236, 72, 153), chip=(226, 232, 240), header=(15, 23, 42),
                    htext=(255, 255, 255), ok=(16, 185, 129), warn=(245, 158, 11),
                    bad=(239, 68, 68), img=(219, 227, 238))
    return dict(ink=(45, 45, 45), muted=(130, 130, 130), line=(180, 180, 180),
                bg=(255, 255, 255), card=(252, 252, 252), accent=(95, 95, 95),
                accent2=(130, 130, 130), chip=(235, 235, 235), header=(70, 70, 70),
                htext=(255, 255, 255), ok=(95, 95, 95), warn=(95, 95, 95),
                bad=(95, 95, 95), img=(238, 238, 238))


def rr(d, box, fill=None, outline=None, w=1, r=0):
    if r:
        d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=w)
    else:
        d.rectangle(box, fill=fill, outline=outline, width=w)


def txt(d, xy, s, sz=14, bold=False, fill=(0, 0, 0), anchor="la"):
    d.text(xy, s, font=font(sz, bold), fill=fill, anchor=anchor)


def field(d, box, label, c, hi, placeholder=""):
    rr(d, box, fill=c["card"], outline=c["line"], r=6)
    txt(d, (box[0] + 10, box[1] + 8), label, 12, True, c["ink"])
    txt(d, (box[0] + 10, box[1] + 26), placeholder, 12, False, c["muted"], anchor="la")


def button(d, box, label, c, hi, kind="primary"):
    if hi and kind == "primary":
        fill = c["accent"]
    elif hi and kind == "danger":
        fill = c["bad"]
    elif hi and kind == "ghost":
        fill = c["card"]
    else:
        fill = c["accent"]
    rr(d, box, fill=fill, outline=c["line"], r=6)
    txt(d, ((box[0] + box[2]) / 2, (box[1] + box[3]) / 2), label, 13, True,
        c["htext"] if kind != "ghost" else c["ink"], anchor="mm")


def img_placeholder(d, box, c, hi, label="foto"):
    rr(d, box, fill=c["img"], outline=c["line"], r=6)
    if not hi:
        d.line((box[0], box[1], box[2], box[3]), fill=c["line"], width=1)
        d.line((box[0], box[3], box[2], box[1]), fill=c["line"], width=1)
    else:
        txt(d, ((box[0] + box[2]) / 2, (box[1] + box[3]) / 2), "[ foto ]", 16,
            fill=c["muted"], anchor="mm")


def base_screen(titulo, hi):
    c = pal(hi)
    img = Image.new("RGB", (W, H), c["bg"])
    d = ImageDraw.Draw(img)
    rr(d, (0, 0, W, 56), fill=c["header"])
    txt(d, (20, 28), "Inventario de Disfraces", 18, True, c["htext"], anchor="lm")
    for i, t in enumerate(["Catálogo", "Ventas", "Reportes"]):
        txt(d, (330 + i * 110, 28), t, 14, False, c["htext"], anchor="lm")
    txt(d, (W - 20, 28), "salir", 13, False, c["htext"], anchor="rm")
    if titulo:
        txt(d, (30, 84), titulo, 22, True, c["ink"])
    return img, d, c


def mock_login(hi):
    c = pal(hi)
    img = Image.new("RGB", (W, H), c["header"] if hi else c["bg"])
    d = ImageDraw.Draw(img)
    card = (W / 2 - 180, 150, W / 2 + 180, 560)
    rr(d, card, fill=c["card"], outline=c["line"], r=16)
    rr(d, (W / 2 - 34, 172, W / 2 + 34, 240), fill=c["accent"], r=14)
    txt(d, (W / 2, 260), "Inventario de Disfraces", 20, True, c["ink"], anchor="mm")
    txt(d, (W / 2, 288), "Control interno", 13, fill=c["muted"], anchor="mm")
    field(d, (W / 2 - 140, 320, W / 2 + 140, 370), "Correo", c, hi, "tu@correo.com")
    field(d, (W / 2 - 140, 390, W / 2 + 140, 440), "Contraseña", c, hi, "••••••••")
    button(d, (W / 2 - 140, 470, W / 2 + 140, 515), "Ingresar", c, hi)
    return img


def mock_catalogo(hi):
    img, d, c = base_screen("Catálogo de disfraces", hi)
    button(d, (W - 210, 70, W - 30, 108), "+ Nuevo producto", c, hi)
    rr(d, (30, 126, W - 30, 180), fill=c["card"], outline=c["line"], r=8)
    field(d, (44, 136, 430, 170), "Buscar", c, hi, "por nombre…")
    rr(d, (444, 136, 590, 170), fill=c["card"], outline=c["line"], r=6)
    txt(d, (454, 145), "Todas las categorías v", 12, fill=c["muted"])
    rr(d, (600, 136, 730, 170), fill=c["card"], outline=c["line"], r=6)
    txt(d, (610, 145), "Todos los géneros v", 12, fill=c["muted"])
    button(d, (740, 136, 830, 170), "Buscar", c, hi)
    button(d, (840, 136, 970, 170), "Limpiar", c, hi, "ghost")
    nombres = ["Capitán América", "Spiderman", "Mujer Maravilla", "Gekko",
               "Maléfica", "Skye Paw Patrol", "Blanca Nieves", "Gatúbela"]
    precios = ["S/ 45.00", "S/ 40.00", "S/ 40.00", "S/ 50.00",
               "S/ 150.00", "S/ 45.00", "S/ 45.00", "S/ 90.00"]
    x0, y0, cw, chh, gap = 30, 200, 220, 230, 16
    for i in range(8):
        r, col = divmod(i, 4)
        x = x0 + col * (cw + gap)
        y = y0 + r * (chh + gap)
        rr(d, (x, y, x + cw, y + chh), fill=c["card"], outline=c["line"], r=10)
        img_placeholder(d, (x + 8, y + 8, x + cw - 8, y + 145), c, hi)
        txt(d, (x + 12, y + 160), nombres[i], 13, True, c["ink"])
        txt(d, (x + 12, y + 184), precios[i], 13, True, c["ink"])
        txt(d, (x + cw - 12, y + 184), "8 und.", 11, fill=c["ok"], anchor="ra")
        rr(d, (x + 12, y + 206, x + 70, y + 222), fill=c["chip"], r=4)
    return img


def mock_detalle(hi):
    img, d, c = base_screen("", hi)
    txt(d, (30, 70), "← Volver", 13, fill=c["muted"])
    img_placeholder(d, (30, 100, 480, 520), c, hi)
    button(d, (410, 108, 470, 138), "Ampliar", c, hi, "ghost")
    for i in range(4):
        box = (30 + i * 90, 534, 106 + i * 90, 610)
        rr(d, box, fill=c["img"], outline=c["accent"] if i == 0 else c["line"], w=2 if i == 0 else 1, r=6)
    txt(d, (520, 110), "Capitán América", 24, True, c["ink"])
    rr(d, (520, 148, 660, 172), fill=c["chip"], r=4)
    txt(d, (528, 152), "Superhéroes", 12, fill=c["ink"])
    txt(d, (520, 190), "S/ 45.00", 22, True, c["ink"])
    txt(d, (520, 240), "Tallas / variantes", 15, True, c["ink"])
    cols = ["SKU", "Talla", "Género", "Tela", "Stock"]
    for i, h in enumerate(cols):
        txt(d, (525 + i * 88, 272), h, 11, True, c["muted"])
    filas = [("SUP-NIN-4", "4", "niño", "polinan", "5"),
             ("SUP-NIN-6", "6", "niño", "polinan", "4"),
             ("SUP-NIN-8", "8", "niño", "polinan", "3")]
    for j, fila in enumerate(filas):
        for i, v in enumerate(fila):
            txt(d, (525 + i * 88, 300 + j * 30), v, 11, fill=c["ink"])
    button(d, (520, 420, 600, 456), "Editar", c, hi)
    button(d, (615, 420, 720, 456), "Eliminar", c, hi, "danger")
    return img


def mock_nuevo(hi):
    img, d, c = base_screen("Nuevo producto", hi)
    field(d, (30, 130, 970, 180), "Nombre", c, hi, "Capitán América")
    field(d, (30, 194, 470, 244), "Precio (S/)", c, hi, "45.00")
    rr(d, (500, 194, 970, 244), fill=c["card"], outline=c["line"], r=6)
    txt(d, (510, 202), "Categoría", 12, True, c["ink"])
    txt(d, (510, 220), "Superhéroes v", 12, fill=c["muted"])
    rr(d, (30, 262, 970, 360), fill=c["card"], outline=c["line"], r=8)
    txt(d, (44, 272), "Variante (talla / género / stock)", 12, True, c["muted"])
    for i, (lbl, val) in enumerate([("Talla", "4 v"), ("Género", "Niño v"), ("Cantidad", "5")]):
        rr(d, (44 + i * 305, 296, 316 + i * 305, 344), fill=c["card"], outline=c["line"], r=6)
        txt(d, (54 + i * 305, 302), lbl, 11, True, c["ink"])
        txt(d, (54 + i * 305, 320), val, 12, fill=c["muted"])
    txt(d, (44, 372), "[ ] Comentar calidad de la tela (opcional)", 12, fill=c["ink"])
    txt(d, (44, 400), "[ ] Agregar comentario (opcional)", 12, fill=c["ink"])
    txt(d, (44, 428), "[x] Activo", 12, fill=c["ink"])
    txt(d, (30, 466), "Fotos (1 a 3)", 13, True, c["ink"])
    button(d, (30, 490, 170, 528), "Tomar foto", c, hi)
    button(d, (185, 490, 360, 528), "Desde galería", c, hi, "ghost")
    for i in range(3):
        img_placeholder(d, (30 + i * 96, 544, 116 + i * 96, 634), c, hi)
    button(d, (760, 600, 970, 644), "Crear y subir fotos", c, hi)
    return img


def mock_ventas(hi):
    img, d, c = base_screen("Registrar venta", hi)
    rr(d, (30, 126, 490, 300), fill=c["card"], outline=c["line"], r=10)
    txt(d, (44, 138), "Agregar producto", 14, True, c["ink"])
    rr(d, (44, 170, 476, 216), fill=c["card"], outline=c["line"], r=6)
    txt(d, (54, 186), "Spiderman · 6 · niño (stock 6) v", 12, fill=c["muted"])
    field(d, (44, 230, 130, 276), "Cantidad", c, hi, "1")
    button(d, (150, 230, 260, 276), "Agregar", c, hi)
    rr(d, (510, 126, 970, 460), fill=c["card"], outline=c["line"], r=10)
    txt(d, (524, 138), "Carrito (1)", 14, True, c["ink"])
    txt(d, (524, 176), "Spiderman · 6 · niño", 13, fill=c["ink"])
    txt(d, (524, 200), "1 × S/ 40.00", 13, fill=c["muted"])
    rr(d, (524, 240, 956, 284), fill=c["card"], outline=c["line"], r=6)
    txt(d, (534, 256), "Cliente (opcional)", 12, fill=c["muted"])
    txt(d, (524, 320), "Total: S/ 40.00", 16, True, c["ink"])
    button(d, (720, 308, 956, 350), "Registrar venta", c, hi)
    rr(d, (30, 320, 490, 510), fill=c["card"], outline=c["line"], r=10)
    txt(d, (44, 332), "Últimas ventas", 14, True, c["ink"])
    for i in range(3):
        y = 368 + i * 40
        txt(d, (44, y), f"0{i+4}/10/2026", 12, fill=c["ink"])
        txt(d, (180, y), "Cliente " + str(i + 1), 12, fill=c["muted"])
        txt(d, (440, y), f"S/ {40 + i*10}.00", 12, True, c["ink"], anchor="ra")
    return img


def mock_reportes(hi):
    img, d, c = base_screen("Reportes", hi)
    rr(d, (30, 126, 970, 186), fill=c["card"], outline=c["line"], r=8)
    for i, lbl in enumerate(["Desde", "Hasta"]):
        field(d, (44 + i * 300, 136, 300 + i * 300, 176), lbl, c, hi, "2026-10-01")
    button(d, (650, 136, 740, 176), "Aplicar", c, hi)
    rr(d, (30, 202, 490, 300), fill=c["card"], outline=c["line"], r=10)
    txt(d, (48, 218), "Ventas en el periodo", 13, fill=c["muted"])
    txt(d, (48, 242), "18", 34, True, c["ink"])
    rr(d, (510, 202, 970, 300), fill=c["card"], outline=c["line"], r=10)
    txt(d, (528, 218), "Monto total", 13, fill=c["muted"])
    txt(d, (528, 242), "S/ 1,240.00", 34, True, c["ok"])
    rr(d, (30, 316, 490, 640), fill=c["card"], outline=c["line"], r=10)
    txt(d, (44, 330), "Bajo stock (<= 3)", 14, True, c["ink"])
    for i, (n, s) in enumerate([("Gatúbela · Small", 1), ("Reo americano · M", 2),
                                ("Gekko · 8", 3), ("Lady boo · 4", 3)]):
        txt(d, (44, 368 + i * 34), n, 12, fill=c["ink"])
        txt(d, (470, 368 + i * 34), str(s), 12, True, c["bad"], anchor="ra")
    rr(d, (510, 316, 970, 640), fill=c["card"], outline=c["line"], r=10)
    txt(d, (524, 330), "Más vendidos", 14, True, c["ink"])
    for i, (n, u) in enumerate([("Spiderman sublimado", 12), ("Capitán América", 9),
                                ("Maléfica", 7), ("Skye Paw Patrol", 5)]):
        txt(d, (524, 368 + i * 34), n, 12, fill=c["ink"])
        txt(d, (950, 368 + i * 34), f"{u} und.", 12, True, c["ink"], anchor="ra")
    return img


MOCKUPS = {
    "login": ("Login", mock_login),
    "catalogo": ("Catálogo", mock_catalogo),
    "detalle": ("Detalle de producto", mock_detalle),
    "nuevo": ("Alta de producto", mock_nuevo),
    "ventas": ("Ventas", mock_ventas),
    "reportes": ("Reportes", mock_reportes),
}


def generar_mockups():
    rutas = {}
    for key, (titulo, fn) in MOCKUPS.items():
        for hi in (False, True):
            suf = "hi" if hi else "lo"
            p = TMP / f"mock_{key}_{suf}.png"
            fn(hi).save(p)
            rutas[(key, hi)] = p
    return rutas


# =====================================================================
# 3. AYUDAS DOCX
# =====================================================================
def set_cell_bg(cell, color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), color)
    tcPr.append(shd)


def add_code(doc, code, size=8):
    table = doc.add_table(rows=1, cols=1)
    table.style = "Table Grid"
    cell = table.cell(0, 0)
    set_cell_bg(cell, "F6F8FA")
    cell.text = ""
    lineas = code.rstrip("\n").split("\n")
    for i, linea in enumerate(lineas):
        p = cell.paragraphs[0] if i == 0 else cell.add_paragraph()
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.space_before = Pt(0)
        run = p.add_run(linea if linea else " ")
        run.font.name = "Consolas"
        run.font.size = Pt(size)
    doc.add_paragraph()


def add_toc(doc):
    p = doc.add_paragraph()
    run = p.add_run()
    f1 = OxmlElement("w:fldChar")
    f1.set(qn("w:fldCharType"), "begin")
    it = OxmlElement("w:instrText")
    it.set(qn("xml:space"), "preserve")
    it.text = 'TOC \\o "1-3" \\h \\z \\u'
    f2 = OxmlElement("w:fldChar")
    f2.set(qn("w:fldCharType"), "separate")
    t = OxmlElement("w:t")
    t.text = "Clic derecho > Actualizar campo para generar el indice."
    f3 = OxmlElement("w:fldChar")
    f3.set(qn("w:fldCharType"), "end")
    for el in (f1, it, f2, t, f3):
        run._r.append(el)


def bullet(doc, text, level=0):
    p = doc.add_paragraph(text, style="List Bullet" if level == 0 else "List Bullet 2")
    return p


def kv_table(doc, filas, headers, widths=None):
    tabla = doc.add_table(rows=1, cols=len(headers))
    tabla.style = "Light Grid Accent 1"
    tabla.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(headers):
        c = tabla.rows[0].cells[i]
        c.text = h
        for run in c.paragraphs[0].runs:
            run.font.bold = True
    for fila in filas:
        celdas = tabla.add_row().cells
        for i, val in enumerate(fila):
            celdas[i].text = str(val)
    doc.add_paragraph()
    return tabla


def imagen(doc, path, ancho=6.2, caption=None):
    if path and Path(path).exists():
        doc.add_picture(str(path), width=Inches(ancho))
        doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
        if caption:
            p = doc.add_paragraph(caption)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for run in p.runs:
                run.font.size = Pt(9)
                run.font.italic = True
                run.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)
    else:
        doc.add_paragraph("[diagrama no disponible]")


# =====================================================================
# 4. CONSTRUIR DOCUMENTO
# =====================================================================
def construir(mockups, diags):
    doc = Document()
    normal = doc.styles["Normal"]
    normal.font.name = "Calibri"
    normal.font.size = Pt(11)

    # --- Portada ---
    doc.add_paragraph()
    t = doc.add_paragraph()
    t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = t.add_run("SISTEMA DE INVENTARIO DE DISFRACES")
    r.bold = True
    r.font.size = Pt(26)
    r.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    s = doc.add_paragraph()
    s.alignment = WD_ALIGN_PARAGRAPH.CENTER
    rs = s.add_run("Documentación técnica y funcional del proyecto\nArquitectura Web App + Supabase + Node.js + Svelte")
    rs.font.size = Pt(13)
    rs.font.color.rgb = RGBColor(0x47, 0x55, 0x69)
    doc.add_paragraph()
    imagen(doc, TMP / "diag_arquitectura.png", ancho=6.0)
    doc.add_paragraph()
    for etiqueta, valor in [
        ("Proyecto", "Sistema de Inventario de Disfraces"),
        ("Versión", "1.0"),
        ("Fecha", "Octubre 2026"),
        ("Repositorio", "https://github.com/disfracesrosaelvira/productos"),
    ]:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r1 = p.add_run(f"{etiqueta}: ")
        r1.bold = True
        p.add_run(valor)
    doc.add_page_break()

    # --- Índice ---
    doc.add_heading("Índice", level=1)
    add_toc(doc)
    doc.add_page_break()

    # --- 1. Introducción ---
    doc.add_heading("1. Introducción", level=1)
    doc.add_heading("1.1 Contexto", level=2)
    doc.add_paragraph(
        "El negocio de alquiler y venta de disfraces maneja un catálogo amplio (más de "
        "2,000 fotografías) organizado por categorías temáticas (superhéroes, profesiones, "
        "series, películas, Halloween), géneros (niño, niña, hombre, mujer, unisex), tallas y "
        "calidades de tela. El control de este inventario se realizaba de forma manual, lo que "
        "dificultaba conocer el stock real, registrar ventas y mantener las fotografías al día."
    )
    doc.add_heading("1.2 Problema", level=2)
    doc.add_paragraph(
        "No existía una herramienta centralizada que permitiera consultar el inventario en "
        "tiempo real, subir fotos desde el móvil, controlar stock automáticamente al vender y "
        "obtener reportes. Esto generaba errores de stock, pérdida de tiempo y falta de "
        "trazabilidad de las operaciones."
    )
    doc.add_heading("1.3 Justificación", level=2)
    doc.add_paragraph(
        "Se implementa una aplicación web con base de datos en la nube (Supabase), backend "
        "Node.js y frontend Svelte. La solución es de bajo costo (planes gratuitos), escalable a "
        "un módulo de ventas y alquiler, y permite el trabajo colaborativo con actualización en "
        "tiempo real del stock."
    )

    # --- 2. Objetivos ---
    doc.add_heading("2. Objetivos", level=1)
    doc.add_heading("2.1 Objetivo general", level=2)
    doc.add_paragraph(
        "Desarrollar un sistema web de control de inventario de disfraces que gestione productos, "
        "variantes (talla, género, tela) y stock en tiempo real, con carga de fotografías desde el "
        "móvil y registro de ventas."
    )
    doc.add_heading("2.2 Objetivos específicos", level=2)
    for o in [
        "Centralizar el catálogo de disfraces con fotografías, categorías, tallas y géneros.",
        "Automatizar el descuento de stock al registrar una venta mediante disparadores (triggers).",
        "Permitir la subida de fotografías desde el móvil con compresión automática.",
        "Ofrecer filtros de búsqueda por nombre, categoría y género.",
        "Generar reportes de bajo stock, resumen de ventas y productos más vendidos.",
        "Actualizar la interfaz en tiempo real (Realtime) cuando cambia el stock.",
        "Desplegar el sistema en la nube con costo cero (GitHub Pages, Railway, Supabase).",
    ]:
        bullet(doc, o)

    # --- 3. Alcances ---
    doc.add_heading("3. Alcances y limitaciones", level=1)
    doc.add_heading("3.1 Alcances", level=2)
    for a in [
        "Gestión de productos, categorías, variantes, imágenes y ventas.",
        "Autenticación de usuarios y control de acceso por RLS en la base de datos.",
        "Carga masiva inicial de fotografías y metadatos con Python.",
        "Interfaz responsive (móvil y escritorio) con Tailwind CSS.",
        "Reportes operativos y actualización en vivo del inventario.",
    ]:
        bullet(doc, a)
    doc.add_heading("3.2 Limitaciones / fuera de alcance", level=2)
    for l in [
        "Pasarela de pagos en línea (las ventas se registran manualmente).",
        "Módulo de alquiler (previsto como extensión futura).",
        "Tienda pública para clientes finales (el sistema es de uso interno).",
        "Notificaciones por correo o WhatsApp.",
    ]:
        bullet(doc, l)

    # --- 4. Stack ---
    doc.add_heading("4. Stack tecnológico", level=1)
    kv_table(doc, [
        ("Frontend", "Svelte 5 + Vite + Tailwind CSS 4", "Interfaz de usuario"),
        ("Backend", "Node.js 22 + Fastify 5", "API REST y lógica de negocio"),
        ("Base de datos", "Supabase PostgreSQL 15 + RLS", "Persistencia y seguridad"),
        ("Realtime", "Supabase Realtime (WebSockets)", "Actualización en vivo"),
        ("Storage", "Supabase Storage", "Fotografías (bucket público)"),
        ("Auth", "Supabase Auth (email/contraseña)", "Autenticación y sesiones"),
        ("Imágenes", "sharp (backend) + browser-image-compression (front)", "Compresión"),
        ("Scripts", "Python + Pillow + pillow-heif + supabase-py", "Carga masiva"),
        ("Hosting", "GitHub Pages (front) + Railway (back)", "Despliegue"),
        ("CI/CD", "GitHub Actions", "Despliegue automático"),
    ], ["Capa", "Tecnología", "Propósito"])

    # --- 5. Arquitectura ---
    doc.add_heading("5. Arquitectura del sistema", level=1)
    doc.add_heading("5.1 Arquitectura de alto nivel", level=2)
    doc.add_paragraph(
        "El frontend Svelte (alojado en GitHub Pages) se comunica directamente con Supabase para "
        "Realtime, Storage y Auth, y con el backend Node.js/Fastify para la lógica de negocio "
        "compleja (productos, ventas, reportes e imágenes). El backend accede a Supabase mediante "
        "la clave de servicio (service/secret key)."
    )
    imagen(doc, diags.get("arquitectura"), 6.3, "Diagrama 5.1 — Arquitectura general del sistema")
    doc.add_heading("5.2 Diagrama de componentes (bajo nivel)", level=2)
    doc.add_paragraph(
        "Detalla los módulos internos del frontend (vistas y listener Realtime), del backend "
        "(módulos por recurso y procesamiento de imágenes) y de Supabase (base de datos, storage, "
        "realtime y auth)."
    )
    imagen(doc, diags.get("bajo_nivel"), 6.3, "Diagrama 5.2 — Componentes internos y sus conexiones")

    # --- 6. Flujos ---
    doc.add_heading("6. Diagramas de flujo", level=1)
    doc.add_heading("6.1 Flujo de subida de fotografías", level=2)
    doc.add_paragraph(
        "El usuario selecciona o toma una foto; el frontend la comprime a WebP con "
        "browser-image-compression y la envía al backend, que con sharp la redimensiona y la "
        "almacena en Supabase Storage, registrando la URL en la tabla product_images."
    )
    imagen(doc, diags.get("subida_fotos"), 6.3, "Diagrama 6.1 — Flujo de subida de fotografías")
    doc.add_heading("6.2 Flujo de stock en tiempo real", level=2)
    doc.add_paragraph(
        "Al registrar una venta, el backend inserta la venta y sus ítems; un trigger de "
        "PostgreSQL valida y descuenta el stock en variants, recalcula el total y emite un evento "
        "Realtime que actualiza a todos los clientes conectados sin recargar."
    )
    imagen(doc, diags.get("stock"), 6.3, "Diagrama 6.2 — Flujo de actualización de stock")

    # --- 7. Trazabilidad y lógica ---
    doc.add_heading("7. Criterios de trazabilidad y lógica de negocio", level=1)
    doc.add_heading("7.1 Identificadores", level=2)
    doc.add_paragraph(
        "Cada entidad utiliza un UUID como clave primaria (gen_random_uuid()), lo que garantiza "
        "unicidad global y trazabilidad de cada registro entre frontend, backend y base de datos. "
        "Las variantes incorporan además un SKU legible y único."
    )
    doc.add_heading("7.2 Generación automática de SKU", level=2)
    doc.add_paragraph(
        "El SKU se genera en el backend a partir de variables que se mantienen constantes: el "
        "prefijo de la categoría (3 letras), el género y la talla. Si ya existe, se añade un sufijo "
        "numérico para garantizar la unicidad."
    )
    add_code(doc, textwrap.dedent('''\
        // backend: variantService.js
        const GENERO_SKU = { 'niño':'NIN', 'niña':'NINA', 'hombre':'HOM', 'mujer':'MUJ', 'unisex':'UNI' };

        async function generarSku(productId, size, gender) {
          const prefijo = codigo3(categoria);         // p.ej. "PEL" (peliculas)
          const generoCod = GENERO_SKU[gender] ?? 'GEN';
          const tallaCod = (slugify(size) || 'u').toUpperCase();
          let base = `${prefijo}-${generoCod}-${tallaCod}`;   // p.ej. PEL-UNI-S
          let sku = base, n = 2;
          while (existeSku(sku)) sku = `${base}-${n++}`;      // unicidad
          return sku;
        }'''))
    doc.add_paragraph(
        "Ejemplos reales: PEL-UNI-S, SUP-NIN-4, HOM-M. El SKU es la clave de trazabilidad "
        "operativa (ventas, inventario físico, reportes)."
    )
    doc.add_heading("7.3 Lógica condicional (switch / categorización)", level=2)
    doc.add_paragraph(
        "La clasificación de categorías y los códigos de género se resuelven con lógica de tipo "
        "switch/case (mapas de equivalencia), lo que permite estandarizar y trazar los valores."
    )
    add_code(doc, textwrap.dedent('''\
        // Carga masiva (Python): normalizacion de categoria (switch/case logico)
        ALIAS_CATEGORIA = { "haloween": "halloween" }
        def normalizar_slug_categoria(valor):
            slug = slugify(valor)
            return ALIAS_CATEGORIA.get(slug, slug)

        # Frontend (Svelte): genero -> etiqueta
        const GENEROS = [
          { valor: 'hombre', texto: 'Hombre' },
          { valor: 'mujer',  texto: 'Mujer'  },
          { valor: 'unisex', texto: 'Unisex' },
        ]

        // Backend: filtros del catalogo (relacion categorias!inner)
        if (category) select = select.replace('categories (', 'categories!inner (');
        if (q) query = query.ilike('name', `%${q}%`);
        if (gender) items = items.filter(p => p.variants.some(v => v.gender === gender));'''))
    doc.add_heading("7.4 Triggers de base de datos (trazabilidad automática)", level=2)
    doc.add_paragraph(
        "Cinco funciones PL/pgSQL garantizan la integridad y trazabilidad del inventario:"
    )
    kv_table(doc, [
        ("restar_stock", "AFTER INSERT en sale_items", "Valida stock (con FOR UPDATE) y lo descuenta."),
        ("devolver_stock", "AFTER DELETE en sale_items", "Devuelve el stock al eliminar un ítem."),
        ("recalcular_total_venta", "AFTER I/U/D en sale_items", "Recalcula el monto total de la venta."),
        ("handle_new_user", "AFTER INSERT en auth.users", "Crea el perfil del usuario automáticamente."),
        ("set_updated_at", "BEFORE UPDATE", "Mantiene la marca de actualización (updated_at)."),
    ], ["Trigger", "Evento", "Propósito"])
    add_code(doc, textwrap.dedent('''\
        create or replace function public.restar_stock()
        returns trigger language plpgsql security definer set search_path = public as $$
        declare v_stock integer;
        begin
          select stock_quantity into v_stock
            from public.variants where id = new.variant_id for update;
          if not found then raise exception 'La variante % no existe', new.variant_id; end if;
          if v_stock < new.quantity then
            raise exception 'Stock insuficiente: disponible %, solicitado %', v_stock, new.quantity;
          end if;
          update public.variants
             set stock_quantity = stock_quantity - new.quantity, updated_at = now()
           where id = new.variant_id;
          return new;
        end; $$;'''))
    doc.add_heading("7.5 Matriz de trazabilidad", level=2)
    kv_table(doc, [
        ("Registrar venta y descontar stock", "POST /sales + trigger restar_stock", "variants.stock_quantity", "Venta reflejada y stock reducido en vivo"),
        ("Subir foto con compresión", "POST /products/:id/images (multipart)", "product_images.image_url", "Foto almacenada y visible"),
        ("Buscar/filtrar catálogo", "GET /products?q&category&gender", "products, variants, categories", "Listado filtrado"),
        ("Bajo stock", "GET /reports/low-stock", "variants.stock_quantity", "Variantes ≤ umbral"),
        ("Resumen de ventas", "GET /reports/sales-summary", "sales.total_amount", "Totales por periodo"),
        ("Crear/editar producto", "POST/PUT /products", "products", "Producto guardado"),
        ("SKU automático", "POST /variants (generarSku)", "variants.sku", "SKU único generado"),
    ], ["Requisito / caso de uso", "Componente", "Dato trazado", "Resultado esperado"])

    # --- 8. Modelo de datos ---
    doc.add_heading("8. Modelo de datos", level=1)
    doc.add_heading("8.1 Diagrama Entidad-Relación", level=2)
    imagen(doc, diags.get("er"), 6.3, "Diagrama 8.1 — Modelo Entidad-Relación")
    doc.add_heading("8.2 Diccionario de tablas", level=2)
    kv_table(doc, [
        ("categories", "id (UUID, PK), name, slug (UK), parent_id (FK), created_at", "Jerarquía de temáticas"),
        ("products", "id (UUID, PK), name, description, image_url, price, category_id (FK), active, timestamps", "Cada disfraz"),
        ("variants", "id (UUID, PK), product_id (FK), size, gender, fabric_quality, sku (UK), stock_quantity", "Talla + género + tela + stock"),
        ("product_images", "id (UUID, PK), product_id (FK), image_url, is_primary, position", "Fotografías"),
        ("tags / product_tags", "id (UUID, PK) / (product_id, tag_id)", "Etiquetas flexibles"),
        ("sales", "id (UUID, PK), sale_date, total_amount, customer, user_id (FK)", "Ventas"),
        ("sale_items", "id (UUID, PK), sale_id (FK), variant_id (FK), quantity, unit_price", "Detalle de venta"),
        ("profiles", "id (UUID, PK = auth.users), email, full_name, role", "Usuarios del sistema"),
    ], ["Tabla", "Campos principales", "Descripción"])

    # --- 9. Backend ---
    doc.add_heading("9. Backend (Node.js + Fastify)", level=1)
    doc.add_heading("9.1 Estructura del proyecto", level=2)
    add_code(doc, textwrap.dedent('''\
        inventario-backend/
        ├── src/server.js                Servidor Fastify, CORS, helmet, multipart, errores
        ├── src/config/env.js            Variables de entorno validadas
        ├── src/lib/supabase.js          Cliente admin (service/secret key)
        ├── src/middlewares/auth.js      requireAuth / requireAdmin (JWT de Supabase)
        ├── src/schemas/*.js             Validacion con zod
        ├── src/services/*.js            Logica de negocio (product/variant/sale/report)
        └── src/routes/*.js              Endpoints REST'''))
    doc.add_heading("9.2 Endpoints", level=2)
    kv_table(doc, [
        ("GET", "/health", "No", "Estado del servicio"),
        ("GET", "/products", "No", "Listado con filtros (q, category, gender, page)"),
        ("GET", "/products/:id", "No", "Detalle con imágenes y variantes"),
        ("POST/PUT/DELETE", "/products(/:id)", "Sí", "Alta, edición y baja de productos"),
        ("POST", "/products/:id/images", "Sí", "Subir imagen (sharp) a Storage"),
        ("GET", "/variants", "No", "Variantes (filtros product_id, gender, low_stock)"),
        ("POST/PATCH", "/variants(/:id)", "Sí", "Crear/ajustar variante (SKU automático)"),
        ("GET/POST", "/sales", "Sí", "Listar/registrar ventas"),
        ("GET", "/reports/low-stock", "Sí", "Reporte de bajo stock"),
        ("GET", "/reports/sales-summary", "Sí", "Resumen de ventas"),
        ("GET", "/reports/top-products", "Sí", "Productos más vendidos"),
    ], ["Método", "Ruta", "Auth", "Descripción"])
    doc.add_heading("9.3 Funciones principales", level=2)
    doc.add_paragraph("Autenticación (JWT de Supabase) y control por rol:")
    add_code(doc, textwrap.dedent('''\
        export async function requireAuth(request) {
          const token = (request.headers.authorization ?? '').replace('Bearer ', '');
          const { data, error } = await supabaseAdmin.auth.getUser(token);
          if (error || !data?.user) throw new AppError('Token invalido o expirado', 401);
          request.user = { id: data.user.id, email: data.user.email, role: perfil?.role };
        }'''))
    doc.add_paragraph("Registro de venta (transaccional, con deshacer ante error):")
    add_code(doc, textwrap.dedent('''\
        export async function createSale(userId, input) {
          const { data: venta } = await supabaseAdmin.from('sales')
            .insert({ customer, sale_date, total_amount: 0, user_id: userId })
            .select('id').single();

          const filas = items.map(i => ({ sale_id: venta.id, variant_id: i.variant_id,
                                          quantity: i.quantity, unit_price: i.unit_price }));
          const { error } = await supabaseAdmin.from('sale_items').insert(filas);
          if (error) {                       // p.ej. stock insuficiente (trigger)
            await supabaseAdmin.from('sales').delete().eq('id', venta.id);  // rollback
            throw new AppError(`No se pudo registrar la venta: ${error.message}`, 409);
          }
          return getSale(venta.id);          // triggers ya restaron stock y calcularon total
        }'''))
    doc.add_paragraph("Subida de imagen con sharp (redimensiona y convierte a WebP):")
    add_code(doc, textwrap.dedent('''\
        export async function subirImagen(productId, buffer, { isPrimary } = {}) {
          const webp = await sharp(buffer).rotate()
            .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 }).toBuffer();
          const ruta = `productos/${slug}/${Date.now()}-${slug}.webp`;
          await supabaseAdmin.storage.from(bucket).upload(ruta, webp, { contentType: 'image/webp', upsert: true });
          const url = supabaseAdmin.storage.from(bucket).getPublicUrl(ruta).data.publicUrl;
          // La primera imagen del producto se marca como principal
          await supabaseAdmin.from('product_images').insert({ product_id, image_url: url, is_primary: principal, position: count });
          return img;
        }'''))

    # --- 10. Frontend ---
    doc.add_heading("10. Frontend (Svelte 5 + Vite + Tailwind)", level=1)
    doc.add_heading("10.1 Estructura", level=2)
    add_code(doc, textwrap.dedent('''\
        inventario-frontend/src/
        ├── App.svelte                 Shell + router por hash + guard de sesion
        ├── lib/supabase.js            Cliente Supabase (anon key)
        ├── lib/api.js                 Cliente del backend (adjunta el JWT)
        ├── lib/auth.svelte.js         Estado de sesión (runes)
        ├── lib/router.svelte.js       Router por hash (compatible GitHub Pages)
        ├── lib/components/Nav.svelte         Barra de navegación
        ├── lib/components/ImagePicker.svelte Cámara/galería + compresión + preview
        ├── lib/components/Lightbox.svelte    Zoom de imágenes
        └── routes/*.svelte            Login, Catalogo, Detalle, Editar, Ventas, Reportes'''))
    doc.add_heading("10.2 Rutas y vistas", level=2)
    kv_table(doc, [
        ("#/", "Catálogo", "Lista con filtros y tarjetas de producto"),
        ("#/producto/:id", "Detalle", "Ficha, variantes, stock y zoom de fotos"),
        ("#/producto/nuevo", "Alta", "Formulario + variante + tela + fotos"),
        ("#/producto/:id/editar", "Edición", "Editar datos y agregar fotos"),
        ("#/ventas", "Ventas", "Carrito y registro de venta"),
        ("#/reportes", "Reportes", "Bajo stock, resumen y más vendidos"),
    ], ["Ruta", "Vista", "Descripción"])
    doc.add_heading("10.3 Componentes clave", level=2)
    for comp, desc in [
        ("ImagePicker", "Botones Tomar foto / Galería, comprime a WebP (0.5 MB, 1600px), previsualiza y limita de 1 a 3 fotos."),
        ("Lightbox", "Visor a pantalla completa con zoom (100%–400%) para observar la imagen sin recorte."),
        ("api.js", "Centraliza las llamadas al backend añadiendo el token JWT de Supabase."),
        ("auth.svelte.js", "Maneja la sesión con Supabase Auth y expone estado reactivo."),
        ("router.svelte.js", "Router por hash: funciona en GitHub Pages sin configuración de servidor."),
    ]:
        p = doc.add_paragraph()
        p.add_run(f"{comp}: ").bold = True
        p.add_run(desc)

    # --- 11. Mockups ---
    doc.add_heading("11. Mockups", level=1)
    doc.add_heading("11.1 Baja fidelidad (wireframes)", level=2)
    doc.add_paragraph(
        "Bocetos de estructura y distribución de los elementos en cada pantalla, sin color ni "
        "estilos, para validar la organización de la información."
    )
    for key, (titulo, _fn) in MOCKUPS.items():
        imagen(doc, mockups.get((key, False)), 5.6, f"Wireframe — {titulo}")
    doc.add_page_break()
    doc.add_heading("11.2 Alta fidelidad", level=2)
    doc.add_paragraph(
        "Diseño final con la paleta y componentes reales (Svelte + Tailwind), cercano a la "
        "apariencia de la aplicación."
    )
    for key, (titulo, _fn) in MOCKUPS.items():
        imagen(doc, mockups.get((key, True)), 6.0, f"Mockup — {titulo}")

    # --- 12. Seguridad ---
    doc.add_heading("12. Seguridad", level=1)
    for s in [
        "Row Level Security (RLS) en todas las tablas: lectura pública del catálogo y escritura solo para usuarios autenticados.",
        "Autenticación con Supabase Auth (email/contraseña) y verificación del token JWT en el backend.",
        "La clave de servicio (service/secret key) se usa solo en el backend y nunca se expone en el frontend.",
        "Variables sensibles almacenadas en archivos .env excluidos del repositorio (.gitignore).",
        "Bucket de Storage público solo para lectura; escritura restringida a usuarios autenticados.",
        "Validación de datos con zod en todos los endpoints.",
    ]:
        bullet(doc, s)

    # --- 13. Despliegue ---
    doc.add_heading("13. Despliegue", level=1)
    imagen(doc, diags.get("despliegue"), 6.2, "Diagrama 13.1 — Despliegue en la nube")
    kv_table(doc, [
        ("Frontend", "GitHub Pages", "https://disfracesrosaelvira.github.io/productos/", "Deploy automático con GitHub Actions"),
        ("Backend", "Railway", "https://productos-production-8443.up.railway.app", "Node.js 22, variables de entorno"),
        ("Base de datos", "Supabase (proyecto InventorySystem)", "https://zlcjzgpcswigxulsplpp.supabase.co", "PostgreSQL, Storage, Auth, Realtime"),
        ("CI/CD", "GitHub Actions", "deploy-frontend.yml", "Build y publicación del frontend"),
    ], ["Componente", "Plataforma", "URL / detalle", "Notas"])

    # --- 14. Manual de uso ---
    doc.add_heading("14. Manual de uso", level=1)
    pasos = [
        "Iniciar sesión con el correo y contraseña asignados.",
        "En el Catálogo, buscar por nombre o filtrar por categoría/género. Usar 'Limpiar filtros' para reiniciar.",
        "Pulsar '+ Nuevo producto' para dar de alta: completar nombre, precio, categoría y categoría; elegir talla, género, cantidad y (opcional) la calidad de la tela.",
        "Añadir de 1 a 3 fotos con 'Tomar foto' (cámara) o 'Desde galería'. Se comprimen automáticamente.",
        "Guardar; el sistema crea el producto, su variante con SKU automático y sube las fotos.",
        "En el Detalle, usar '🔍 Ampliar' para ver la imagen completa con zoom.",
        "En Ventas, seleccionar la variante, indicar cantidad, agregarla al carrito y registrar la venta (el stock se descuenta solo).",
        "En Reportes, consultar bajo stock, resumen de ventas y productos más vendidos.",
    ]
    for i, p in enumerate(pasos, 1):
        bullet(doc, f"{i}. {p}")

    # --- 15. Anexos ---
    doc.add_heading("15. Anexos", level=1)
    doc.add_heading("Anexo A. Guion SQL de la base de datos", level=2)
    doc.add_paragraph("Script completo ejecutado en Supabase (db/supabase_schema.sql):")
    sql_path = ROOT / "db" / "supabase_schema.sql"
    if sql_path.exists():
        add_code(doc, sql_path.read_text(encoding="utf-8"), size=7)

    doc.add_heading("Anexo B. Script de carga masiva (Python)", level=2)
    doc.add_paragraph(
        "El script scripts/cargar_supabase.py comprime las fotografías a WebP, las sube al "
        "bucket, y crea/actualiza productos, imágenes y variantes (una por talla) leyendo el CSV "
        "de metadatos. Es idempotente (reejecutable)."
    )
    add_code(doc, textwrap.dedent('''\
        # Fragmento clave: una variante por talla (stock por talla) y SKU unico
        for talla in tallas_de(row):                      # "4;6;8" -> ["4","6","8"]
            sku = f"{prefijo}-{slugify(talla) or 'unica'}".upper()
            client.table("variants").upsert({
                "product_id": prod_id, "size": talla, "gender": row["genero"],
                "fabric_quality": row.get("calidad_tela") or None,
                "sku": sku, "stock_quantity": stock,
            }, on_conflict="sku").execute()'''))

    doc.add_heading("Anexo C. Código Mermaid de los diagramas", level=2)
    doc.add_paragraph("Los diagramas pueden regenerarse pegando este código en mermaid.live:")
    for nombre, code in DIAGRAMAS.items():
        doc.add_paragraph(f"Diagrama: {nombre}").runs[0].bold = True
        add_code(doc, code, size=7)

    doc.add_heading("Anexo D. Glosario", level=2)
    kv_table(doc, [
        ("RLS", "Row Level Security: control de acceso por fila en PostgreSQL."),
        ("Realtime", "Actualizaciones en vivo mediante WebSockets."),
        ("Trigger", "Función que se ejecuta automáticamente ante INSERT/UPDATE/DELETE."),
        ("SKU", "Código único de la variante (Stock Keeping Unit)."),
        ("Service key", "Clave con permisos de administrador, solo en el backend."),
        ("Anon key", "Clave pública que usa el frontend, limitada por RLS."),
        ("pg_cron", "Extensión de PostgreSQL para tareas programadas (Fase 6)."),
        ("JWT", "Token firmado que identifica al usuario autenticado."),
    ], ["Término", "Definición"])

    doc.add_heading("Anexo E. Repositorio y recursos", level=2)
    for e in [
        "Repositorio: https://github.com/disfracesrosaelvira/productos",
        "Aplicación (GitHub Pages): https://disfracesrosaelvira.github.io/productos/",
        "Backend (Railway): https://productos-production-8443.up.railway.app",
        "Diagramas interactivos: DiagramasArquitecturaProyecto.html (incluido en el proyecto).",
        "Mockups interactivos: MockupInteractivoHTML.html (incluido en el proyecto).",
    ]:
        bullet(doc, e)

    doc.save(OUT)
    return OUT


def main():
    print("Renderizando diagramas...")
    diags = {k: render_mermaid(k, v) for k, v in DIAGRAMAS.items()}
    print("Generando mockups...")
    mockups = generar_mockups()
    print("Construyendo documento...")
    out = construir(mockups, diags)
    print("LISTO:", out)


if __name__ == "__main__":
    main()
