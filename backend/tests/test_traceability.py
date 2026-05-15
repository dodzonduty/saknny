import unittest
from pathlib import Path
import re

from backend.app.schemas.response import error_response, success_response


class TestApiContractCoverage(unittest.TestCase):
    def test_core_chapter3_routes_exist(self):
        endpoint_dir = Path("backend/app/api/endpoints")
        existing_paths: set[str] = set()
        route_pattern = re.compile(r'@router\.(?:get|post|put|delete)\("([^"]+)"')
        for endpoint_file in endpoint_dir.glob("*.py"):
            content = endpoint_file.read_text(encoding="utf-8")
            existing_paths.update(route_pattern.findall(content))
        expected_paths = {
            "/login",
            "/register",
            "/{student_id}/documents",
            "/{student_id}/profile",
            "/verifications",
            "/verifications/{doc_id}",
            "/students/{student_id}/enrollment",
            "/catalog/buildings",
            "/admin/catalog/buildings",
            "/catalog/rooms",
            "/admin/catalog/rooms",
            "/applications",
            "/applications/me",
            "/applications/{app_id}/waitlist",
            "/admin/applications",
            "/admin/applications/{app_id}/review",
            "/admin/applications/{app_id}/finalize",
            "/admin/allocations",
            "/allocations/me",
            "/admin/contracts/leases",
            "/contracts/leases/me",
            "/contracts/leases/{lease_id}/sign",
            "/admin/contracts/leases/{lease_id}/expire",
            "/billing/payments/initiate",
            "/billing/payments/{payment_id}/confirm",
            "/billing/payments/me",
            "/admin/billing/payments",
            "/admin/billing/payments/{payment_id}/refund",
            "/checkins/initiate",
            "/admin/checkins/{checkin_id}/issue-key",
            "/lifecycle/room-change",
            "/admin/lifecycle/room-change",
            "/admin/lifecycle/room-change/{request_id}/review",
            "/lifecycle/checkout",
            "/maintenance/tickets",
            "/maintenance/tickets/me",
            "/admin/maintenance/tickets",
            "/admin/maintenance/tickets/{ticket_id}/assign",
            "/admin/maintenance/tickets/{ticket_id}/escalate",
            "/messages",
            "/announcements",
            "/admin/announcements",
            "/admin/analytics/dashboard",
            "/admin/audit/logs",
            "/admin/surveys",
            "/admin/surveys/{survey_id}/dispatch",
            "/surveys/me",
            "/surveys/{dispatch_id}/complete",
        }
        missing = sorted(expected_paths - existing_paths)
        self.assertEqual([], missing, f"Missing expected routes: {missing}")


class TestResponseEnvelope(unittest.TestCase):
    def test_success_response_shape(self):
        resp = success_response({"ok": True})
        self.assertTrue(resp.success)
        self.assertEqual({"ok": True}, resp.data)
        self.assertIsNone(resp.error)

    def test_error_response_shape(self):
        resp = error_response("failed")
        self.assertFalse(resp.success)
        self.assertIsNone(resp.data)
        self.assertEqual("failed", resp.error)


class TestSchemaContractCoverage(unittest.TestCase):
    def test_schema_contract_contains_chapter3_tables(self):
        schema_path = Path("contracts/database/schema.md")
        content = schema_path.read_text(encoding="utf-8")
        required_tables = [
            "## Table: applications",
            "## Table: buildings",
            "## Table: rooms",
            "## Table: allocations",
            "## Table: leases",
            "## Table: payment_intents",
            "## Table: maintenance_tickets",
            "## Table: room_change_requests",
            "## Table: announcements",
            "## Table: messages",
            "## Table: audit_logs",
            "## Table: surveys",
            "## Table: survey_dispatches",
        ]
        for table_header in required_tables:
            self.assertIn(table_header, content)


if __name__ == "__main__":
    unittest.main()
