#!/usr/bin/env python3
"""Generate the polished Support Lab submission PDF."""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "SaaS-Support-AI-Submission.pdf"
REPO_URL = "https://github.com/004mayank/saas-support-ai-assignment"

INK = colors.HexColor("#18231E")
GREEN = colors.HexColor("#246A4B")
GREEN_DARK = colors.HexColor("#194D37")
SAGE = colors.HexColor("#E3F0E8")
LIME = colors.HexColor("#CCECAE")
BLUE = colors.HexColor("#315C71")
BLUE_SOFT = colors.HexColor("#E6EFF2")
STONE = colors.HexColor("#F0EDE3")
PAPER = colors.HexColor("#F7F8F5")
LINE = colors.HexColor("#DDE4DD")
MUTED = colors.HexColor("#667269")
WHITE = colors.white


def register_fonts():
    candidates = [
        ("/System/Library/Fonts/Supplemental/Arial.ttf", "SupportSans"),
        ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", "SupportSans-Bold"),
    ]
    for path, name in candidates:
        if Path(path).exists():
            pdfmetrics.registerFont(TTFont(name, path))
    return (
        "SupportSans" if "SupportSans" in pdfmetrics.getRegisteredFontNames() else "Helvetica",
        "SupportSans-Bold" if "SupportSans-Bold" in pdfmetrics.getRegisteredFontNames() else "Helvetica-Bold",
    )


FONT, FONT_BOLD = register_fonts()


class LabelPill(Flowable):
    def __init__(self, text, kind="skill", width=38 * mm):
        super().__init__()
        self.text = text.upper()
        self.kind = kind
        self.width = width
        self.height = 8 * mm

    def draw(self):
        palette = {
            "skill": (SAGE, GREEN_DARK),
            "agent": (BLUE_SOFT, BLUE),
            "neither": (STONE, colors.HexColor("#6F6755")),
            "pass": (SAGE, GREEN),
        }
        background, foreground = palette.get(self.kind, palette["skill"])
        self.canv.setFillColor(background)
        self.canv.roundRect(0, 0, self.width, self.height, self.height / 2, stroke=0, fill=1)
        self.canv.setFillColor(foreground)
        self.canv.setFont(FONT_BOLD, 8.5)
        self.canv.drawCentredString(self.width / 2, 2.65 * mm, self.text)


class CoverDiagram(Flowable):
    def __init__(self, width=166 * mm, height=62 * mm):
        super().__init__()
        self.width = width
        self.height = height

    def draw(self):
        c = self.canv
        center_x = self.width / 2
        center_y = self.height / 2
        c.setStrokeColor(colors.HexColor("#466050"))
        c.setLineWidth(0.7)
        c.circle(center_x, center_y, 28 * mm, stroke=1, fill=0)
        c.setStrokeColor(colors.HexColor("#78927F"))
        c.setDash(3, 3)
        c.circle(center_x, center_y, 21 * mm, stroke=1, fill=0)
        c.setDash()
        cards = [
            (center_x - 53 * mm, "SKILL", "Reusable procedure", SAGE, GREEN_DARK),
            (center_x - 17 * mm, "AGENT", "Bounded investigation", BLUE_SOFT, BLUE),
            (center_x + 19 * mm, "NEITHER", "Deterministic control", STONE, colors.HexColor("#6F6755")),
        ]
        for x, label, note, fill, text in cards:
            c.setFillColor(fill)
            c.roundRect(x, center_y - 14 * mm, 34 * mm, 28 * mm, 4 * mm, stroke=0, fill=1)
            c.setFillColor(text)
            c.setFont(FONT_BOLD, 11)
            c.drawCentredString(x + 17 * mm, center_y + 2.5 * mm, label)
            c.setFont(FONT, 8)
            c.drawCentredString(x + 17 * mm, center_y - 4.5 * mm, note)


class SectionRule(Flowable):
    def __init__(self, width=170 * mm):
        super().__init__()
        self.width = width
        self.height = 3 * mm

    def draw(self):
        self.canv.setStrokeColor(LINE)
        self.canv.line(0, 1.5 * mm, self.width, 1.5 * mm)


