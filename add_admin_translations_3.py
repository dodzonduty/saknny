import json
import os

EN_PATH = r"d:\saknny\frontend\src\i18n\locales\en.json"
AR_PATH = r"d:\saknny\frontend\src\i18n\locales\ar.json"

with open(EN_PATH, "r", encoding="utf-8") as f:
    en_data = json.load(f)

with open(AR_PATH, "r", encoding="utf-8") as f:
    ar_data = json.load(f)

# 7. Checkins
en_data["admin"]["checkinsTitle"] = "Check-in Management"
en_data["admin"]["checkinsSubtitle"] = "Issue room keys to students who have initiated check-in."
en_data["admin"]["issueRoomKey"] = "Issue Room Key"
en_data["admin"]["checkinIdLabel"] = "Check-in ID"
en_data["admin"]["checkinIdPlaceholder"] = "Enter the check-in request ID..."
en_data["admin"]["checkinIdHint"] = "The student must have an active allocation and an initiated check-in request."
en_data["admin"]["issueKeyBtn"] = "Issue Key"

ar_data["admin"]["checkinsTitle"] = "إدارة تسجيل الدخول"
ar_data["admin"]["checkinsSubtitle"] = "إصدار مفاتيح الغرف للطلاب الذين بدأوا عملية تسجيل الدخول."
ar_data["admin"]["issueRoomKey"] = "إصدار مفتاح الغرفة"
ar_data["admin"]["checkinIdLabel"] = "رقم تسجيل الدخول"
ar_data["admin"]["checkinIdPlaceholder"] = "أدخل رقم طلب تسجيل الدخول..."
ar_data["admin"]["checkinIdHint"] = "يجب أن يكون لدى الطالب تخصيص نشط وطلب تسجيل دخول مبدئي."
ar_data["admin"]["issueKeyBtn"] = "إصدار المفتاح"

# 8. Leases
en_data["admin"]["allocationIdLabel"] = "Allocation ID"
en_data["admin"]["allocationIdPlaceholder"] = "Enter allocation ID..."
en_data["admin"]["allocationIdHint"] = "The student must have an 'assigned' allocation to receive a lease."
en_data["admin"]["expirationDateLabel"] = "Expiration Date (Optional)"
en_data["admin"]["expireLease"] = "Expire a Lease"
en_data["admin"]["leaseIdLabel"] = "Lease ID"
en_data["admin"]["leaseIdPlaceholder"] = "Enter lease ID to expire..."
en_data["admin"]["expireLeaseBtn"] = "Expire Lease"

ar_data["admin"]["allocationIdLabel"] = "رقم التخصيص"
ar_data["admin"]["allocationIdPlaceholder"] = "أدخل رقم التخصيص..."
ar_data["admin"]["allocationIdHint"] = "يجب أن يكون لدى الطالب تخصيص 'معين' للحصول على عقد إيجار."
ar_data["admin"]["expirationDateLabel"] = "تاريخ الانتهاء (اختياري)"
ar_data["admin"]["expireLease"] = "إنهاء عقد إيجار"
ar_data["admin"]["leaseIdLabel"] = "رقم العقد"
ar_data["admin"]["leaseIdPlaceholder"] = "أدخل رقم العقد لإنهائه..."
ar_data["admin"]["expireLeaseBtn"] = "إنهاء العقد"

# 9. Maintenance
en_data["admin"]["noTicketsFound"] = "No Tickets Found"
en_data["admin"]["noTicketsInStatus"] = "There are currently no tickets in"
en_data["admin"]["statusStatus"] = "status."
en_data["admin"]["ticketIdCol"] = "Ticket ID"
en_data["admin"]["priorityCol"] = "Priority"
en_data["admin"]["roomCol"] = "Room"
en_data["admin"]["studentCol"] = "Student"
en_data["admin"]["actionsCol"] = "Actions"
en_data["admin"]["changeStatus"] = "Change Status..."
en_data["admin"]["markAssigned"] = "Mark Assigned"
en_data["admin"]["markInProgress"] = "Mark In Progress"
en_data["admin"]["markResolved"] = "Mark Resolved"
en_data["admin"]["escalateBtn"] = "Escalate"
en_data["admin"]["reasonPrompt"] = "Reason for escalation?"
en_data["admin"]["unassigned"] = "Unassigned"
en_data["admin"]["tabOpen"] = "Open"
en_data["admin"]["tabAssigned"] = "Assigned"
en_data["admin"]["tabInProgress"] = "In Progress"
en_data["admin"]["tabEscalated"] = "Escalated"
en_data["admin"]["tabResolved"] = "Resolved"

ar_data["admin"]["noTicketsFound"] = "لم يتم العثور على تذاكر"
ar_data["admin"]["noTicketsInStatus"] = "لا توجد تذاكر حاليًا في حالة"
ar_data["admin"]["statusStatus"] = "."
ar_data["admin"]["ticketIdCol"] = "رقم التذكرة"
ar_data["admin"]["priorityCol"] = "الأولوية"
ar_data["admin"]["roomCol"] = "الغرفة"
ar_data["admin"]["studentCol"] = "الطالب"
ar_data["admin"]["actionsCol"] = "الإجراءات"
ar_data["admin"]["changeStatus"] = "تغيير الحالة..."
ar_data["admin"]["markAssigned"] = "تعيين كـ 'معين'"
ar_data["admin"]["markInProgress"] = "تعيين كـ 'قيد التنفيذ'"
ar_data["admin"]["markResolved"] = "تعيين كـ 'تم الحل'"
ar_data["admin"]["escalateBtn"] = "تصعيد"
ar_data["admin"]["reasonPrompt"] = "سبب التصعيد؟"
ar_data["admin"]["unassigned"] = "غير معين"
ar_data["admin"]["tabOpen"] = "مفتوح"
ar_data["admin"]["tabAssigned"] = "معين"
ar_data["admin"]["tabInProgress"] = "قيد التنفيذ"
ar_data["admin"]["tabEscalated"] = "تم التصعيد"
ar_data["admin"]["tabResolved"] = "تم الحل"

with open(EN_PATH, "w", encoding="utf-8") as f:
    json.dump(en_data, f, indent=2, ensure_ascii=False)

with open(AR_PATH, "w", encoding="utf-8") as f:
    json.dump(ar_data, f, indent=2, ensure_ascii=False)

print("Added admin batch 3 translations!")
