import json
import os

EN_PATH = "frontend/src/i18n/locales/en.json"
AR_PATH = "frontend/src/i18n/locales/ar.json"

with open(EN_PATH, "r", encoding="utf-8") as f:
    en_data = json.load(f)

with open(AR_PATH, "r", encoding="utf-8") as f:
    ar_data = json.load(f)

# Ensure keys exist
if "admin" not in en_data:
    en_data["admin"] = {}
if "admin" not in ar_data:
    ar_data["admin"] = {}

en_data["dashboard"]["adminSidebarReports"] = "Reports"
ar_data["dashboard"]["adminSidebarReports"] = "التقارير"

# Admin Dashboard
en_admin = {
    "role": "Administrator",
    "overviewTitle": "System Overview",
    "overviewSubtitle": "Monitor real-time housing metrics, track occupancy, and review pending administrative tasks across the Sakny portal.",
    "occupancyRate": "Occupancy Rate",
    "target": "Target",
    "availableBeds": "Available Beds",
    "acrossRooms": "Across {rooms} rooms",
    "activeAllocations": "Active Allocations",
    "studentsAssigned": "Students assigned",
    "openTickets": "Open Tickets",
    "requiresAttention": "Requires attention",
    "missedAttendance": "Missed Attendance",
    "todaysAbsent": "Today's absent students",
    "housingApps": "Housing Applications",
    "viewAll": "View All",
    "noApps": "No applications yet.",
    "paymentStatus": "Payment Status",
    "noPayments": "No payments yet.",
    "maintenance": "Maintenance",
    "noTickets": "No tickets yet.",
    "directoryTitle": "Student Directory",
    "directorySubtitle": "Search for any student to view or edit their profile, allocation, and electronic ID.",
    "searchById": "Search by Student ID",
    "searchByName": "Search by Name",
    "tabPersonal": "Personal Information",
    "tabAllocation": "Room Allocation",
    "tabAttendance": "Attendance Log",
    "tabId": "Electronic ID",
    "notEnrolled": "Not Enrolled",
    "missingDocument": "Missing Document"
}

ar_admin = {
    "role": "مسؤول",
    "overviewTitle": "نظرة عامة على النظام",
    "overviewSubtitle": "راقب مقاييس السكن في الوقت الفعلي، وتتبع الإشغال، وراجع المهام الإدارية المعلقة عبر بوابة سكني.",
    "occupancyRate": "معدل الإشغال",
    "target": "الهدف",
    "availableBeds": "الأسرة المتاحة",
    "acrossRooms": "عبر {rooms} غرفة",
    "activeAllocations": "التخصيصات النشطة",
    "studentsAssigned": "الطلاب المعينين",
    "openTickets": "التذاكر المفتوحة",
    "requiresAttention": "تتطلب الانتباه",
    "missedAttendance": "الغياب اليومي",
    "todaysAbsent": "الطلاب الغائبون اليوم",
    "housingApps": "طلبات السكن",
    "viewAll": "عرض الكل",
    "noApps": "لا توجد طلبات بعد.",
    "paymentStatus": "حالة الدفع",
    "noPayments": "لا توجد مدفوعات بعد.",
    "maintenance": "الصيانة",
    "noTickets": "لا توجد تذاكر بعد.",
    "directoryTitle": "دليل الطلاب",
    "directorySubtitle": "ابحث عن أي طالب لعرض أو تعديل ملفه الشخصي، وتخصيصه، وهويته الإلكترونية.",
    "searchById": "البحث برقم الطالب",
    "searchByName": "البحث بالاسم",
    "tabPersonal": "المعلومات الشخصية",
    "tabAllocation": "تخصيص الغرفة",
    "tabAttendance": "سجل الحضور",
    "tabId": "الهوية الإلكترونية",
    "notEnrolled": "غير مسجل",
    "missingDocument": "مستند مفقود"
}

en_data["admin"].update(en_admin)
ar_data["admin"].update(ar_admin)

# Profile Tabs / Student Log Tab
if "profileLog" not in en_data:
    en_data["profileLog"] = {}
if "profileLog" not in ar_data:
    ar_data["profileLog"] = {}