def styles():
    base = getSampleStyleSheet()
    return {
        "cover_kicker": ParagraphStyle("cover_kicker", fontName=FONT_BOLD, fontSize=8, leading=10, textColor=LIME, spaceAfter=7 * mm, letterSpacing=1.2),
        "cover_title": ParagraphStyle("cover_title", fontName=FONT_BOLD, fontSize=32, leading=34, textColor=WHITE, spaceAfter=6 * mm),
        "cover_sub": ParagraphStyle("cover_sub", fontName=FONT, fontSize=11, leading=17, textColor=colors.HexColor("#BCC8C0"), spaceAfter=8 * mm),
        "cover_note": ParagraphStyle("cover_note", fontName=FONT, fontSize=9.2, leading=13, textColor=colors.HexColor("#B8C4BC")),
        "h1": ParagraphStyle("h1", fontName=FONT_BOLD, fontSize=22, leading=26, textColor=INK, spaceAfter=5 * mm),
        "h2": ParagraphStyle("h2", fontName=FONT_BOLD, fontSize=13, leading=16, textColor=GREEN_DARK, spaceBefore=3 * mm, spaceAfter=2.5 * mm),
        "h3": ParagraphStyle("h3", fontName=FONT_BOLD, fontSize=9, leading=12, textColor=INK, spaceBefore=2 * mm, spaceAfter=1.5 * mm),
        "kicker": ParagraphStyle("kicker", fontName=FONT_BOLD, fontSize=7, leading=9, textColor=GREEN, spaceAfter=2.5 * mm, letterSpacing=1),
        "body": ParagraphStyle("body", fontName=FONT, fontSize=8.6, leading=13, textColor=INK, spaceAfter=2.5 * mm),
        "small": ParagraphStyle("small", fontName=FONT, fontSize=7.2, leading=10.5, textColor=MUTED),
        "bullet": ParagraphStyle("bullet", fontName=FONT, fontSize=8.2, leading=12, textColor=INK, leftIndent=4 * mm, firstLineIndent=-3 * mm, bulletIndent=0, spaceAfter=1.5 * mm),
        "callout": ParagraphStyle("callout", fontName=FONT_BOLD, fontSize=10, leading=14, textColor=GREEN_DARK, alignment=TA_LEFT),
        "code": ParagraphStyle("code", fontName="Courier", fontSize=6.3, leading=8.7, textColor=colors.HexColor("#324039"), leftIndent=3 * mm, rightIndent=3 * mm, spaceBefore=2 * mm, spaceAfter=2 * mm),
        "table_head": ParagraphStyle("table_head", fontName=FONT_BOLD, fontSize=7, leading=9, textColor=colors.HexColor("#748078")),
        "table": ParagraphStyle("table", fontName=FONT, fontSize=7.1, leading=10, textColor=INK),
        "table_bold": ParagraphStyle("table_bold", fontName=FONT_BOLD, fontSize=7.2, leading=10, textColor=INK),
        "center": ParagraphStyle("center", parent=base["BodyText"], fontName=FONT, fontSize=7.5, leading=10, textColor=MUTED, alignment=TA_CENTER),
    }


S = styles()


def P(text, style="body"):
    return Paragraph(text, S[style])


def bullet(text):
    return Paragraph(f"- {text}", S["bullet"])


def card(flowables, background=WHITE, border=LINE, padding=5 * mm, width=170 * mm):
    table = Table([[flowables]], colWidths=[width])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), background),
        ("BOX", (0, 0), (-1, -1), 0.6, border),
        ("LEFTPADDING", (0, 0), (-1, -1), padding),
        ("RIGHTPADDING", (0, 0), (-1, -1), padding),
        ("TOPPADDING", (0, 0), (-1, -1), padding),
        ("BOTTOMPADDING", (0, 0), (-1, -1), padding),
    ]))
    return table


def code_card(text):
    return card([Preformatted(text, S["code"])], background=colors.HexColor("#F4F6F3"), padding=3 * mm)


