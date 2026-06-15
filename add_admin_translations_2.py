import json
import os

EN_PATH = r"d:\saknny\frontend\src\i18n\locales\en.json"
AR_PATH = r"d:\saknny\frontend\src\i18n\locales\ar.json"

with open(EN_PATH, "r", encoding="utf-8") as f:
    en_data = json.load(f)

with open(AR_PATH, "r", encoding="utf-8") as f:
    ar_data = json.load(f)

# 4. Audit
en_data["admin"]["auditLogsTitle"] = "Audit Logs"
en_data["admin"]["auditLogsSubtitle"] = "System-wide immutable ledger of all administrative and student actions."
en_data["admin"]["refreshLogs"] = "Refresh Logs"
en_data["admin"]["noLogsFound"] = "No Logs Found"
en_data["admin"]["auditTrailEmpty"] = "The audit trail is currently empty."
en_data["admin"]["actorCol"] = "Actor"
en_data["admin"]["actionCol"] = "Action"
en_data["admin"]["targetEntityCol"] = "Target Entity"
en_data["admin"]["timestampCol"] = "Timestamp"
en_data["admin"]["detailsCol"] = "Details"
en_data["admin"]["hideState"] = "Hide State"
en_data["admin"]["viewState"] = "View State"
en_data["admin"]["beforeState"] = "Before State"
en_data["admin"]["afterState"] = "After State"

ar_data["admin"]["auditLogsTitle"] = "سجلات التدقيق"
ar_data["admin"]["auditLogsSubtitle"] = "سجل غير قابل للتغيير على مستوى النظام لجميع الإجراءات الإدارية والطلابية."
ar_data["admin"]["refreshLogs"] = "تحديث السجلات"
ar_data["admin"]["noLogsFound"] = "لم يتم العثور على سجلات"
ar_data["admin"]["auditTrailEmpty"] = "مسار التدقيق فارغ حاليًا."
ar_data["admin"]["actorCol"] = "الفاعل"
ar_data["admin"]["actionCol"] = "الإجراء"
ar_data["admin"]["targetEntityCol"] = "الكيان المستهدف"
ar_data["admin"]["timestampCol"] = "وقت وتاريخ"
ar_data["admin"]["detailsCol"] = "التفاصيل"
ar_data["admin"]["hideState"] = "إخفاء الحالة"
ar_data["admin"]["viewState"] = "عرض الحالة"
ar_data["admin"]["beforeState"] = "حالة ما قبل"
ar_data["admin"]["afterState"] = "حالة ما بعد"

# 5. Billing (Admin)
en_data["admin"]["noPaymentsFound"] = "No Payments Found"
en_data["admin"]["noRecordedPayments"] = "There are currently no recorded payments."
en_data["admin"]["typeCol"] = "Type"
en_data["admin"]["amountCol"] = "Amount"
en_data["admin"]["dateCol"] = "Date"
en_data["admin"]["actionsCol"] = "Actions"
en_data["admin"]["refundBtn"] = "Refund"
en_data["admin"]["refundConfirm"] = "Are you sure you want to refund this payment?"

ar_data["admin"]["noPaymentsFound"] = "لم يتم العثور على مدفوعات"
ar_data["admin"]["noRecordedPayments"] = "لا توجد مدفوعات مسجلة حاليًا."
ar_data["admin"]["typeCol"] = "النوع"
ar_data["admin"]["amountCol"] = "المبلغ"
ar_data["admin"]["dateCol"] = "التاريخ"
ar_data["admin"]["actionsCol"] = "الإجراءات"
ar_data["admin"]["refundBtn"] = "استرداد"
ar_data["admin"]["refundConfirm"] = "هل أنت متأكد أنك تريد استرداد هذه الدفعة؟"