en_profileLog = {
    "filters": "Report Filters",
    "startDate": "Start Date",
    "endDate": "End Date",
    "notAllocatedTitle": "Not Allocated",
    "notAllocatedDesc": "You have not been allocated a room yet. Your attendance log will become available once you move in.",
    "attendedDays": "Attended Days",
    "missedDays": "Missed Days",
    "overallRate": "Overall Rate",
    "acrossDays": "Across {days} days",
    "distTitle": "Attendance Distribution",
    "noData": "No data available",
    "activeTitle": "Student Log Active",
    "activeDesc1": "This report shows exactly how many days you attended or missed out of the ",
    "activeDesc2": " days selected in the filters. View the detailed log below for a day-by-day breakdown.",
    "tableTitle": "Attendance Log",
    "colDay": "Day",
    "colLocation": "Location",
    "colTime": "Time",
    "colStatus": "Status",
    "statusAttended": "Attended",
    "statusMissed": "Missed",
    "statusPending": "Pending",
    "noRecords": "No attendance records found for this period.",
    "colStudentName": "Student Name",
    "colStudentId": "Student ID",
    "colBuilding": "Building",
    "colRoom": "Room",
    "adminTableTitle": "Detailed Logs",
    "adminTableHiddenTitle": "Detailed Logs Hidden",
    "adminTableHiddenDesc": "Enter a specific Student ID or Student Name in the filters above to view the day-by-day table."
}

if "dashboardAdditions" not in en_data:
    en_data["dashboardAdditions"] = {}
if "dashboardAdditions" not in ar_data:
    ar_data["dashboardAdditions"] = {}

en_data["applications"].update({
    "emptyStateDesc": "You haven't submitted any housing applications yet. Review the catalog and submit an application to secure your room.",
    "applicationNumber": "Application #",
    "submitted": "Submitted:",
    "preferredDormId": "Preferred Dorm ID:",
    "nextAction": "Next Action",
    "newApplication": "New Application"
})

en_data["dashboardAdditions"].update({
    "successUpload": "Successfully Uploaded",
    "successUploadDesc": "Please go to My Verifications to Resubmit your application.",
    "actionRequired": "Action Required",
    "actionRequiredDesc": "Please go to My Verifications to see what needs to be fixed and Resubmit.",
    "yourDocuments": "Your Documents",
    "collegeId": "College ID",
    "enrollmentProof": "Enrollment Proof",
    "flagged": "Flagged",
    "uploaded": "Uploaded",
    "viewFile": "View File",
    "reason": "Reason",
    "reviewDetails": "Review Details",
    "exploreMap": "Explore Map",
    "viewMatches": "View Potential Matches",
    "newTicket": "New Ticket",
    "housingAllocation": "Your Housing Allocation",
    "assignedOn": "Assigned on",
    "building": "Building",
    "roomNumber": "Room Number",
    "mealPlan": "Meal Plan",
    "fullBoard": "Full Board",
    "breakfastOnly": "Breakfast Only",
    "noAllocation": "No Allocation Found",
    "noAllocationDesc": "Your account is verified, but you have not been allocated a room yet. Please submit a housing application.",
    "applyForHousing": "Apply for Housing",
    "docsUnderReview": "Documents Under Review",
    "docsUnderReviewDesc": "We have received your verification documents and they are currently under review by our admin team. You will be able to apply for housing once verified.",
    "accountNotVerified": "Account Not Verified",
    "accountNotVerifiedDesc": "You must verify your account with supporting documents before you can apply for housing or receive an allocation.",
    "uploadDocs": "Upload Verification Documents",
    "cardUnavailable": "Card Unavailable",
    "cardUnavailableDesc": "You must be fully verified and allocated to a room before you can generate your electronic dormitory ID card.",
    "electronicIdCard": "Electronic ID Card",
    "electronicIdCardDesc": "Use this card for building entry and restaurant access.",
    "generating": "Generating...",
    "downloadPdf": "Download PDF",
    "unknown": "Unknown",
    "na": "N/A",
    "searching": "Searching...",
    "noStudentsFound": "No students found",
    "studentProfileTitle": "Student Profile",
    "fullName": "Full Name",
    "facultyId": "Faculty ID",
    "emailAddress": "Email Address",
    "gender": "Gender",
    "male": "Male",
    "female": "Female",
    "homeCity": "Home City",
    "nationalityId": "Nationality ID",
    "facultyLabel": "Faculty",
    "housingPreferences": "Housing & Roommate Preferences",
    "nationalityIdFront": "Nationality ID (Front)",
    "nationalityIdBack": "Nationality ID (Back)",
    "uploadFrontPhoto": "Upload Front Photo",
    "uploadBackPhoto": "Upload Back Photo"
})

