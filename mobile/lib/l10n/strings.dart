class S {
  S(this.isArabic);
  final bool isArabic;

  // ── General ─────────────────────────────────────────
  String get appName => isArabic ? 'سكنّي' : 'Saknny';
  String get attendance => isArabic ? 'الحضور' : 'Attendance';

  // ── Time window ─────────────────────────────────────
  String get attendanceWindow =>
      isArabic ? 'نافذة الحضور' : 'Attendance Window';
  String get timeRange => isArabic ? '٩:٤٥ م – ١٠:١٥ م' : '9:45 PM – 10:15 PM';

  // ── State: Before window ────────────────────────────
  String get beforeWindowTitle =>
      isArabic ? 'الحضور لم يبدأ بعد' : 'Attendance hasn\'t started yet';
  String get opensAt =>
      isArabic ? 'يفتح الساعة ٩:٤٥ مساءً' : 'Opens at 9:45 PM';
  String get opensIn => isArabic ? 'يفتح خلال' : 'Opens in';
  String countdown(int hours, int minutes) =>
      isArabic ? '$hours س $minutes د' : '${hours}h ${minutes}m';

  // ── State: Window open + nearby ─────────────────────
  String get windowOpenTitle =>
      isArabic ? 'الحضور متاح الآن!' : 'Attendance is OPEN!';
  String windowCloses(int minutes) => isArabic
      ? 'تُغلق النافذة خلال $minutes دقيقة'
      : 'Window closes in $minutes min';
  String get nearbySubtitle =>
      isArabic ? 'أنت بالقرب من سكنك' : 'You\'re near your dorm';
  String get attendButton => isArabic ? 'تسجيل الحضور' : 'ATTEND';

  // ── State: Window open + far away ───────────────────
  String get farAwayTitle =>
      isArabic ? 'أنت بعيد عن سكنك' : 'You\'re far from your dorm';
  String farAwayDistance(int meters) => isArabic
      ? 'أنت بعيد $meters متر عن سكنك'
      : 'You are ${meters}m away from your dorm';
  String get tooFar => isArabic ? 'بعيد جدًا' : 'Too far';

  // ── State: Mock location ────────────────────────────
  String get mockTitle =>
      isArabic ? 'تم اكتشاف موقع وهمي' : 'Mock location detected';
  String get mockSubtitle => isArabic
      ? 'يرجى إيقاف أدوات المطور والموقع الوهمي لاستخدام الحضور'
      : 'Please disable developer tools and mock location to use attendance';

  // ── State: Window closed ────────────────────────────
  String get windowClosedTitle =>
      isArabic ? 'انتهت فترة الحضور' : 'Attendance window closed';
  String get nextWindow =>
      isArabic ? 'الموعد القادم: ٩:٤٥ م غدًا' : 'Next window: 9:45 PM tomorrow';
  String get seeYouTomorrow => isArabic ? 'نراك غدًا!' : 'See you tomorrow!';

  // ── State: Checked in ───────────────────────────────
  String get checkedInTitle =>
      isArabic ? 'تم تسجيل حضورك!' : 'You\'re checked in!';
  String get checkedInToday => isArabic ? 'اليوم' : 'Today';
  String get score => isArabic ? 'النتيجة' : 'Score';
  String get days => isArabic ? 'يوم' : 'days';

  // ── Authenticating ──────────────────────────────────
  String get authenticating => isArabic ? 'جارٍ التحقق...' : 'Verifying...';

  // ── Login ───────────────────────────────────────────
  String get loginTitle => isArabic ? 'تسجيل الدخول' : 'Sign In';
  String get emailLabel => isArabic ? 'البريد الإلكتروني' : 'Email';
  String get passwordLabel => isArabic ? 'كلمة المرور' : 'Password';
  String get loginButton => isArabic ? 'دخول' : 'Sign In';
  String get signingIn => isArabic ? 'جارٍ الدخول...' : 'Signing in...';
  String get biometricPrompt =>
      isArabic ? 'تحقق من هويتك' : 'Verify your identity';
  String get enableBiometric =>
      isArabic ? 'تفعيل الدخول بالبصمة؟' : 'Enable fingerprint login?';
  String get biometricEnrollDesc => isArabic
      ? 'استخدم بصمتك للدخول السريع والتحقق من الحضور'
      : 'Use your fingerprint for quick login and attendance verification';
  String get enable => isArabic ? 'تفعيل' : 'Enable';
  String get skip => isArabic ? 'تخطي' : 'Skip';
  String welcome(String name) => isArabic ? 'مرحباً، $name' : 'Welcome, $name';
  String get logout => isArabic ? 'تسجيل الخروج' : 'Logout';
  String get loginError => isArabic
      ? 'بريد إلكتروني أو كلمة مرور خاطئة'
      : 'Incorrect email or password';
  String get networkError => isArabic
      ? 'خطأ في الشبكة، تحقق من اتصالك'
      : 'Network error, check your connection';
  String get biometricFailed =>
      isArabic ? 'فشل التحقق بالبصمة' : 'Biometric verification failed';
  String get attendBiometric =>
      isArabic ? 'تحقق لتسجيل الحضور' : 'Verify to check in';

  // ── Debug panel ─────────────────────────────────────
  String get debugTitle => isArabic ? 'أدوات الاختبار' : 'Debug Controls';
  String get debugBeforeWindow => isArabic ? 'قبل الوقت' : 'Before window';
  String get debugNearby => isArabic ? 'قريب + متاح' : 'Nearby + Open';
  String get debugFarAway => isArabic ? 'بعيد + متاح' : 'Far away + Open';
  String get debugMock => isArabic ? 'موقع وهمي' : 'Mock location';
  String get debugClosed => isArabic ? 'انتهى الوقت' : 'Window closed';
  String get debugCheckedIn => isArabic ? 'تم الحضور' : 'Checked in';
  String get language => isArabic ? 'العربية' : 'English';
  String get distanceLabel => isArabic ? 'المسافة (م)' : 'Distance (m)';
}
