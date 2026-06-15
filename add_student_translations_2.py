import json
import os

EN_PATH = r"d:\saknny\frontend\src\i18n\locales\en.json"
AR_PATH = r"d:\saknny\frontend\src\i18n\locales\ar.json"

with open(EN_PATH, "r", encoding="utf-8") as f:
    en_data = json.load(f)

with open(AR_PATH, "r", encoding="utf-8") as f:
    ar_data = json.load(f)

# MAINTENANCE
en_data["maintenance"]["notAllocated"] = "Not Allocated"
en_data["maintenance"]["mustBeAllocatedDesc"] = "You must be allocated to a room before you can submit maintenance requests."
en_data["maintenance"]["submitNewRequest"] = "Submit a New Request"
en_data["maintenance"]["noRequestsDesc"] = "You have not submitted any maintenance requests."

ar_data["maintenance"]["notAllocated"] = "غير مخصص"
ar_data["maintenance"]["mustBeAllocatedDesc"] = "يجب أن يتم تخصيص غرفة لك قبل أن تتمكن من تقديم طلبات صيانة."
ar_data["maintenance"]["submitNewRequest"] = "تقديم طلب جديد"
ar_data["maintenance"]["noRequestsDesc"] = "لم تقم بتقديم أي طلبات صيانة."

# MESSAGES
if "messages" not in en_data:
    en_data["messages"] = {}
if "messages" not in ar_data:
    ar_data["messages"] = {}

en_data["messages"]["messagesTitle"] = "Messages"
en_data["messages"]["messagesDesc"] = "Send and receive messages with administrators."
en_data["messages"]["notAllocated"] = "Not Allocated"
en_data["messages"]["mustBeAllocatedDesc"] = "You must be allocated to a room before you can send or receive messages."
en_data["messages"]["showAll"] = "Show All"
en_data["messages"]["noMessages"] = "No messages yet."
en_data["messages"]["sendMessageButton"] = "Send Message"
en_data["messages"]["adminLabel"] = "Admin"
en_data["messages"]["studentLabel"] = "Student"
en_data["messages"]["recipientId"] = "Recipient ID"
en_data["messages"]["messagePlaceholder"] = "Message"

ar_data["messages"]["messagesTitle"] = "الرسائل"
ar_data["messages"]["messagesDesc"] = "إرسال واستقبال الرسائل مع الإدارة."
ar_data["messages"]["notAllocated"] = "غير مخصص"
ar_data["messages"]["mustBeAllocatedDesc"] = "يجب أن يتم تخصيص غرفة لك قبل أن تتمكن من إرسال أو استقبال الرسائل."
ar_data["messages"]["showAll"] = "إظهار الكل"
ar_data["messages"]["noMessages"] = "لا توجد رسائل بعد."
ar_data["messages"]["sendMessageButton"] = "إرسال رسالة"
ar_data["messages"]["adminLabel"] = "إدارة"
ar_data["messages"]["studentLabel"] = "طالب"
ar_data["messages"]["recipientId"] = "معرف المستلم"
ar_data["messages"]["messagePlaceholder"] = "الرسالة"

# ROOM CHANGE
if "roomChange" not in en_data:
    en_data["roomChange"] = {}
if "roomChange" not in ar_data:
    ar_data["roomChange"] = {}

en_data["roomChange"]["roomChangeTitle"] = "Room Change"
en_data["roomChange"]["roomChangeDesc"] = "Request a transfer to a different room or building."
en_data["roomChange"]["requestSubmitted"] = "Request Submitted"
en_data["roomChange"]["requestSubmittedDesc"] = "Your room change request has been sent to an administrator for review."
en_data["roomChange"]["requestId"] = "Request ID"
en_data["roomChange"]["statusLabel"] = "Status"
en_data["roomChange"]["noPreference"] = "No preference"

ar_data["roomChange"]["roomChangeTitle"] = "تغيير الغرفة"
ar_data["roomChange"]["roomChangeDesc"] = "طلب نقل إلى غرفة أو مبنى آخر."
ar_data["roomChange"]["requestSubmitted"] = "تم تقديم الطلب"
ar_data["roomChange"]["requestSubmittedDesc"] = "تم إرسال طلب تغيير الغرفة الخاص بك إلى المسؤول لمراجعته."
ar_data["roomChange"]["requestId"] = "رقم الطلب"
ar_data["roomChange"]["statusLabel"] = "الحالة"
ar_data["roomChange"]["noPreference"] = "لا يوجد تفضيل"

# SURVEYS
if "surveys" not in en_data:
    en_data["surveys"] = {}
if "surveys" not in ar_data:
    ar_data["surveys"] = {}

en_data["surveys"]["surveysTitle"] = "Surveys"
en_data["surveys"]["surveysDesc"] = "Complete assigned surveys to help improve housing services."
en_data["surveys"]["noSurveys"] = "No Surveys"
en_data["surveys"]["noSurveysDesc"] = "You don't have any surveys assigned at this time."

ar_data["surveys"]["surveysTitle"] = "الاستبيانات"
ar_data["surveys"]["surveysDesc"] = "أكمل الاستبيانات المعينة للمساعدة في تحسين خدمات السكن."
ar_data["surveys"]["noSurveys"] = "لا توجد استبيانات"
ar_data["surveys"]["noSurveysDesc"] = "ليس لديك أي استبيانات معينة في الوقت الحالي."

with open(EN_PATH, "w", encoding="utf-8") as f:
    json.dump(en_data, f, indent=2, ensure_ascii=False)

with open(AR_PATH, "w", encoding="utf-8") as f:
    json.dump(ar_data, f, indent=2, ensure_ascii=False)

print("Added maintenance, messages, roomChange, surveys translations!")