ar_data["dashboardAdditions"].update({
    "successUpload": "تم الرفع بنجاح",
    "successUploadDesc": "يرجى الانتقال إلى التحققات الخاصة بي لإعادة تقديم طلبك.",
    "actionRequired": "مطلوب إجراء",
    "actionRequiredDesc": "يرجى الانتقال إلى التحققات الخاصة بي لمعرفة ما يحتاج إلى إصلاح وإعادة التقديم.",
    "yourDocuments": "مستنداتك",
    "collegeId": "البطاقة الجامعية",
    "enrollmentProof": "إثبات التسجيل",
    "flagged": "معلق",
    "uploaded": "تم الرفع",
    "viewFile": "عرض الملف",
    "reason": "السبب",
    "reviewDetails": "مراجعة التفاصيل",
    "exploreMap": "استكشاف الخريطة",
    "viewMatches": "عرض المطابقات المحتملة",
    "newTicket": "تذكرة جديدة",
    "housingAllocation": "تخصيص السكن الخاص بك",
    "assignedOn": "تم التعيين في",
    "building": "المبنى",
    "roomNumber": "رقم الغرفة",
    "mealPlan": "خطة الوجبات",
    "fullBoard": "إقامة كاملة",
    "breakfastOnly": "فطور فقط",
    "noAllocation": "لم يتم العثور على تخصيص",
    "noAllocationDesc": "تم التحقق من حسابك، ولكن لم يتم تخصيص غرفة لك بعد. يرجى تقديم طلب سكن.",
    "applyForHousing": "التقديم على السكن",
    "docsUnderReview": "المستندات قيد المراجعة",
    "docsUnderReviewDesc": "لقد تلقينا مستندات التحقق الخاصة بك وهي قيد المراجعة حاليًا من قبل فريق الإدارة لدينا. ستتمكن من التقديم على السكن بمجرد التحقق.",
    "accountNotVerified": "الحساب غير موثق",
    "accountNotVerifiedDesc": "يجب عليك التحقق من حسابك بالمستندات الداعمة قبل أن تتمكن من التقديم على السكن أو تلقي تخصيص.",
    "uploadDocs": "رفع مستندات التحقق",
    "cardUnavailable": "البطاقة غير متاحة",
    "cardUnavailableDesc": "يجب أن يتم التحقق منك بالكامل وتخصيص غرفة لك قبل أن تتمكن من إنشاء بطاقة السكن الإلكترونية الخاصة بك.",
    "electronicIdCard": "البطاقة الإلكترونية",
    "electronicIdCardDesc": "استخدم هذه البطاقة لدخول المبنى والوصول إلى المطعم.",
    "generating": "جاري الإنشاء...",
    "downloadPdf": "تحميل PDF",
    "unknown": "غير معروف",
    "na": "غير متوفر",
    "searching": "جاري البحث...",
    "noStudentsFound": "لم يتم العثور على طلاب",
    "studentProfileTitle": "الملف الشخصي للطالب",
    "fullName": "الاسم الكامل",
    "facultyId": "الرقم الجامعي",
    "emailAddress": "البريد الإلكتروني",
    "gender": "الجنس",
    "male": "ذكر",
    "female": "أنثى",
    "homeCity": "مدينة السكن",
    "nationalityId": "الرقم القومي",
    "facultyLabel": "الكلية",
    "housingPreferences": "تفضيلات السكن وزملاء الغرفة",
    "nationalityIdFront": "الرقم القومي (الوجه الأمامي)",
    "nationalityIdBack": "الرقم القومي (الوجه الخلفي)",
    "uploadFrontPhoto": "رفع الوجه الأمامي",
    "uploadBackPhoto": "رفع الوجه الخلفي"
})

ar_profileLog = {
    "filters": "عوامل التصفية",
    "startDate": "تاريخ البدء",
    "endDate": "تاريخ الانتهاء",
    "notAllocatedTitle": "غير مخصص",
    "notAllocatedDesc": "لم يتم تخصيص غرفة لك بعد. سيكون سجل حضورك متاحًا بمجرد انتقالك.",
    "attendedDays": "أيام الحضور",
    "missedDays": "أيام الغياب",
    "overallRate": "المعدل العام",
    "acrossDays": "عبر {days} يوم",
    "distTitle": "توزيع الحضور",
    "noData": "لا تتوفر بيانات",
    "activeTitle": "سجل الطالب نشط",
    "activeDesc1": "يوضح هذا التقرير بالضبط عدد الأيام التي حضرتها أو غبتها من أصل ",
    "activeDesc2": " يوم المحددة في عوامل التصفية. اعرض السجل التفصيلي أدناه للتحليل اليومي.",
    "tableTitle": "سجل الحضور",
    "colDay": "اليوم",
    "colLocation": "الموقع",
    "colTime": "الوقت",
    "colStatus": "الحالة",
    "statusAttended": "حاضر",
    "statusMissed": "غائب",
    "statusPending": "قيد الانتظار",
    "noRecords": "لم يتم العثور على سجلات حضور لهذه الفترة.",
    "colStudentName": "اسم الطالب",
    "colStudentId": "رقم الطالب",
    "colBuilding": "المبنى",
    "colRoom": "الغرفة",
    "adminTableTitle": "السجلات التفصيلية",
    "adminTableHiddenTitle": "تم إخفاء السجلات التفصيلية",
    "adminTableHiddenDesc": "أدخل رقم الطالب أو اسمه في عوامل التصفية أعلاه لعرض السجل التفصيلي اليومي."
}

