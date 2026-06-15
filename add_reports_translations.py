import json

EN_PATH = r"d:\saknny\frontend\src\i18n\locales\en.json"
AR_PATH = r"d:\saknny\frontend\src\i18n\locales\ar.json"

def update_locale(path, section_name, updates):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    data[section_name] = updates

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

en_updates = {
    "dailyTitle": "Daily Report",
    "displayingFor": "Displaying attendance for:",
    "totalStudents": "Total Students",
    "attended": "Attended",
    "missed": "Missed",
    "buildingRates": "Building Attendance Rates (%)",
    "noBuildingData": "No building data",
    "attendanceRate": "Attendance Rate %",
    "roomRates": "Room Attendance Rates (%)",
    "noRoomData": "No room data",
    "tableTitle": "Student Attendance Report",
    "excel": "Excel",
    "pdf": "PDF",
    "colStudent": "Student",
    "colId": "ID",
    "colBuilding": "Building",
    "colRoom": "Room",
    "colTime": "Time",
    "colStatus": "Status",
    "noStudents": "No students found."
}

ar_updates = {
    "dailyTitle": "التقرير اليومي",
    "displayingFor": "عرض الحضور ليوم:",
    "totalStudents": "إجمالي الطلاب",
    "attended": "حضر",
    "missed": "غاب",
    "buildingRates": "نسب حضور المباني (%)",
    "noBuildingData": "لا توجد بيانات للمباني",
    "attendanceRate": "نسبة الحضور %",
    "roomRates": "نسب حضور الغرف (%)",
    "noRoomData": "لا توجد بيانات للغرف",
    "tableTitle": "تقرير حضور الطلاب",
    "excel": "إكسل",
    "pdf": "بي دي إف",
    "colStudent": "الطالب",
    "colId": "الرقم الجامعي",
    "colBuilding": "المبنى",
    "colRoom": "الغرفة",
    "colTime": "الوقت",
    "colStatus": "الحالة",
    "noStudents": "لم يتم العثور على طلاب."
}

en_custom_updates = {
    "filtersTitle": "Custom Filters",
    "startDate": "Start Date",
    "endDate": "End Date",
    "studentSearch": "Student Search",
    "studentSearchPlaceholder": "Type to search by name or ID...",
    "buildings": "Buildings",
    "buildingsPlaceholder": "Select buildings...",
    "rooms": "Room Numbers",
    "roomsPlaceholderEmpty": "Select a building first",
    "roomsPlaceholder": "Select rooms...",
    "trendTitle": "Daily Attendance Trend",
    "trendDesc": "Overall attendance across all filtered students day-by-day.",
    "topMissedTitle": "Top Students by Missed Days",
    "topMissedDesc": "Highlights the students with the most absences in the selected period.",
    "noData": "No data to display",
    "summariesTitle": "Student Summaries",
    "overallRate": "Overall Rate:",
    "colStudentName": "Student Name",
    "colAttendedDays": "Attended Days",
    "colMissedDays": "Missed Days",
    "noMatch": "No students match the selected filters."
}

ar_custom_updates = {
    "filtersTitle": "فلاتر مخصصة",
    "startDate": "تاريخ البدء",
    "endDate": "تاريخ الانتهاء",
    "studentSearch": "البحث عن طالب",
    "studentSearchPlaceholder": "اكتب للبحث بالاسم أو الرقم...",
    "buildings": "المباني",
    "buildingsPlaceholder": "حدد المباني...",
    "rooms": "أرقام الغرف",
    "roomsPlaceholderEmpty": "حدد المبنى أولاً",
    "roomsPlaceholder": "حدد الغرف...",
    "trendTitle": "اتجاه الحضور اليومي",
    "trendDesc": "الحضور الإجمالي لجميع الطلاب المحددين يوماً بيوم.",
    "topMissedTitle": "أكثر الطلاب غياباً",
    "topMissedDesc": "يسلط الضوء على الطلاب الذين لديهم أكبر عدد من الغيابات في الفترة المحددة.",
    "noData": "لا توجد بيانات لعرضها",
    "summariesTitle": "ملخصات الطلاب",
    "overallRate": "المعدل العام:",
    "colStudentName": "اسم الطالب",
    "colAttendedDays": "أيام الحضور",
    "colMissedDays": "أيام الغياب",
    "noMatch": "لا يوجد طلاب يطابقون الفلاتر المحددة."
}

update_locale(EN_PATH, "dailyReport", en_updates)
update_locale(AR_PATH, "dailyReport", ar_updates)

update_locale(EN_PATH, "customReport", en_custom_updates)
update_locale(AR_PATH, "customReport", ar_custom_updates)

print("Report translations added!")
