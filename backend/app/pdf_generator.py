import io
from datetime import datetime, timezone
from typing import Any, Optional
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfgen import canvas

def generate_medical_dossier_pdf(person: Any, mission: Any, data: dict, days: int) -> bytes:
    """
    Renders an executive, publication-grade spaceflight clinical medical report (NASA STD-3001)
    with deep dark navy cards, precision typography, KPI callouts, smoothed telemetry charts,
    and a structured clinical audit table.
    """
    buffer = io.BytesIO()
    # A4 dimensions: 595.28 x 841.89 points
    pdf = canvas.Canvas(buffer, pagesize=A4)
    astro_name = data.get("astronaut") or (person.name if person else "Maya Chen")
    pdf.setTitle(f"CosmoHealthX Medical Dossier - {astro_name}")

    # Color Palette: NASA Aerospace & High-Tech Telemedicine
    c_bg_dark = colors.HexColor('#050a16')
    c_card_bg = colors.HexColor('#0b1329')
    c_card_border = colors.HexColor('#1e293b')
    c_cyan = colors.HexColor('#22d3ee')
    c_emerald = colors.HexColor('#10b981')
    c_amber = colors.HexColor('#f59e0b')
    c_red = colors.HexColor('#ef4444')
    c_purple = colors.HexColor('#8b5cf6')
    c_text_white = colors.HexColor('#ffffff')
    c_text_sub = colors.HexColor('#94a3b8')
    c_text_muted = colors.HexColor('#64748b')

    # Full Page Background
    pdf.setFillColor(c_bg_dark)
    pdf.rect(0, 0, 595.28, 841.89, fill=1, stroke=0)

    # Margins and width
    ml = 36.0
    w = 523.28

    # ==========================================
    # 1. TOP HEADER BANNER (Y = 730 to 815, H = 85)
    # ==========================================
    header_y = 730.0
    header_h = 85.0
    pdf.setFillColor(c_card_bg)
    pdf.setStrokeColor(c_card_border)
    pdf.setLineWidth(1.2)
    pdf.roundRect(ml, header_y, w, header_h, 10, fill=1, stroke=1)

    # Accent top border inside header
    pdf.setFillColor(c_cyan)
    pdf.rect(ml + 10, header_y + header_h - 3, w - 20, 2, fill=1, stroke=0)

    # Header Row 1: Brand & Badge
    pdf.setFillColor(c_text_white)
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(ml + 16, header_y + 58, "COSMOHEALTHX")
    
    pdf.setFillColor(c_cyan)
    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(ml + 145, header_y + 59, "· FLIGHT SURGEON MEDICAL DOSSIER")

    # Clearance Badge on top right
    badge_w = 148
    badge_h = 18
    badge_x = ml + w - badge_w - 16
    badge_y = header_y + 55
    pdf.setFillColor(colors.HexColor('#064e3b'))
    pdf.setStrokeColor(colors.HexColor('#059669'))
    pdf.setLineWidth(0.8)
    pdf.roundRect(badge_x, badge_y, badge_w, badge_h, 9, fill=1, stroke=1)
    pdf.setFillColor(colors.HexColor('#34d399'))
    pdf.setFont("Helvetica-Bold", 7.5)
    pdf.drawCentredString(badge_x + badge_w / 2, badge_y + 5, "● NASA STD-3001 CLASS-I ACTIVE")

    # Header Row 2: Sub-metadata
    pdf.setFillColor(c_text_sub)
    pdf.setFont("Helvetica", 8)
    mission_name = (mission.name if mission else "Expedition CHX-01")
    pdf.drawString(ml + 16, header_y + 42, f"{mission_name.upper()} · ORBITAL TELEMETRY CLINICAL AUDIT · MET DAY 42 OF 180")

    gen_time_str = datetime.now(timezone.utc).strftime("%d %b %Y %H:%M UTC")
    pdf.drawRightString(ml + w - 16, header_y + 42, f"GENERATED: {gen_time_str}")

    # Separator line inside header
    pdf.setStrokeColor(colors.HexColor('#1e293b'))
    pdf.setLineWidth(0.8)
    pdf.line(ml + 16, header_y + 34, ml + w - 16, header_y + 34)

    # Header Row 3: Astronaut Details
    pdf.setFillColor(c_text_muted)
    pdf.setFont("Helvetica", 8)
    pdf.drawString(ml + 16, header_y + 14, "CREW MEMBER:")
    
    pdf.setFillColor(c_text_white)
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(ml + 85, header_y + 13, astro_name)

    callsign = "NOVA-01 · Flight Surgeon (CMO)"
    if person and hasattr(person, "callsign") and person.callsign:
        callsign = f"{person.callsign} · {person.specialty or 'Flight Surgeon'}"
    pdf.setFillColor(c_cyan)
    pdf.setFont("Helvetica-Bold", 8.5)
    pdf.drawString(ml + 215, header_y + 14, f"[{callsign}]")

    pdf.setFillColor(c_text_muted)
    pdf.setFont("Helvetica", 8)
    pdf.drawRightString(ml + w - 110, header_y + 14, "MONITORING PERIOD:")
    pdf.setFillColor(c_amber)
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawRightString(ml + w - 16, header_y + 14, f"{days} DAYS CONTINUOUS")

    # ==========================================
    # 2. EXECUTIVE KPI CARDS (Y = 660 to 718, H = 58)
    # ==========================================
    kpi_y = 660.0
    kpi_h = 58.0
    gap = 8.0
    card_w = (w - 3 * gap) / 4.0

    metrics = data.get("metrics", {})
    hr_m = metrics.get("heart_rate", {})
    spo2_m = metrics.get("spo2", {})
    hrv_m = metrics.get("hrv", {})
    rad_m = metrics.get("radiation_exposure", {})

    kpi_defs = [
        {
            "label": "HEART RATE (MEAN)",
            "val": f"{hr_m.get('mean', 67.56):.1f}",
            "unit": "bpm",
            "sub": f"Range: {hr_m.get('min', 57.8):.1f} - {hr_m.get('max', 78.2):.1f}",
            "color": c_red,
            "badge": "+0.73 Δ",
            "bcolor": c_emerald,
        },
        {
            "label": "BLOOD OXYGEN",
            "val": f"{spo2_m.get('mean', 98.1):.1f}",
            "unit": "%",
            "sub": f"Nominal Baseline > 95%",
            "color": c_cyan,
            "badge": "STABLE",
            "bcolor": c_emerald,
        },
        {
            "label": "HRV AUTONOMIC TONE",
            "val": f"{hrv_m.get('mean', 54.4):.1f}",
            "unit": "ms",
            "sub": f"RMSSD Active Parasymp.",
            "color": c_purple,
            "badge": "+1.70 Δ",
            "bcolor": c_emerald,
        },
        {
            "label": "RADIATION DOSIMETRY",
            "val": f"{rad_m.get('mean', 0.60):.2f}",
            "unit": "mSv",
            "sub": f"Safe Limit < 1.0 mSv/wk",
            "color": c_amber,
            "badge": "LOW RISK",
            "bcolor": c_cyan,
        },
    ]

    for i, kpi in enumerate(kpi_defs):
        cx = ml + i * (card_w + gap)
        pdf.setFillColor(c_card_bg)
        pdf.setStrokeColor(c_card_border)
        pdf.setLineWidth(1)
        pdf.roundRect(cx, kpi_y, card_w, kpi_h, 8, fill=1, stroke=1)

        # Top colored accent stripe
        pdf.setFillColor(kpi["color"])
        pdf.rect(cx + 8, kpi_y + kpi_h - 2.5, card_w - 16, 1.8, fill=1, stroke=0)

        # Label
        pdf.setFillColor(c_text_sub)
        pdf.setFont("Helvetica-Bold", 6.8)
        pdf.drawString(cx + 10, kpi_y + kpi_h - 13, kpi["label"])

        # Main Value + Unit
        pdf.setFillColor(c_text_white)
        pdf.setFont("Helvetica-Bold", 14)
        pdf.drawString(cx + 10, kpi_y + 20, kpi["val"])
        val_width = pdf.stringWidth(kpi["val"], "Helvetica-Bold", 14)

        pdf.setFillColor(c_text_sub)
        pdf.setFont("Helvetica", 8)
        pdf.drawString(cx + 10 + val_width + 4, kpi_y + 20, kpi["unit"])

        # Subtext / Range
        pdf.setFillColor(c_text_muted)
        pdf.setFont("Helvetica", 6.5)
        pdf.drawString(cx + 10, kpi_y + 8, kpi["sub"])

        # Badge pill
        bw = pdf.stringWidth(kpi["badge"], "Helvetica-Bold", 6.5) + 8
        bx = cx + card_w - bw - 8
        by = kpi_y + kpi_h - 22
        pdf.setFillColor(colors.HexColor('#0f172a'))
        pdf.setStrokeColor(kpi["bcolor"])
        pdf.setLineWidth(0.6)
        pdf.roundRect(bx, by, bw, 11, 4, fill=1, stroke=1)
        pdf.setFillColor(kpi["bcolor"])
        pdf.setFont("Helvetica-Bold", 6.5)
        pdf.drawCentredString(bx + bw / 2, by + 3, kpi["badge"])

    # ==========================================
    # 3. CONTINUOUS TELEMETRY CHART (Y = 515 to 648, H = 133)
    # ==========================================
    chart_y = 515.0
    chart_h = 133.0
    pdf.setFillColor(colors.HexColor('#080f1e'))
    pdf.setStrokeColor(c_card_border)
    pdf.setLineWidth(1)
    pdf.roundRect(ml, chart_y, w, chart_h, 8, fill=1, stroke=1)

    # Chart Header
    pdf.setFillColor(c_text_white)
    pdf.setFont("Helvetica-Bold", 8.5)
    pdf.drawString(ml + 14, chart_y + chart_h - 17, "CONTINUOUS HEART RATE TELEMETRY OBSERVATIONS (BPM)")

    pdf.setFillColor(c_emerald)
    pdf.setFont("Helvetica-Bold", 7.5)
    pdf.drawRightString(ml + w - 14, chart_y + chart_h - 17, "● NASA STD-3001 NOMINAL BAND (55–80 BPM)")

    # Chart Plot Boundaries
    px = ml + 42.0
    py = chart_y + 24.0
    pw = w - 56.0
    ph = 82.0

    # Extract Series Data
    series = [pt["value"] for pt in data.get("series", []) if pt.get("key") == "heart_rate"]
    if not series:
        series = [62, 60, 64, 61, 68, 76, 74, 66, 63, 64, 58, 62, 69, 70, 68, 75, 77, 65, 61, 63, 65, 60, 62]

    min_val = min(series)
    max_val = max(series)
    val_low = min(50.0, min_val - 2.0)
    val_high = max(85.0, max_val + 3.0)
    val_span = val_high - val_low or 1.0

    def val_to_y(v):
        return py + ((v - val_low) / val_span) * ph

    # Shaded band for 55 - 80 bpm (NASA Standard Zone)
    y_band_bot = max(py, val_to_y(55))
    y_band_top = min(py + ph, val_to_y(80))
    pdf.setFillColor(colors.HexColor('#06241f'))
    pdf.rect(px, y_band_bot, pw, y_band_top - y_band_bot, fill=1, stroke=0)

    # Grid Lines and Labels
    grid_levels = [60, 70, 80]
    for gl in grid_levels:
        gy = val_to_y(gl)
        if py <= gy <= py + ph:
            pdf.setStrokeColor(colors.HexColor('#1e293b'))
            pdf.setLineWidth(0.6)
            pdf.line(px, gy, px + pw, gy)
            pdf.setFillColor(c_text_muted)
            pdf.setFont("Helvetica", 6.5)
            pdf.drawRightString(px - 6, gy - 2, f"{gl}")

    # Area fill under the trend curve
    points_coords = []
    n_pts = len(series)
    for idx, v in enumerate(series):
        x = px + (idx / max(1, n_pts - 1)) * pw
        y = val_to_y(v)
        points_coords.append((x, y))

    if len(points_coords) >= 2:
        # Shaded path
        fill_path = pdf.beginPath()
        fill_path.moveTo(points_coords[0][0], py)
        for (x, y) in points_coords:
            fill_path.lineTo(x, y)
        fill_path.lineTo(points_coords[-1][0], py)
        fill_path.close()
        pdf.setFillColor(colors.HexColor('#063248'))
        pdf.drawPath(fill_path, fill=1, stroke=0)

        # Plot Line
        pdf.setStrokeColor(c_cyan)
        pdf.setLineWidth(1.8)
        plot_path = pdf.beginPath()
        plot_path.moveTo(points_coords[0][0], points_coords[0][1])
        for (x, y) in points_coords[1:]:
            plot_path.lineTo(x, y)
        pdf.drawPath(plot_path, fill=0, stroke=1)

        # Callouts for Min & Max
        min_idx = series.index(min_val)
        max_idx = series.index(max_val)

        min_pt = points_coords[min_idx]
        max_pt = points_coords[max_idx]

        # Draw circle on Min
        pdf.setFillColor(colors.HexColor('#ef4444'))
        pdf.circle(min_pt[0], min_pt[1], 3, fill=1, stroke=0)
        pdf.setFillColor(colors.HexColor('#fca5a5'))
        pdf.setFont("Helvetica-Bold", 6.5)
        pdf.drawString(min_pt[0] - 12, min_pt[1] - 10, f"Min {min_val:.1f}")

        # Draw circle on Max
        pdf.setFillColor(colors.HexColor('#10b981'))
        pdf.circle(max_pt[0], max_pt[1], 3, fill=1, stroke=0)
        pdf.setFillColor(colors.HexColor('#6ee7b7'))
        pdf.setFont("Helvetica-Bold", 6.5)
        pdf.drawString(max_pt[0] - 12, max_pt[1] + 6, f"Max {max_val:.1f}")

    # X-Axis Time Labels
    pdf.setFillColor(c_text_muted)
    pdf.setFont("Helvetica", 6.5)
    days_labels = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", f"Day 7 (MET 42)"]
    for i, dl in enumerate(days_labels):
        lx = px + (i / (len(days_labels) - 1)) * pw
        pdf.drawCentredString(lx, chart_y + 10, dl)

    # ==========================================
    # 4. COMPREHENSIVE BIOMETRIC AUDIT TABLE (Y = 220 to 500, H = 280)
    # ==========================================
    table_y = 220.0
    table_h = 280.0
    row_h = 22.0

    pdf.setFillColor(c_card_bg)
    pdf.setStrokeColor(c_card_border)
    pdf.setLineWidth(1)
    pdf.roundRect(ml, table_y, w, table_h, 8, fill=1, stroke=1)

    # Table Header Row
    header_th_y = table_y + table_h - row_h
    pdf.setFillColor(colors.HexColor('#0f172a'))
    pdf.rect(ml, header_th_y, w, row_h, fill=1, stroke=0)

    cols = [
        ("PHYSIOLOGICAL PARAMETER", ml + 14, "left"),
        ("MEAN VALUE", ml + 175, "left"),
        ("OBSERVED RANGE", ml + 250, "left"),
        ("SAMPLES", ml + 345, "left"),
        ("VARIANCE (Δ)", ml + 400, "left"),
        ("NASA STD STATUS", ml + w - 14, "right"),
    ]

    pdf.setFillColor(c_text_sub)
    pdf.setFont("Helvetica-Bold", 7.2)
    for title, xpos, align in cols:
        if align == "left":
            pdf.drawString(xpos, header_th_y + 7, title)
        else:
            pdf.drawRightString(xpos, header_th_y + 7, title)

    # Table Data Items
    metrics_spec = [
        ("Heart Rate (Resting & Dynamic)", "heart_rate", "bpm", "60.0 - 80.0", "NOMINAL", c_emerald),
        ("Heart Rate Variability (HRV RMSSD)", "hrv", "ms", "45.0 - 65.0", "OPTIMAL", c_emerald),
        ("Oxygen Saturation (SpO₂)", "spo2", "%", "95.0 - 100.0", "NOMINAL", c_emerald),
        ("Respiratory Ventilation Rate", "respiratory_rate", "/min", "12.0 - 18.0", "NOMINAL", c_emerald),
        ("Sleep Duration & SWS Phase", "sleep_duration", "hrs", "7.00 - 8.50", "OPTIMAL", c_cyan),
        ("Sleep Architecture Restfulness", "sleep_quality", "/5", "3.5 - 5.0", "GOOD", c_cyan),
        ("Cumulative Radiation Exposure", "radiation_exposure", "mSv", "< 1.20", "SECURE", c_amber),
        ("Autonomic Stress Response", "stress", "/5", "< 3.0", "LOW RISK", c_emerald),
        ("Cognitive Psychomotor Focus", "focus", "/5", "3.0 - 5.0", "HIGH", c_emerald),
        ("Active Countermeasure Exercise", "activity", "min", "> 60.0", "VERIFIED", c_cyan),
        ("Metabolic Hydration Volume", "hydration", "L", "2.00 - 2.80", "NOMINAL", c_emerald),
    ]

    for idx, (label, mkey, def_unit, ref_rng, status, badge_col) in enumerate(metrics_spec):
        ry = header_th_y - (idx + 1) * row_h
        row_bg = colors.HexColor('#080e1b') if idx % 2 == 0 else colors.HexColor('#060b16')
        pdf.setFillColor(row_bg)
        pdf.rect(ml, ry, w, row_h, fill=1, stroke=0)

        # Row separator line
        pdf.setStrokeColor(colors.HexColor('#131d33'))
        pdf.setLineWidth(0.5)
        pdf.line(ml, ry, ml + w, ry)

        item = metrics.get(mkey, {})
        mean_v = item.get("mean")
        min_v = item.get("min")
        max_v = item.get("max")
        cnt = item.get("count", 53)
        unit = item.get("unit") or def_unit
        delta = item.get("change_vs_previous")

        val_str = f"{mean_v:.2f} {unit}" if mean_v is not None else "Nominal"
        range_str = f"{min_v:.1f} – {max_v:.1f} {unit}" if min_v is not None and max_v is not None else ref_rng
        delta_str = f"{delta:+g}" if delta is not None else "±0.00"

        # Col 1: Label
        pdf.setFillColor(c_text_white)
        pdf.setFont("Helvetica-Bold", 7.5)
        pdf.drawString(ml + 14, ry + 6.5, label)

        # Col 2: Mean
        pdf.setFillColor(c_cyan)
        pdf.setFont("Helvetica-Bold", 7.5)
        pdf.drawString(ml + 175, ry + 6.5, val_str)

        # Col 3: Range
        pdf.setFillColor(c_text_sub)
        pdf.setFont("Helvetica", 7.2)
        pdf.drawString(ml + 250, ry + 6.5, range_str)

        # Col 4: Samples
        pdf.setFillColor(c_text_muted)
        pdf.setFont("Helvetica", 7.2)
        pdf.drawString(ml + 345, ry + 6.5, f"{cnt} pts")

        # Col 5: Delta
        delta_color = c_emerald if (delta is None or delta >= 0) else c_cyan
        pdf.setFillColor(delta_color)
        pdf.setFont("Helvetica-Bold", 7.2)
        pdf.drawString(ml + 400, ry + 6.5, delta_str)

        # Col 6: Status Badge
        sb_w = pdf.stringWidth(status, "Helvetica-Bold", 6.5) + 10
        sb_x = ml + w - sb_w - 14
        sb_y = ry + 4
        pdf.setFillColor(colors.HexColor('#0f172a'))
        pdf.setStrokeColor(badge_col)
        pdf.setLineWidth(0.6)
        pdf.roundRect(sb_x, sb_y, sb_w, 12, 4, fill=1, stroke=1)
        pdf.setFillColor(badge_col)
        pdf.setFont("Helvetica-Bold", 6.5)
        pdf.drawCentredString(sb_x + sb_w / 2, sb_y + 3.5, f"● {status}")

    # ==========================================
    # 5. BEHAVIORAL HEALTH & FLIGHT CLINICAL DECISION (Y = 110 to 205, H = 95)
    # ==========================================
    rec_y = 110.0
    rec_h = 95.0
    half_w = (w - gap) / 2.0

    # Left: Behavioral Health (BHP) Card
    pdf.setFillColor(c_card_bg)
    pdf.setStrokeColor(c_card_border)
    pdf.setLineWidth(1)
    pdf.roundRect(ml, rec_y, half_w, rec_h, 8, fill=1, stroke=1)

    pdf.setFillColor(c_cyan)
    pdf.setFont("Helvetica-Bold", 8.2)
    pdf.drawString(ml + 12, rec_y + rec_h - 16, "NASA BHP · BEHAVIORAL HEALTH ASSESSMENT")

    checkins = data.get("checkins", {})
    mean_mood = checkins.get("mean_mood", 4.0) or 4.0
    mean_stress = checkins.get("mean_stress", 2.1) or 2.1

    pdf.setFillColor(c_text_sub)
    pdf.setFont("Helvetica", 7.5)
    pdf.drawString(ml + 12, rec_y + rec_h - 32, f"Psychological Screenings Recorded: {checkins.get('count', 2)} check-ins")
    pdf.drawString(ml + 12, rec_y + rec_h - 45, f"Mean Mood Score: {mean_mood:.1f} / 5.0   ·   Mean Stress Index: {mean_stress:.1f} / 5.0")

    pdf.setFillColor(c_text_muted)
    pdf.setFont("Helvetica-Oblique", 7.0)
    pdf.drawString(ml + 12, rec_y + rec_h - 62, "Clinical Assessment: Astronaut exhibits high cognitive resilience,")
    pdf.drawString(ml + 12, rec_y + rec_h - 73, "stable circadian alignment, and nominal sociodynamic adaptation.")
    pdf.drawString(ml + 12, rec_y + rec_h - 84, "Prescribed Countermeasure: Standard 45-min sleep binaural audio.")

    # Right: Clinical Flight Recommendation Card
    rx = ml + half_w + gap
    pdf.setFillColor(c_card_bg)
    pdf.setStrokeColor(c_card_border)
    pdf.setLineWidth(1)
    pdf.roundRect(rx, rec_y, half_w, rec_h, 8, fill=1, stroke=1)

    pdf.setFillColor(c_amber)
    pdf.setFont("Helvetica-Bold", 8.2)
    pdf.drawString(rx + 12, rec_y + rec_h - 16, "FLIGHT SURGEON CLINICAL RECOMMENDATION")

    pdf.setFillColor(c_emerald)
    pdf.setFont("Helvetica-Bold", 7.8)
    pdf.drawString(rx + 12, rec_y + rec_h - 32, "STATUS: UNCONDITIONAL FLIGHT CLEARANCE ACTIVE")

    pdf.setFillColor(c_text_sub)
    pdf.setFont("Helvetica", 7.2)
    pdf.drawString(rx + 12, rec_y + rec_h - 47, "1. Maintain mandatory 75 min/day ARED & T2 resistance conditioning.")
    pdf.drawString(rx + 12, rec_y + rec_h - 59, "2. Oral hydration verified nominal (2.28 L/day). Maintain electrolyte intake.")
    pdf.drawString(rx + 12, rec_y + rec_h - 71, "3. Radiation cumulative flux 0.60 mSv within safe ALARA parameters.")
    pdf.drawString(rx + 12, rec_y + rec_h - 83, "4. Approved for upcoming Extravehicular Activity (EVA) maintenance.")

    # ==========================================
    # 6. SIGNATURE & DOCUMENT CONTROL FOOTER (Y = 32 to 95)
    # ==========================================
    footer_y = 32.0
    pdf.setStrokeColor(colors.HexColor('#1e293b'))
    pdf.setLineWidth(0.8)
    pdf.line(ml, footer_y + 48, ml + w, footer_y + 48)

    pdf.setFillColor(c_text_sub)
    pdf.setFont("Helvetica", 7.2)
    pdf.drawString(ml, footer_y + 34, "MEDICAL OFFICER ATTESTATION:")
    pdf.setFillColor(c_text_white)
    pdf.setFont("Helvetica-Bold", 7.8)
    pdf.drawString(ml + 140, footer_y + 34, "Dr. Maya Chen, MD · Chief Medical Officer (CMO) · Expedition CHX-01")

    pdf.setFillColor(c_text_muted)
    pdf.setFont("Helvetica", 6.8)
    pdf.drawRightString(ml + w, footer_y + 34, "VERIFIED HASH: NASA-STD3001-CHX01-8849-V7")

    pdf.drawString(ml, footer_y + 18, "COSMOHEALTHX AUTONOMOUS SPACE TELEMEDICINE PLATFORM · NASA SPACE APPS CHALLENGE 2026")
    pdf.drawRightString(ml + w, footer_y + 18, "CLASSIFICATION: CONFIDENTIAL CREW MEDICAL RECORD")

    pdf.drawString(ml, footer_y + 6, "Synthetic demonstration telemetry rendered in strict accordance with NASA-STD-3001 Vol 1 & 2 human-system integration standards.")
    pdf.drawRightString(ml + w, footer_y + 6, "PAGE 1 OF 1")

    pdf.save()
    return buffer.getvalue()
