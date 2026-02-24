import re
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.apps import apps


ISO_27001_CLAUSES = [
    ("4.1", "External and internal issues affecting the organization and its information security management system are identified and reviewed."),
    ("4.2", "Information security needs and expectations of relevant interested parties are clearly understood and documented."),
    ("4.3", "The scope of the information security management system is defined."),
    ("4.4", "The ISMS is established, implemented, maintained, and continually improved."),
    ("5.1", "Leadership ensures that the ISMS supports continual improvement and is adequately resourced."),
    ("5.2", "The documented information security policy is relevant and communicated."),
    ("5.3", "Responsibilities and authorities for the ISMS are assigned and understood."),
    ("6.1", "Risks and opportunities are identified and managed using a risk assessment process, a risk treatment process, and appropriate controls (SoA)."),
    ("6.2", "The information security objectives are defined, communicated, and measurable as appropriate."),
    ("6.3", "Changes to the ISMS are managed in a planned manner."),
    ("7.1", "Resources required for the ISMS are determined and provided."),
    ("7.2", "Individuals are competent; records of competence are maintained."),
    ("7.3", "Individuals are aware of the ISMS and their role in achieving information security objectives."),
    ("7.4", "Internal and external communication requirements are defined."),
    ("7.5", "Documented information for the ISMS is properly approved, controlled, and maintained."),
    ("8.1", "Processes required to meet information security objectives are planned, implemented, and controlled."),
    ("8.2", "Information security risk assessment is done regularly and documented according to clause 6.1.2."),
    ("8.3", "Risk treatment plans are executed according to clause 6.1.3."),
    ("9.1", "Performance of the ISMS is monitored and evaluated according to defined metrics."),
    ("9.2", "Internal audits verify the organization’s conformity and the ISMS suitability, effectiveness, and adequacy."),
    ("9.3", "Periodic management reviews of the ISMS performace drive continual improvement."),
    ("10.1", "Continual improvement of the ISMS is maintained."),
    ("10.2", "Nonconformities are managed and corrective actions are implemented."),
]


ANNEX_A_CONTROLS = [
    ("A.5.1", "Policies for information security"),
    ("A.5.2", "Information security roles and responsibilities"),
    ("A.5.3", "Segregation of duties"),
    ("A.5.4", "Management responsibilities"),
    ("A.5.5", "Contact with authorities"),
    ("A.5.6", "Contact with special interest groups"),
    ("A.5.7", "Threat intelligence"),
    ("A.5.8", "Information security in project management"),
    ("A.5.9", "Inventory of information and other associated assets"),
    ("A.5.10", "Acceptable use of information and other associated assets"),
    ("A.5.11", "Return of assets"),
    ("A.5.12", "Classification of information"),
    ("A.5.13", "Labelling of information"),
    ("A.5.14", "Information transfer"),
    ("A.5.15", "Access control"),
    ("A.5.16", "Identity management"),
    ("A.5.17", "Authentication information"),
    ("A.5.18", "Access rights"),
    ("A.5.19", "Information security in supplier relationships"),
    ("A.5.20", "Addressing information security within supplier agreements"),
    ("A.5.21", "Managing information security in the ICT supply chain"),
    ("A.5.22", "Monitoring, review and change management of supplier services"),
    ("A.5.23", "Information security for use of cloud services"),
    ("A.5.24", "Information security incident management planning and preparation"),
    ("A.5.25", "Assessment and decision on information security events"),
    ("A.5.26", "Response to information security incidents"),
    ("A.5.27", "Learning from information security incidents"),
    ("A.5.28", "Collection of evidence"),
    ("A.5.29", "Information security during disruption"),
    ("A.5.30", "ICT readiness for business continuity"),
    ("A.5.31", "Legal, statutory, regulatory and contractual requirements"),
    ("A.5.32", "Intellectual property rights"),
    ("A.5.33", "Protection of records"),
    ("A.5.34", "Privacy and protection of PII"),
    ("A.5.35", "Independent review of information security"),
    ("A.5.36", "Compliance with policies, rules and standards for information security"),
    ("A.5.37", "Documented operating procedures"),
    ("A.6.1", "Screening"),
    ("A.6.2", "Terms and conditions of employment"),
    ("A.6.3", "Information security awareness, education and training"),
    ("A.6.4", "Disciplinary process"),
    ("A.6.5", "Responsibilities after termination or change of employment"),
    ("A.6.6", "Confidentiality or non-disclosure agreements"),
    ("A.6.7", "Remote working"),
    ("A.6.8", "Information security event reporting"),
    ("A.7.1", "Physical security perimeters"),
    ("A.7.2", "Physical entry controls"),
    ("A.7.3", "Securing offices, rooms and facilities"),
    ("A.7.4", "Physical security monitoring"),
    ("A.7.5", "Protecting against physical and environmental threats"),
    ("A.7.6", "Working in secure areas"),
    ("A.7.7", "Clear desk and clear screen policy"),
    ("A.7.8", "Equipment siting and protection"),
    ("A.7.9", "Security of assets off-premises"),
    ("A.7.10", "Storage media"),
    ("A.7.11", "Supporting utilities"),
    ("A.7.12", "Cabling security"),
    ("A.7.13", "Equipment maintenance"),
    ("A.7.14", "Secure disposal or re-use of equipment"),
    ("A.8.1", "User endpoint equipment"),
    ("A.8.2", "Privileged access rights"),
    ("A.8.3", "Information access restriction"),
    ("A.8.4", "Access control to program source code"),
    ("A.8.5", "Secure authentication"),
    ("A.8.6", "Capacity management"),
    ("A.8.7", "Protection against malware"),
    ("A.8.8", "Management of technical vulnerabilities"),
    ("A.8.9", "Configuration management"),
    ("A.8.10", "Information deletion"),
    ("A.8.11", "Data masking"),
    ("A.8.12", "Data leakage prevention"),
    ("A.8.13", "Information backup"),
    ("A.8.14", "Redundancy of information processing facilities"),
    ("A.8.15", "Logging"),
    ("A.8.16", "Monitoring activities"),
    ("A.8.17", "Clock synchronization"),
    ("A.8.18", "Use of privileged utility programs"),
    ("A.8.19", "Installation of software on operational systems"),
    ("A.8.20", "Networks security"),
    ("A.8.21", "Security of network services"),
    ("A.8.22", "Segregation of networks"),
    ("A.8.23", "Web filtering"),
    ("A.8.24", "Use of cryptography"),
    ("A.8.25", "Secure development life cycle"),
    ("A.8.26", "Application security requirements"),
    ("A.8.27", "Secure system architecture and engineering principles"),
    ("A.8.28", "Secure coding"),
    ("A.8.29", "Security testing in development and acceptance"),
    ("A.8.30", "Outsourced development"),
    ("A.8.31", "Separation of development, test and production environments"),
    ("A.8.32", "Change management"),
    ("A.8.33", "Test information"),
    ("A.8.34", "Protection of information systems during audit testing"),
]