def page_header_footer(canvas, doc):
    width, height = A4
    if doc.page == 1:
        canvas.setFillColor(INK)
        canvas.rect(0, 0, width, height, fill=1, stroke=0)
        canvas.setFillColor(colors.HexColor("#21352C"))
        canvas.circle(width + 5 * mm, height - 6 * mm, 58 * mm, fill=1, stroke=0)
        canvas.setFillColor(colors.HexColor("#1D3028"))
        canvas.circle(-12 * mm, 14 * mm, 42 * mm, fill=1, stroke=0)
        return

    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(20 * mm, height - 16 * mm, width - 20 * mm, height - 16 * mm)
    canvas.setFillColor(MUTED)
    canvas.setFont(FONT_BOLD, 6.5)
    canvas.drawString(20 * mm, height - 12 * mm, "SUPPORT LAB  /  SAAS SUPPORT AI ASSIGNMENT")
    canvas.setFont(FONT, 6.5)
    canvas.drawRightString(width - 20 * mm, height - 12 * mm, "STANDALONE COMPONENTS - MOCK DATA")
    canvas.line(20 * mm, 14 * mm, width - 20 * mm, 14 * mm)
    canvas.drawString(20 * mm, 9.5 * mm, "Skill, Agent, or Neither")
    canvas.drawRightString(width - 20 * mm, 9.5 * mm, f"{doc.page:02d}")