en_data["profileLog"].update(en_profileLog)
ar_data["profileLog"].update(ar_profileLog)

ar_data["applications"].update({
    "emptyStateDesc": "لم تقم بتقديم أي طلبات سكن بعد. راجع الدليل وقدم طلباً لحجز غرفتك.",
    "applicationNumber": "الطلب #",
    "submitted": "تاريخ التقديم:",
    "preferredDormId": "رقم السكن المفضل:",
    "nextAction": "الإجراء التالي",
    "newApplication": "طلب جديد"
})

en_data["verification"] = {
    "title": "My Verification",
    "noDocument": "No Verification Document Found",
    "uploadFromDashboard": "Please upload your verification document from the home dashboard.",
    "goToDashboard": "Go to Dashboard",
    "currentStatus": "Current Status",
    "uploadedOn": "Uploaded on",
    "appRejected": "Application Rejected",
    "decisionFinal": "This decision is final and your profile cannot be edited.",
    "actionRequired": "Action Required",
    "fieldsToUpdate": "Fields to Update:",
    "updateInstructions": "Please go to your Profile to update these fields, or to the Dashboard if you need to re-upload your document. Once you have made all requested changes, click Resubmit below.",
    "editProfile": "Edit Profile",
    "resubmitApp": "Resubmit Application",
    "underReview": "Under Review",
    "reviewDesc": "Your application is currently being reviewed by our administration team. This usually takes 1-2 business days. We will notify you once a decision has been made.",
    "verifApproved": "Verification Approved",
    "approvedDesc": "Congratulations! Your verification has been approved. You are now eligible to apply for housing.",
    "submittedDoc": "Submitted Document",
    "viewPdf": "View PDF Document"
}

ar_data["verification"] = {
    "title": "التحقق الخاص بي",
    "noDocument": "لم يتم العثور على مستند تحقق",
    "uploadFromDashboard": "يرجى رفع مستند التحقق من الصفحة الرئيسية.",
    "goToDashboard": "الذهاب للرئيسية",
    "currentStatus": "الحالة الحالية",
    "uploadedOn": "تم الرفع في",
    "appRejected": "تم رفض الطلب",
    "decisionFinal": "هذا القرار نهائي ولا يمكن تعديل ملفك الشخصي.",
    "actionRequired": "إجراء مطلوب",
    "fieldsToUpdate": "الحقول المطلوب تحديثها:",
    "updateInstructions": "يرجى التوجه لملفك الشخصي لتحديث هذه الحقول، أو للرئيسية إذا كنت بحاجة لرفع مستندك مجددًا. بمجرد إجراء التعديلات، انقر فوق إعادة الإرسال.",
    "editProfile": "تعديل الملف الشخصي",
    "resubmitApp": "إعادة إرسال الطلب",
    "underReview": "قيد المراجعة",
    "reviewDesc": "تتم مراجعة طلبك حاليًا من قِبل فريق الإدارة. يستغرق هذا عادة من يوم إلى يومي عمل. سنقوم بإبلاغك بمجرد اتخاذ قرار.",
    "verifApproved": "تمت الموافقة على التحقق",
    "approvedDesc": "تهانينا! تمت الموافقة على التحقق الخاص بك. أنت الآن مؤهل للتقدم بطلب للحصول على سكن.",
    "submittedDoc": "المستند المقدم",
    "viewPdf": "عرض ملف PDF"
}

with open(EN_PATH, "w", encoding="utf-8") as f:
    json.dump(en_data, f, indent=2, ensure_ascii=False)

with open(AR_PATH, "w", encoding="utf-8") as f:
    json.dump(ar_data, f, indent=2, ensure_ascii=False)

print("JSON files updated successfully!")
