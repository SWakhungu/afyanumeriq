# backend/api/tests/test_tenancy.py

from django.test import TestCase
from django.utils import timezone
from django.db import IntegrityError

from api.models import Organization, ComplianceClause, Risk, Audit, TenantSequence
from api.isms_models import Asset, Control, SoAEntry



class MultiTenancyModelTests(TestCase):
    def setUp(self):
        self.org_a = Organization.objects.create(slug="alpha", name="Alpha Org")
        self.org_b = Organization.objects.create(slug="beta", name="Beta Org")

    def test_7101_risk_id_unique_per_tenant(self):
        today = timezone.now().date()
        Risk.objects.create(
            organization=self.org_a,
            risk_id="RSK-0001",
            description="Alpha risk",
            likelihood="Medium",
            impact="Medium",
            risk_score=9.0,
            risk_level="Medium",
            owner="Owner",
            status="Open",
            review_date=today,
        )

        # Same risk_id in a different tenant should be allowed
        Risk.objects.create(
            organization=self.org_b,
            risk_id="RSK-0001",
            description="Beta risk",
            likelihood="Medium",
            impact="Medium",
            risk_score=9.0,
            risk_level="Medium",
            owner="Owner",
            status="Open",
            review_date=today,
        )

        # Same risk_id in same tenant should fail
        with self.assertRaises(IntegrityError):
            Risk.objects.create(
                organization=self.org_a,
                risk_id="RSK-0001",
                description="Duplicate",
                likelihood="Medium",
                impact="Medium",
                risk_score=9.0,
                risk_level="Medium",
                owner="Owner",
                status="Open",
                review_date=today,
            )

    def test_compliance_clause_unique_per_tenant_standard_clause(self):
        ComplianceClause.objects.create(
            organization=self.org_a,
            standard="iso-7101",
            clause_number="4.1",
            clause_major=4,
            clause_minor=1,
            short_description="Alpha clause",
            description="Alpha clause",
            status="NI",
        )

        # Same clause_number + standard in another tenant is allowed
        ComplianceClause.objects.create(
            organization=self.org_b,
            standard="iso-7101",
            clause_number="4.1",
            clause_major=4,
            clause_minor=1,
            short_description="Beta clause",
            description="Beta clause",
            status="NI",
        )

        # Duplicate within same tenant should fail
        with self.assertRaises(IntegrityError):
            ComplianceClause.objects.create(
                organization=self.org_a,
                standard="iso-7101",
                clause_number="4.1",
                clause_major=4,
                clause_minor=1,
                short_description="Dup clause",
                description="Dup clause",
                status="NI",
            )

    def test_audit_id_unique_per_tenant(self):
        today = timezone.now().date()
        Audit.objects.create(
            organization=self.org_a,
            audit_id="AUD-0001",
            audit_name="Alpha Audit",
            objective="obj",
            scope="scope",
            date=today,
            lead_auditor="Auditor",
            participants="People",
            standard="iso-27001",
            status="Scheduled",
        )

        # Same ID in another tenant is allowed
        Audit.objects.create(
            organization=self.org_b,
            audit_id="AUD-0001",
            audit_name="Beta Audit",
            objective="obj",
            scope="scope",
            date=today,
            lead_auditor="Auditor",
            participants="People",
            standard="iso-27001",
            status="Scheduled",
        )

        # Duplicate in same tenant should fail
        with self.assertRaises(IntegrityError):
            Audit.objects.create(
                organization=self.org_a,
                audit_id="AUD-0001",
                audit_name="Dup",
                objective="obj",
                scope="scope",
                date=today,
                lead_auditor="Auditor",
                participants="People",
                standard="iso-27001",
                status="Scheduled",
            )

    def test_asset_sequence_is_per_tenant(self):
        a1 = Asset.objects.create(organization=self.org_a, name="A1", standard="iso-27001")
        a2 = Asset.objects.create(organization=self.org_a, name="A2", standard="iso-27001")

        b1 = Asset.objects.create(organization=self.org_b, name="B1", standard="iso-27001")

        # Org A should have AST-0001, AST-0002; org B should start at AST-0001
        self.assertEqual(a1.asset_id, "AST-0001")
        self.assertEqual(a2.asset_id, "AST-0002")
        self.assertEqual(b1.asset_id, "AST-0001")

        # TenantSequence should exist for each org
        self.assertTrue(TenantSequence.objects.filter(organization=self.org_a).exists())
        self.assertTrue(TenantSequence.objects.filter(organization=self.org_b).exists())

    def test_soa_unique_per_tenant_control_standard(self):
        c = Control.objects.create(code="A.5.1", title="T", description="D", group="G", standard="iso-27001")

        SoAEntry.objects.create(
            organization=self.org_a,
            control=c,
            standard="iso-27001",
            applicable=True,
            status="Not Implemented",
        )

        # Same control/standard in another tenant allowed
        SoAEntry.objects.create(
            organization=self.org_b,
            control=c,
            standard="iso-27001",
            applicable=True,
            status="Not Implemented",
        )

        # Duplicate in same tenant should fail
        with self.assertRaises(IntegrityError):
            SoAEntry.objects.create(
                organization=self.org_a,
                control=c,
                standard="iso-27001",
                applicable=True,
                status="Not Implemented",
            )