def split_clause(code: str):
    major, minor = code.split(".")
    return int(major), int(minor)


def control_group(code: str) -> str:
    # A.5.1 -> A.5
    m = re.match(r"^(A\.\d+)\.\d+$", code)
    return m.group(1) if m else ""


class Command(BaseCommand):
    help = "Seed ISO 27001 clauses (4–10) into ComplianceClause (org-scoped) and Annex A controls (global)."

    def add_arguments(self, parser):
        parser.add_argument("--slug", required=True, help="Organization slug e.g. demo")
        parser.add_argument("--update-existing", action="store_true")
        parser.add_argument("--dry-run", action="store_true")

    @transaction.atomic
    def handle(self, *args, **opts):
        Organization = apps.get_model("api", "Organization")
        ComplianceClause = apps.get_model("api", "ComplianceClause")
        Control = apps.get_model("api", "Control")

        slug = opts["slug"].strip()
        update_existing = opts["update_existing"]
        dry_run = opts["dry_run"]

        org = Organization.objects.filter(slug=slug).first()
        if not org:
            raise CommandError(f"Organization with slug='{slug}' not found.")

        # ---- Clauses (org-scoped via ComplianceClause) ----
        created = existing = updated = 0

        for clause_number, short_desc in ISO_27001_CLAUSES:
            major, minor = split_clause(clause_number)

            defaults = {
                "organization": org,
                "standard": "iso-27001",
                "clause_number": clause_number,
                "clause_major": major,
                "clause_minor": minor,
                "short_description": short_desc,
                "description": short_desc,
            }

            obj, was_created = ComplianceClause.objects.get_or_create(
                organization=org,
                standard="iso-27001",
                clause_number=clause_number,
                defaults=defaults,
            )

            if was_created:
                created += 1
            else:
                existing += 1
                if update_existing:
                    changed = False
                    if obj.clause_major != major:
                        obj.clause_major = major; changed = True
                    if obj.clause_minor != minor:
                        obj.clause_minor = minor; changed = True
                    if obj.short_description != short_desc:
                        obj.short_description = short_desc; changed = True
                    if obj.description != short_desc:
                        obj.description = short_desc; changed = True
                    if changed:
                        updated += 1
                        if not dry_run:
                            obj.save()

        # ---- Controls (global via Control) ----
        c_created = c_existing = c_updated = 0

        for code, title in ANNEX_A_CONTROLS:
            grp = control_group(code)

            obj, was_created = Control.objects.get_or_create(
                standard="iso-27001",
                code=code,
                defaults={"title": title, "description": title, "group": grp},
            )

            if was_created:
                c_created += 1
            else:
                c_existing += 1
                if update_existing:
                    changed = False
                    if obj.title != title:
                        obj.title = title; changed = True
                    # keep description simple for now
                    if obj.description != title:
                        obj.description = title; changed = True
                    if getattr(obj, "group", "") != grp:
                        obj.group = grp; changed = True
                    if changed:
                        c_updated += 1
                        if not dry_run:
                            obj.save()

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN: no database writes performed."))

        self.stdout.write(self.style.SUCCESS(f"✅ ISO 27001 seed complete for org '{slug}'"))
        self.stdout.write(f"Clauses: created={created}, existing={existing}, updated={updated}")
        self.stdout.write(f"Controls: created={c_created}, existing={c_existing}, updated={c_updated}")
