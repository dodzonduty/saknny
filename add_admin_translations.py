import json
import os

EN_PATH = r"d:\saknny\frontend\src\i18n\locales\en.json"
AR_PATH = r"d:\saknny\frontend\src\i18n\locales\ar.json"

with open(EN_PATH, "r", encoding="utf-8") as f:
    en_data = json.load(f)

with open(AR_PATH, "r", encoding="utf-8") as f:
    ar_data = json.load(f)

# Ensure admin namespace exists
if "admin" not in en_data:
    en_data["admin"] = {}
if "admin" not in ar_data:
    ar_data["admin"] = {}

# 1. Allocations
en_data["admin"]["allocationsTitle"] = "Allocations"
en_data["admin"]["allocationsSubtitle"] = "Manage room assignments."
en_data["admin"]["aiAutoAssign"] = "AI Auto Assign"
en_data["admin"]["cancelAi"] = "Cancel AI"
en_data["admin"]["manualAssign"] = "Manual Assignment"
en_data["admin"]["cancelAssignment"] = "Cancel Assignment"
en_data["admin"]["aiDesc"] = "Automatically cluster compatible students based on their questionnaire responses and assign them to available rooms in the target dorm."
en_data["admin"]["targetDorm"] = "Target Dorm"
en_data["admin"]["selectTargetDorm"] = "Select Target Dorm..."
en_data["admin"]["mealPlanDefault"] = "Meal Plan Default"
en_data["admin"]["standard"] = "Standard"
en_data["admin"]["fullBoard"] = "Full Board"
en_data["admin"]["generateClusters"] = "Generate Clusters"
en_data["admin"]["previewAssignments"] = "Preview Assignments"
en_data["admin"]["noCompatible"] = "No compatible students or rooms available to assign."
en_data["admin"]["cluster"] = "Cluster"
en_data["admin"]["confirmAllocate"] = "Confirm & Allocate"
en_data["admin"]["manualRoomAssign"] = "Manual Room Assignment"
en_data["admin"]["appIdLabel"] = "Application ID"
en_data["admin"]["roomLabel"] = "Room"
en_data["admin"]["selectRoom"] = "Select a room..."
en_data["admin"]["mealPlan"] = "Meal Plan"
en_data["admin"]["breakfastOnly"] = "Breakfast Only"
en_data["admin"]["assigning"] = "Assigning..."
en_data["admin"]["assignRoom"] = "Assign Room"
en_data["admin"]["noAllocations"] = "No Allocations Yet"
en_data["admin"]["noActiveAssign"] = "There are currently no active room assignments."

ar_data["admin"]["allocationsTitle"] = "التخصيصات"
ar_data["admin"]["allocationsSubtitle"] = "إدارة تخصيص الغرف."
ar_data["admin"]["aiAutoAssign"] = "تخصيص تلقائي بالذكاء الاصطناعي"
ar_data["admin"]["cancelAi"] = "إلغاء الذكاء الاصطناعي"
ar_data["admin"]["manualAssign"] = "تخصيص يدوي"
ar_data["admin"]["cancelAssignment"] = "إلغاء التخصيص"
ar_data["admin"]["aiDesc"] = "تجميع الطلاب المتوافقين تلقائيًا بناءً على إجابات الاستبيان وتخصيصهم في الغرف المتاحة في السكن المستهدف."
ar_data["admin"]["targetDorm"] = "السكن المستهدف"
ar_data["admin"]["selectTargetDorm"] = "حدد السكن المستهدف..."
ar_data["admin"]["mealPlanDefault"] = "خطة الوجبات الافتراضية"
ar_data["admin"]["standard"] = "أساسي"
ar_data["admin"]["fullBoard"] = "إقامة كاملة"
ar_data["admin"]["generateClusters"] = "توليد المجموعات"
ar_data["admin"]["previewAssignments"] = "معاينة التخصيصات"
ar_data["admin"]["noCompatible"] = "لا يوجد طلاب متوافقون أو غرف متاحة للتخصيص."
ar_data["admin"]["cluster"] = "مجموعة"
ar_data["admin"]["confirmAllocate"] = "تأكيد وتخصيص"
ar_data["admin"]["manualRoomAssign"] = "تخصيص الغرفة يدويًا"
ar_data["admin"]["appIdLabel"] = "رقم الطلب"
ar_data["admin"]["roomLabel"] = "الغرفة"
ar_data["admin"]["selectRoom"] = "اختر غرفة..."
ar_data["admin"]["mealPlan"] = "خطة الوجبات"
ar_data["admin"]["breakfastOnly"] = "إفطار فقط"
ar_data["admin"]["assigning"] = "جاري التخصيص..."
ar_data["admin"]["assignRoom"] = "تخصيص الغرفة"
ar_data["admin"]["noAllocations"] = "لا توجد تخصيصات بعد"
ar_data["admin"]["noActiveAssign"] = "لا توجد تخصيصات غرف نشطة حاليًا."