def build_story():
    story = []

    # Cover
    story.extend([
        Spacer(1, 22 * mm),
        P("ARCHITECTURE SUBMISSION  /  AUGUST 2026", "cover_kicker"),
        P("Skill, Agent,<br/>or Neither?", "cover_title"),
        P("A grounded AI design for five SaaS support capabilities.<br/>Four standalone components. Zero orchestration.", "cover_sub"),
        LabelPill("2 Skills", "skill", 31 * mm),
        Spacer(1, 3 * mm),
        LabelPill("2 Agents", "agent", 31 * mm),
        Spacer(1, 9 * mm),
        CoverDiagram(),
        Spacer(1, 7 * mm),
        P("Prepared as a single-user, provider-agnostic project submission. All customer, policy, pricing, ticket, and changelog data is fictional.", "cover_note"),
        PageBreak(),
    ])

    # Mapping
    story.extend([
        P("01  /  DECISION MAP", "kicker"),
        P("Classify the behavior before choosing the artifact", "h1"),
        P("The count is an outcome of one consistent test, not a quota. Deterministic safety controls stay outside the model; stateless procedures become Skills; bounded synthesis or conditional investigation becomes an Agent.", "body"),
        Spacer(1, 3 * mm),
    ])
    rows = [[P("CAPABILITY", "table_head"), P("DECISION", "table_head"), P("JUSTIFICATION", "table_head")]]
    mapping = [
        ("New-ticket triage, routing, and immediate escalation", "NEITHER", "Live-outage, legal, and security escalation must execute as deterministic inbox/on-call rules before any AI queue. Optional classification can follow without owning the safety path."),
        ("Tone- and policy-safe outbound replies", "SKILL", "A repeatable, stateless drafting procedure can load the current policy snapshot, enforce commercial grounding, and return a fixed review block."),
        ("At-risk customer one-page briefing", "AGENT", "The component must reconcile billing, usage, and ticket evidence, label gaps, form hypotheses, and produce a bounded call plan."),
        ("Weekly closed-ticket quality grading", "SKILL", "Rubric application and evidence-backed scoring are stable procedures. Sampling and weekly scheduling are orchestration and are intentionally excluded."),
        ("Known-issue check and bug handoff", "AGENT", "The component performs a conditional investigation: match a changelog entry with evidence, or create a structured new-issue handoff."),
    ]
    for capability, decision, reason in mapping:
        kind = decision.lower()
        rows.append([P(capability, "table_bold"), LabelPill(decision, kind, 24 * mm), P(reason, "table")])
    mapping_table = Table(rows, colWidths=[59 * mm, 29 * mm, 82 * mm], repeatRows=1)
    mapping_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EFF2EE")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.45, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 3.5 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5 * mm),
    ]))
    story.extend([
        mapping_table,
        Spacer(1, 6 * mm),
        card([P("Safety principle", "h3"), P("An LLM may help categorize a normal ticket, but immediate keyword and outage escalation cannot depend on model latency, availability, or probabilistic recall.", "body")], background=STONE),
        PageBreak(),
    ])

    # Decision model and scope
    story.extend([
        P("02  /  SCOPE MODEL", "kicker"),
        P("A narrow component is easier to trust", "h1"),
        P("Each submitted artifact accepts an explicit input and returns a bounded output. None listens to a queue, schedules itself, calls another artifact, mutates customer systems, or sends a message.", "body"),
        Spacer(1, 3 * mm),
    ])
    cards = []
    for title, prompt, outcome, fill in [
        ("1. Deterministic?", "Must it execute instantly and identically every time?", "Use ordinary rules or software. This is Neither.", STONE),
        ("2. Stateless procedure?", "Does it apply reusable domain guidance to one supplied input?", "Package the guidance, references, and validator as a Skill.", SAGE),
        ("3. Bounded investigation?", "Must it reconcile sources, branch, or manage uncertainty?", "Create a read-only Agent with the minimum input and tool scope.", BLUE_SOFT),
    ]:
        cards.append(card([P(title, "h2"), P(prompt, "body"), P(outcome, "small")], background=fill, padding=4 * mm, width=52 * mm))
    story.append(Table([[cards[0], cards[1], cards[2]]], colWidths=[56.5 * mm] * 3, style=[("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 2 * mm)]))
    story.extend([
        Spacer(1, 7 * mm),
        P("Explicit boundaries", "h2"),
        bullet("No coordinator, end-to-end wiring, event listener, weekly scheduler, or full pipeline demo."),
        bullet("No backend integrations are required: realistic records are pasted into each standalone workspace."),
        bullet("No Agent has Memory. No Agent can create a ticket, change an account, send a reply, or approve a commercial term."),
        bullet("The web app starts in deterministic demo mode and can optionally call a user-selected model."),
        Spacer(1, 5 * mm),
        card([P("Provider-agnostic configuration", "h3"), P("The single-user Config UI supports OpenAI, Anthropic, Google Gemini, OpenRouter, Ollama, and custom OpenAI-compatible endpoints. Keys remain in browser session storage and requests run only on an explicit click.", "body")], background=colors.HexColor("#F2F5F1")),
        PageBreak(),
    ])

    # Skill 1
    story.extend([
        P("03  /  STANDALONE SKILL", "kicker"),
        P("Policy-safe reply", "h1"),
        LabelPill("Skill", "skill", 24 * mm),
        Spacer(1, 4 * mm),
        P("Purpose", "h2"),
        P("Draft a send-ready customer reply in the Acme Cloud voice while grounding every refund, credit, price, discount, eligibility window, and billing commitment in the supplied current policy.", "body"),
        P("Guardrails", "h2"),
        bullet("Treat absent or ambiguous policy as unknown; never estimate or imply a commercial outcome."),
        bullet("Return two fixed sections: Customer reply and Grounding check."),
        bullet("Validate monetary tokens in the reply against the supplied policy snapshot."),
        Spacer(1, 3 * mm),
        P("Realistic test input", "h2"),
        code_card("SUP-1048 / Mia Chen\nGrowth plan renewed yesterday for USD 149.\nCustomer asks for a refund; no duplicate charge or billing error.\nPolicy: renewals are non-refundable except duplicate charge or billing error."),
        P("Result excerpt", "h2"),
        code_card("Hi Mia,\n\nI checked the renewal details. Subscription renewals are not refundable\nunless the charge is duplicated or caused by an Acme Cloud billing error,\nand neither applies here.\n\nGrounding check: policy v2026.08.18; monetary claims: none;\nhuman review: not required."),
        Spacer(1, 3 * mm),
        card([P("PASS", "callout"), P("Output shape, tone phrases, and numeric grounding validated by validate_reply.py.", "small")], background=SAGE, border=colors.HexColor("#BCD8C8")),
        PageBreak(),
    ])

    # Skill 2
    story.extend([
        P("04  /  STANDALONE SKILL", "kicker"),
        P("Support QA grader", "h1"),
        LabelPill("Skill", "skill", 24 * mm),
        Spacer(1, 4 * mm),
        P("Purpose", "h2"),
        P("Apply a weighted quality rubric to closed tickets, cite observable transcript evidence for every deduction, enforce hard caps, and summarize recurring patterns only when the sample supports them.", "body"),
        P("Rubric", "h2"),
    ])
    rubric_rows = [
        [P("DIMENSION", "table_head"), P("POINTS", "table_head"), P("FULL-CREDIT STANDARD", "table_head")],
        [P("Resolution", "table_bold"), P("30", "table"), P("Resolves the issue or clearly advances it with an owned next step.", "table")],
        [P("Accuracy and policy", "table_bold"), P("25", "table"), P("No unsupported product, refund, pricing, or timeline claim.", "table")],
        [P("Communication", "table_bold"), P("20", "table"), P("Clear, concise, empathetic, and on voice.", "table")],
        [P("Ownership", "table_bold"), P("15", "table"), P("Names the owner and next action.", "table")],
        [P("Process and records", "table_bold"), P("10", "table"), P("Captures material troubleshooting and identifiers.", "table")],
    ]
    rubric = Table(rubric_rows, colWidths=[43 * mm, 22 * mm, 105 * mm], repeatRows=1)
    rubric.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), colors.HexColor("#EFF2EE")), ("GRID", (0,0), (-1,-1), .45, LINE), ("VALIGN", (0,0), (-1,-1), "MIDDLE"), ("LEFTPADDING", (0,0), (-1,-1), 3 * mm), ("RIGHTPADDING", (0,0), (-1,-1), 3 * mm), ("TOPPADDING", (0,0), (-1,-1), 2.5 * mm), ("BOTTOMPADDING", (0,0), (-1,-1), 2.5 * mm)]))
    story.extend([
        rubric,
        Spacer(1, 4 * mm),
        P("Realistic test", "h2"),
        code_card("SUP-1082 / failed import E-17\nAgent promises an engineering fix by tomorrow and a $200 refund,\nthen hands off without an owner, diagnostics, or follow-up."),
        P("Result", "h2"),
        code_card("41 / 100 - Fails standard\nResolution 12/30 | Accuracy 5/25 | Communication 15/20\nOwnership 5/15 | Process 4/10\nCommercial-claim cap applied: yes\nCoaching: collect job ID and logs; avoid unsupported promises; retain ownership."),
        card([P("PASS", "callout"), P("Score ranges, cap, arithmetic, and evidence presence validated by validate_scorecard.py.", "small")], background=SAGE, border=colors.HexColor("#BCD8C8")),
        PageBreak(),
    ])

    # Agent 1
    story.extend([
        P("05  /  STANDALONE AGENT", "kicker"),
        P("Retention brief agent", "h1"),
        LabelPill("Agent", "agent", 24 * mm),
        Spacer(1, 4 * mm),
        P("Bounded goal", "h2"),
        P("Turn supplied billing, product usage, and past-ticket records into a one-page pre-call briefing. Reconcile dates, distinguish observations from hypotheses, label missing sources, and never invent a customer motive or commercial offer.", "body"),
        P("Minimum scope", "h2"),
        bullet("Input: one JSON object with account, billing, usage, and ticket sections."),
        bullet("Tools: none in the mock submission; all records are supplied directly."),
        bullet("Memory: disabled. Writes, customer contact, and account changes: prohibited."),
        Spacer(1, 3 * mm),
        P("Realistic test input", "h2"),
        code_card("Northstar Labs / Growth / USD 17,880 ARR / renewal 30 Sep 2026\nBilling: latest invoice 12 days late\nUsage: WAU 42 -> 17; automation runs 1,280 -> 410\nTickets: SSO issue reopened twice with 2/5 CSAT"),
        P("Result excerpt", "h2"),
        code_card("Risk evidence\n- WAU and automation volume fell by more than half.\n- INV-883 was paid 12 days late.\n- SUP-991 reopened twice and received 2/5 CSAT.\n\nCall plan\n1. Confirm new executive and operational owners.\n2. Ask which teams stopped using automations and why.\n3. Agree on an SSO recovery owner and adoption checkpoint."),
        card([P("PASS", "callout"), P("All three source sections were traced. Motivations remained labeled hypotheses. No unapproved commercial term was introduced.", "small")], background=BLUE_SOFT, border=colors.HexColor("#BFD4DB")),
        PageBreak(),
    ])

    # Agent 2
    story.extend([
        P("06  /  STANDALONE AGENT", "kicker"),
        P("Bug investigator agent", "h1"),
        LabelPill("Agent", "agent", 24 * mm),
        Spacer(1, 4 * mm),
        P("Bounded goal", "h2"),
        P("Compare a customer bug report with the supplied changelog. A known-issue match requires at least two discriminating aligned signals and no material contradiction. Branch to customer guidance for a known issue or an engineering-ready handoff for a new or uncertain issue.", "body"),
        P("Minimum scope", "h2"),
        bullet("Input: one JSON object with report and changelog sections."),
        bullet("Tools: none in the mock submission; the supplied changelog is the complete search scope."),
        bullet("Cannot create an engineering ticket or claim a reproduction that was not provided."),
        Spacer(1, 3 * mm),
        P("Realistic test input", "h2"),
        code_card("SUP-1117: Analytics CSV export stalls at 92% for a 120-day range.\nChrome 127 / EU / web-2026.08.27 / 3 of 3 attempts.\nChangelog: Safari PDF stall at 90%; fixed CSV timeout for ranges over one year."),
        P("Result excerpt", "h2"),
        code_card("Classification: New or unmatched issue.\nTitle: Analytics CSV export stalls at 92% for ranges over 90 days in EU.\nEvidence: KI-224 conflicts on browser and export type; FIX-812 concerns\nranges over one year and is already fixed.\nMissing: workspace ID, job ID, timestamps, dataset size, console errors."),
        card([P("PASS", "callout"), P("The Agent rejected a keyword-only match, preserved uncertainty, and used only supplied steps and evidence.", "small")], background=BLUE_SOFT, border=colors.HexColor("#BFD4DB")),
        PageBreak(),
    ])

    # Test matrix
    story.extend([
        P("07  /  TEST EVIDENCE", "kicker"),
        P("Independent inputs, outputs, and checks", "h1"),
        P("Each artifact was invoked on one realistic mock case without calling any other artifact. The web app exposes the same four independent run surfaces.", "body"),
        Spacer(1, 3 * mm),
    ])
    test_rows = [[P("CASE", "table_head"), P("INPUT", "table_head"), P("EXPECTED BEHAVIOR", "table_head"), P("RESULT", "table_head")]]
    tests = [
        ("TC-01\nPolicy-safe reply", "Renewal refund request + current policy", "No unsupported refund or figure; fixed grounding block", "PASS"),
        ("TC-02\nQA grader", "Closed ticket with invented refund and timeline", "Apply score cap; evidence-backed deductions", "PASS"),
        ("TC-03\nRetention brief", "Billing + usage + ticket records", "Trace all sources; label hypotheses and confidence", "PASS"),
        ("TC-04\nBug investigator", "Bug report + two near-match changelog entries", "Reject contradictions; produce new-issue handoff", "PASS"),
    ]
    for case, input_text, behavior, result in tests:
        test_rows.append([P(case.replace("\n", "<br/>"), "table_bold"), P(input_text, "table"), P(behavior, "table"), LabelPill(result, "pass", 19 * mm)])
    tests_table = Table(test_rows, colWidths=[35 * mm, 47 * mm, 60 * mm, 28 * mm], repeatRows=1)
    tests_table.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), colors.HexColor("#EFF2EE")), ("GRID", (0,0), (-1,-1), .45, LINE), ("VALIGN", (0,0), (-1,-1), "MIDDLE"), ("ALIGN", (3,1), (3,-1), "CENTER"), ("LEFTPADDING", (0,0), (-1,-1), 3 * mm), ("RIGHTPADDING", (0,0), (-1,-1), 3 * mm), ("TOPPADDING", (0,0), (-1,-1), 4 * mm), ("BOTTOMPADDING", (0,0), (-1,-1), 4 * mm)]))
    story.extend([
        tests_table,
        Spacer(1, 7 * mm),
        P("Validation summary", "h2"),
        bullet("Both Skill folders pass the canonical skill structure validator."),
        bullet("Reply output passes numeric-grounding, required-section, and discouraged-tone checks."),
        bullet("QA output passes dimension ranges, commercial cap, total arithmetic, and evidence checks."),
        bullet("The production web build and server-render/API integration tests pass."),
        Spacer(1, 4 * mm),
        card([P("4 / 4 standalone cases pass", "callout"), P("Mock data is deliberate: backend integrations were not required, and omitting them keeps tool scope honest.", "small")], background=SAGE, border=colors.HexColor("#BCD8C8")),
        PageBreak(),
    ])

    # AI use / handoff
    story.extend([
        P("08  /  AI USE AND HANDOFF", "kicker"),
        P("What AI drafted, what a human decided", "h1"),
        P("AI-assisted work", "h2"),
        bullet("Initial classification alternatives and justification drafts."),
        bullet("First drafts of Skill and Agent instructions, mock fixtures, expected outputs, UI copy, provider adapters, tests, and this report layout."),
        bullet("Implementation assistance for the single-user web application and PDF generation."),
        P("Manual decisions and modifications", "h2"),
        bullet("Kept the safety-critical escalation path deterministic and outside the LLM."),
        bullet("Separated stateless policy/rubric procedure from multi-source and conditional investigation."),
        bullet("Removed unnecessary tools and Memory from both Agents."),
        bullet("Defined and reviewed the commercial policy, tone guide, QA weights, hard cap, schemas, evidence threshold, and every expected output."),
        bullet("Ran structural, arithmetic, build, API, and rendered-PDF verification."),
        Spacer(1, 4 * mm),
        P("Accessible files", "h2"),
    ])
    qr_code = qr.QrCodeWidget(REPO_URL)
    bounds = qr_code.getBounds()
    qr_size = 33 * mm
    drawing = Drawing(qr_size, qr_size, transform=[qr_size/(bounds[2]-bounds[0]), 0, 0, qr_size/(bounds[3]-bounds[1]), 0, 0])
    drawing.add(qr_code)
    access = Table([[
        [P("Public source repository", "h3"), P(f'<link href="{REPO_URL}" color="#246A4B">{REPO_URL}</link>', "small"), Spacer(1, 3 * mm), P("Contains Skills, Agents, fixtures, validators, AI-use disclosure, web app source, and submission artifacts.", "small")],
        drawing,
    ]], colWidths=[130 * mm, 38 * mm])
    access.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#F2F5F1")), ("BOX", (0,0), (-1,-1), .5, LINE), ("VALIGN", (0,0), (-1,-1), "MIDDLE"), ("LEFTPADDING", (0,0), (-1,-1), 5 * mm), ("RIGHTPADDING", (0,0), (-1,-1), 5 * mm), ("TOPPADDING", (0,0), (-1,-1), 5 * mm), ("BOTTOMPADDING", (0,0), (-1,-1), 5 * mm)]))
    story.append(access)
    return story


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=22 * mm,
        bottomMargin=18 * mm,
        title="Support Lab - Skill, Agent, or Neither",
        author="Support Lab project team",
        subject="SaaS Support AI assignment submission",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id="all", frames=[frame], onPage=page_header_footer)])
    doc.build(build_story())
    print(OUT)


if __name__ == "__main__":
    main()