# 6. Catalog
en_data["admin"]["catalogTitle"] = "Catalog Management"
en_data["admin"]["catalogSubtitle"] = "Create, edit, and manage buildings and rooms. Attendance geofence is configured per room."
en_data["admin"]["buildingsTab"] = "Buildings"
en_data["admin"]["roomsTab"] = "Rooms"
en_data["admin"]["addBuilding"] = "Add Building"
en_data["admin"]["editBuilding"] = "Edit Building"
en_data["admin"]["newBuilding"] = "New Building"
en_data["admin"]["addRoom"] = "Add Room"
en_data["admin"]["editRoom"] = "Edit Room"
en_data["admin"]["newRoom"] = "New Room"
en_data["admin"]["nameCol"] = "Name"
en_data["admin"]["genderCol"] = "Gender"
en_data["admin"]["statusCol"] = "Status"
en_data["admin"]["male"] = "Male"
en_data["admin"]["female"] = "Female"
en_data["admin"]["active"] = "Active"
en_data["admin"]["maintenance"] = "Maintenance"
en_data["admin"]["inactive"] = "Inactive"
en_data["admin"]["buildingLabel"] = "Building"
en_data["admin"]["roomNumLabel"] = "Room #"
en_data["admin"]["totalLabel"] = "Total"
en_data["admin"]["availLabel"] = "Avail"
en_data["admin"]["latLabel"] = "Latitude"
en_data["admin"]["lonLabel"] = "Longitude"
en_data["admin"]["radiusLabel"] = "Radius (m)"
en_data["admin"]["prefsLabel"] = "Prefs"
en_data["admin"]["bedsCol"] = "Beds"
en_data["admin"]["geofenceCol"] = "Geofence"
en_data["admin"]["editBtn"] = "Edit"

ar_data["admin"]["catalogTitle"] = "إدارة الكتالوج"
ar_data["admin"]["catalogSubtitle"] = "إنشاء وتحرير وإدارة المباني والغرف. يتم تكوين السياج الجغرافي للحضور لكل غرفة."
ar_data["admin"]["buildingsTab"] = "المباني"
ar_data["admin"]["roomsTab"] = "الغرف"
ar_data["admin"]["addBuilding"] = "إضافة مبنى"
ar_data["admin"]["editBuilding"] = "تعديل المبنى"
ar_data["admin"]["newBuilding"] = "مبنى جديد"
ar_data["admin"]["addRoom"] = "إضافة غرفة"
ar_data["admin"]["editRoom"] = "تعديل غرفة"
ar_data["admin"]["newRoom"] = "غرفة جديدة"
ar_data["admin"]["nameCol"] = "الاسم"
ar_data["admin"]["genderCol"] = "الجنس"
ar_data["admin"]["statusCol"] = "الحالة"
ar_data["admin"]["male"] = "ذكر"
ar_data["admin"]["female"] = "أنثى"
ar_data["admin"]["active"] = "نشط"
ar_data["admin"]["maintenance"] = "صيانة"
ar_data["admin"]["inactive"] = "غير نشط"
ar_data["admin"]["buildingLabel"] = "المبنى"
ar_data["admin"]["roomNumLabel"] = "رقم الغرفة"
ar_data["admin"]["totalLabel"] = "الإجمالي"
ar_data["admin"]["availLabel"] = "المتاح"
ar_data["admin"]["latLabel"] = "خط العرض"
ar_data["admin"]["lonLabel"] = "خط الطول"
ar_data["admin"]["radiusLabel"] = "النطاق (م)"
ar_data["admin"]["prefsLabel"] = "التفضيلات"
ar_data["admin"]["bedsCol"] = "الأسرة"
ar_data["admin"]["geofenceCol"] = "السياج الجغرافي"
ar_data["admin"]["editBtn"] = "تعديل"

with open(EN_PATH, "w", encoding="utf-8") as f:
    json.dump(en_data, f, indent=2, ensure_ascii=False)

with open(AR_PATH, "w", encoding="utf-8") as f:
    json.dump(ar_data, f, indent=2, ensure_ascii=False)

print("Added admin batch 2 translations!")