# 2. Announcements
en_data["admin"]["publishAnnouncement"] = "Publish Announcement"
en_data["admin"]["broadcastUpdates"] = "Broadcast important updates to students and staff."
en_data["admin"]["titleLabel"] = "Title"
en_data["admin"]["contentLabel"] = "Content"
en_data["admin"]["aiExpand"] = "AI Expand"
en_data["admin"]["draftPlaceholder"] = "Write your announcement here or write a short draft and click AI Expand..."
en_data["admin"]["targetAudience"] = "Target Audience"
en_data["admin"]["studentsOnly"] = "Students Only"
en_data["admin"]["adminsOnly"] = "Admins Only"
en_data["admin"]["everyone"] = "Everyone"

ar_data["admin"]["publishAnnouncement"] = "نشر إعلان"
ar_data["admin"]["broadcastUpdates"] = "بث التحديثات المهمة للطلاب والموظفين."
ar_data["admin"]["titleLabel"] = "العنوان"
ar_data["admin"]["contentLabel"] = "المحتوى"
ar_data["admin"]["aiExpand"] = "توسيع بالذكاء الاصطناعي"
ar_data["admin"]["draftPlaceholder"] = "اكتب إعلانك هنا أو اكتب مسودة قصيرة وانقر فوق توسيع بالذكاء الاصطناعي..."
ar_data["admin"]["targetAudience"] = "الجمهور المستهدف"
ar_data["admin"]["studentsOnly"] = "الطلاب فقط"
ar_data["admin"]["adminsOnly"] = "المسؤولون فقط"
ar_data["admin"]["everyone"] = "الجميع"

# 3. Applications
en_data["admin"]["applicationQueue"] = "Application Queue"
en_data["admin"]["reviewQueue"] = "Review and process student housing applications."
en_data["admin"]["queueEmpty"] = "Queue Empty"
en_data["admin"]["noAppsInStatus"] = "No applications currently in"
en_data["admin"]["statusStatus"] = "status."
en_data["admin"]["reviewActions"] = "Review Actions"
en_data["admin"]["markUnderReview"] = "Mark Under Review"
en_data["admin"]["moveToWaitlist"] = "Move to Waitlist"
en_data["admin"]["approve"] = "Approve"
en_data["admin"]["reject"] = "Reject"

ar_data["admin"]["applicationQueue"] = "قائمة الطلبات"
ar_data["admin"]["reviewQueue"] = "مراجعة ومعالجة طلبات سكن الطلاب."
ar_data["admin"]["queueEmpty"] = "القائمة فارغة"
ar_data["admin"]["noAppsInStatus"] = "لا توجد طلبات حاليًا في حالة"
ar_data["admin"]["statusStatus"] = "."
ar_data["admin"]["reviewActions"] = "إجراءات المراجعة"
ar_data["admin"]["markUnderReview"] = "تحديد كقيد المراجعة"
ar_data["admin"]["moveToWaitlist"] = "نقل إلى قائمة الانتظار"
ar_data["admin"]["approve"] = "موافقة"
ar_data["admin"]["reject"] = "رفض"

with open(EN_PATH, "w", encoding="utf-8") as f:
    json.dump(en_data, f, indent=2, ensure_ascii=False)

with open(AR_PATH, "w", encoding="utf-8") as f:
    json.dump(ar_data, f, indent=2, ensure_ascii=False)

print("Added admin batch 1 translations!")
