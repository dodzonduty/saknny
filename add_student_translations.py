import json
import os

EN_PATH = r"d:\saknny\frontend\src\i18n\locales\en.json"
AR_PATH = r"d:\saknny\frontend\src\i18n\locales\ar.json"

with open(EN_PATH, "r", encoding="utf-8") as f:
    en_data = json.load(f)

with open(AR_PATH, "r", encoding="utf-8") as f:
    ar_data = json.load(f)

# LEASES
en_data["leases"]["emptyStateDesc"] = "Once an administrator issues your housing contract, it will appear here for you to review and sign."
en_data["leases"]["leaseAgreement"] = "Lease Agreement #"
en_data["leases"]["issuedOn"] = "Issued on"
en_data["leases"]["termsTitle"] = "Terms and Conditions"
en_data["leases"]["termsIntro"] = "By signing this lease agreement, you (\"The Student\") agree to the following conditions regarding your occupancy at Sakny University Housing:"
en_data["leases"]["term1"] = "The Student shall pay all housing fees and meal plan charges on or before the specified due dates."
en_data["leases"]["term2"] = "The Student agrees to abide by all university housing rules, including noise ordinances and guest policies."
en_data["leases"]["term3"] = "Sakny Housing reserves the right to terminate this lease in the event of disciplinary action or failure to pay dues."
en_data["leases"]["term4"] = "The Student is responsible for maintaining the room in good condition. Damages will be billed to the Student's account."
en_data["leases"]["termsNote"] = "Note: This is a digital representation of the contract. The official document can be downloaded via the icon above."

ar_data["leases"]["emptyStateDesc"] = "بمجرد أن يقوم المسؤول بإصدار عقد السكن الخاص بك، سيظهر هنا لمراجعته وتوقيعه."
ar_data["leases"]["leaseAgreement"] = "عقد إيجار رقم "
ar_data["leases"]["issuedOn"] = "تاريخ الإصدار"
ar_data["leases"]["termsTitle"] = "الشروط والأحكام"
ar_data["leases"]["termsIntro"] = "بتوقيع هذا العقد، توافق أنت (\"الطالب\") على الشروط التالية المتعلقة بإقامتك في سكن جامعة سكني:"
ar_data["leases"]["term1"] = "يلتزم الطالب بدفع جميع رسوم السكن ورسوم خطة الوجبات في أو قبل تواريخ الاستحقاق المحددة."
ar_data["leases"]["term2"] = "يوافق الطالب على الالتزام بجميع قواعد السكن الجامعي، بما في ذلك لوائح الضوضاء وسياسات الضيوف."
ar_data["leases"]["term3"] = "يحتفظ سكن سكني بالحق في إنهاء هذا العقد في حالة اتخاذ إجراء تأديبي أو عدم دفع المستحقات."
ar_data["leases"]["term4"] = "الطالب مسؤول عن الحفاظ على الغرفة في حالة جيدة. سيتم خصم قيمة الأضرار من حساب الطالب."
ar_data["leases"]["termsNote"] = "ملاحظة: هذا تمثيل رقمي للعقد. يمكن تنزيل المستند الرسمي عبر الأيقونة أعلاه."

# ALLOCATIONS
en_data["allocations"]["emptyStateDesc"] = "Once an administrator approves your application and assigns you a bed, your room details will appear here."
en_data["allocations"]["viewApplications"] = "View Applications"
en_data["allocations"]["roomAssignment"] = "Room Assignment #"
en_data["allocations"]["roomId"] = "Room ID"
en_data["allocations"]["allocationConfirmed"] = "Allocation Confirmed"
en_data["allocations"]["allocationConfirmedDesc"] = "Your room has been successfully reserved. Next, you can proceed to view and sign your lease."

ar_data["allocations"]["emptyStateDesc"] = "بمجرد موافقة المسؤول على طلبك وتخصيص سرير لك، ستظهر تفاصيل غرفتك هنا."
ar_data["allocations"]["viewApplications"] = "عرض الطلبات"
ar_data["allocations"]["roomAssignment"] = "تخصيص الغرفة #"
ar_data["allocations"]["roomId"] = "رقم الغرفة"
ar_data["allocations"]["allocationConfirmed"] = "تم تأكيد التخصيص"
ar_data["allocations"]["allocationConfirmedDesc"] = "تم حجز غرفتك بنجاح. بعد ذلك، يمكنك المضي قدمًا لعرض وتوقيع عقد الإيجار الخاص بك."

# BILLING
en_data["billing"]["makePayment"] = "Make a Payment"
en_data["billing"]["newPayment"] = "New Payment"
en_data["billing"]["paymentTypeLabel"] = "Payment Type"
en_data["billing"]["rentPayment"] = "Rent Payment"
en_data["billing"]["housingDeposit"] = "Housing Deposit"
en_data["billing"]["amountUsd"] = "Amount (USD)"
en_data["billing"]["simulatedGatewayDesc"] = "This is a simulated payment gateway. Clicking \"Pay Now\" will mock a successful transaction."
en_data["billing"]["processing"] = "Processing..."
en_data["billing"]["emptyStateDesc"] = "You have not made any payments yet. When you pay a deposit or rent, the receipt will appear here."
en_data["billing"]["paymentLabel"] = "Payment"
en_data["billing"]["transactionHash"] = "Transaction #"

ar_data["billing"]["makePayment"] = "إجراء دفع"
ar_data["billing"]["newPayment"] = "عملية دفع جديدة"
ar_data["billing"]["paymentTypeLabel"] = "نوع الدفع"
ar_data["billing"]["rentPayment"] = "دفع الإيجار"
ar_data["billing"]["housingDeposit"] = "تأمين السكن"
ar_data["billing"]["amountUsd"] = "المبلغ (دولار)"
ar_data["billing"]["simulatedGatewayDesc"] = "هذه بوابة دفع تجريبية. النقر على \"ادفع الآن\" سيحاكي معاملة ناجحة."
ar_data["billing"]["processing"] = "جاري المعالجة..."
ar_data["billing"]["emptyStateDesc"] = "لم تقم بأي عمليات دفع بعد. عند دفع تأمين أو إيجار، سيظهر الإيصال هنا."
ar_data["billing"]["paymentLabel"] = "دفع"
ar_data["billing"]["transactionHash"] = "عملية رقم "

with open(EN_PATH, "w", encoding="utf-8") as f:
    json.dump(en_data, f, indent=2, ensure_ascii=False)

with open(AR_PATH, "w", encoding="utf-8") as f:
    json.dump(ar_data, f, indent=2, ensure_ascii=False)

print("Added lease, allocation, billing translations!")
