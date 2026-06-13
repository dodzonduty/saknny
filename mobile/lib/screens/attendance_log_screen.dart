import 'package:flutter/material.dart';

import '../l10n/strings.dart';
import '../saknny_mobile_app.dart';
import '../theme/app_colors.dart';

class AttendanceLogScreen extends StatefulWidget {
  const AttendanceLogScreen({super.key, required this.services});

  final SaknnyMobileServices services;

  @override
  State<AttendanceLogScreen> createState() => _AttendanceLogScreenState();
}

class _AttendanceLogScreenState extends State<AttendanceLogScreen>
    with SingleTickerProviderStateMixin {
  late DateTime _displayedMonth;
  bool _isArabic = false;

  // ── Mock data: days the student attended (green) and missed (red) ──
  // These are day-of-month numbers for June 2026 as an example.
  static const _mockAttendedDays = {1, 2, 3, 5, 7, 8, 9, 10, 11, 12};
  static const _mockMissedDays = {4, 6};

  late final AnimationController _animCtrl;

  S get s => S(_isArabic);

  @override
  void initState() {
    super.initState();
    _displayedMonth = DateTime(DateTime.now().year, DateTime.now().month);
    _animCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..forward();
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  void _goToPreviousMonth() {
    setState(() {
      _displayedMonth = DateTime(_displayedMonth.year, _displayedMonth.month - 1);
      _animCtrl.forward(from: 0);
    });
  }

  void _goToNextMonth() {
    final now = DateTime.now();
    final nextMonth = DateTime(_displayedMonth.year, _displayedMonth.month + 1);
    if (nextMonth.isAfter(DateTime(now.year, now.month + 1))) return;
    setState(() {
      _displayedMonth = nextMonth;
      _animCtrl.forward(from: 0);
    });
  }

  bool _isCurrentMonth() {
    final now = DateTime.now();
    return _displayedMonth.year == now.year && _displayedMonth.month == now.month;
  }

  @override
  Widget build(BuildContext context) {
    final langCode = View.of(context).platformDispatcher.locale.languageCode;
    _isArabic = langCode == 'ar';

    return Directionality(
      textDirection: _isArabic ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
                child: Column(
                  children: [
                    _buildMonthNavigator(),
                    const SizedBox(height: 20),
                    _buildCalendarGrid(),
                    const SizedBox(height: 24),
                    _buildLegend(),
                    const SizedBox(height: 24),
                    _buildSummaryCards(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    final topPad = MediaQuery.of(context).padding.top;
    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(24, topPad + 16, 24, 24),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.primary, AppColors.primaryContainer],
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(32),
          bottomRight: Radius.circular(32),
        ),
      ),
      child: Column(
        children: [
          Icon(
            Icons.calendar_month_rounded,
            size: 40,
            color: AppColors.accentYellow.withValues(alpha: 0.9),
          ),
          const SizedBox(height: 10),
          Text(
            s.myRecord,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: AppColors.onPrimary,
              letterSpacing: -0.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMonthNavigator() {
    final monthName = s.monthNames[_displayedMonth.month - 1];
    final year = _displayedMonth.year;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            onPressed: _goToPreviousMonth,
            icon: const Icon(Icons.chevron_left_rounded, color: AppColors.primary),
          ),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            transitionBuilder: (child, anim) => FadeTransition(
              opacity: anim,
              child: SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(0, 0.3),
                  end: Offset.zero,
                ).animate(anim),
                child: child,
              ),
            ),
            child: Text(
              '$monthName $year',
              key: ValueKey('$monthName$year'),
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
            ),
          ),
          IconButton(
            onPressed: _isCurrentMonth() ? null : _goToNextMonth,
            icon: Icon(
              Icons.chevron_right_rounded,
              color: _isCurrentMonth()
                  ? AppColors.disabled
                  : AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCalendarGrid() {
    final dayHeaders = [s.sun, s.mon, s.tue, s.wed, s.thu, s.fri, s.sat];
    final firstDayOfMonth = DateTime(_displayedMonth.year, _displayedMonth.month, 1);
    final daysInMonth = DateTime(_displayedMonth.year, _displayedMonth.month + 1, 0).day;
    final startWeekday = firstDayOfMonth.weekday % 7; // Sunday = 0
    final today = DateTime.now();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Day headers
          Row(
            children: dayHeaders
                .map(
                  (d) => Expanded(
                    child: Center(
                      child: Text(
                        d,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppColors.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 12),
          // Calendar grid
          ...List.generate(6, (weekIndex) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: List.generate(7, (dayOfWeek) {
                  final dayNumber = weekIndex * 7 + dayOfWeek - startWeekday + 1;
                  if (dayNumber < 1 || dayNumber > daysInMonth) {
                    return const Expanded(child: SizedBox(height: 44));
                  }

                  final isToday = _isCurrentMonth() &&
                      dayNumber == today.day;
                  final isAttended = _isCurrentMonth() &&
                      _mockAttendedDays.contains(dayNumber);
                  final isMissed = _isCurrentMonth() &&
                      _mockMissedDays.contains(dayNumber);

                  return Expanded(
                    child: _CalendarCell(
                      day: dayNumber,
                      isToday: isToday,
                      isAttended: isAttended,
                      isMissed: isMissed,
                    ),
                  );
                }),
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildLegend() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _LegendDot(color: AppColors.success, label: s.daysAttended),
        const SizedBox(width: 24),
        _LegendDot(color: AppColors.error, label: s.daysMissed),
        const SizedBox(width: 24),
        _LegendDot(color: AppColors.accentYellow, label: _isArabic ? 'اليوم' : 'Today'),
      ],
    );
  }

  Widget _buildSummaryCards() {
    final attended = _isCurrentMonth() ? _mockAttendedDays.length : 0;
    final missed = _isCurrentMonth() ? _mockMissedDays.length : 0;
    final total = attended + missed;
    final rate = total > 0 ? (attended / total * 100).round() : 0;

    return Column(
      children: [
        // Attended / Missed row
        Row(
          children: [
            Expanded(
              child: _SummaryCard(
                icon: Icons.check_circle_rounded,
                iconColor: AppColors.success,
                iconBg: AppColors.successContainer,
                label: s.daysAttended,
                value: attended,
                animController: _animCtrl,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _SummaryCard(
                icon: Icons.cancel_rounded,
                iconColor: AppColors.error,
                iconBg: AppColors.errorContainer,
                label: s.daysMissed,
                value: missed,
                animController: _animCtrl,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        // Attendance rate
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 20,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.trending_up_rounded,
                      color: AppColors.primary,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          s.attendanceRate,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(height: 2),
                        TweenAnimationBuilder<double>(
                          tween: Tween(begin: 0, end: rate.toDouble()),
                          duration: const Duration(milliseconds: 1200),
                          curve: Curves.easeOutCubic,
                          builder: (context, value, _) => Text(
                            '${value.round()}%',
                            style: const TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.w900,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: total > 0 ? attended / total : 0),
                duration: const Duration(milliseconds: 1200),
                curve: Curves.easeOutCubic,
                builder: (context, value, _) => ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: LinearProgressIndicator(
                    value: value,
                    minHeight: 10,
                    backgroundColor: AppColors.disabledContainer,
                    valueColor: const AlwaysStoppedAnimation(AppColors.success),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '$attended / $total',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ═══════════════════════════════════════════════════════════
//  PRIVATE WIDGETS
// ═══════════════════════════════════════════════════════════

class _CalendarCell extends StatelessWidget {
  const _CalendarCell({
    required this.day,
    required this.isToday,
    required this.isAttended,
    required this.isMissed,
  });

  final int day;
  final bool isToday;
  final bool isAttended;
  final bool isMissed;

  @override
  Widget build(BuildContext context) {
    Color bgColor = Colors.transparent;
    Color textColor = AppColors.onSurface;
    Widget? badge;

    if (isAttended) {
      bgColor = AppColors.success;
      textColor = Colors.white;
      badge = const Icon(Icons.check_rounded, size: 10, color: Colors.white);
    } else if (isMissed) {
      bgColor = AppColors.error;
      textColor = Colors.white;
      badge = const Icon(Icons.close_rounded, size: 10, color: Colors.white);
    } else if (isToday) {
      bgColor = AppColors.accentYellow;
      textColor = AppColors.primary;
    }

    return Center(
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: bgColor,
          shape: BoxShape.circle,
          border: isToday && !isAttended && !isMissed
              ? Border.all(color: AppColors.accentYellow, width: 2.5)
              : null,
          boxShadow: (isAttended || isMissed)
              ? [
                  BoxShadow(
                    color: bgColor.withValues(alpha: 0.3),
                    blurRadius: 8,
                    spreadRadius: 1,
                  ),
                ]
              : null,
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Text(
              '$day',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: textColor,
              ),
            ),
            if (badge != null)
              Positioned(
                right: 2,
                top: 2,
                child: badge,
              ),
          ],
        ),
      ),
    );
  }
}

class _LegendDot extends StatelessWidget {
  const _LegendDot({required this.color, required this.label});
  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppColors.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.label,
    required this.value,
    required this.animController,
  });

  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String label;
  final int value;
  final AnimationController animController;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: iconBg,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: iconColor, size: 28),
          ),
          const SizedBox(height: 12),
          TweenAnimationBuilder<int>(
            tween: IntTween(begin: 0, end: value),
            duration: const Duration(milliseconds: 1000),
            curve: Curves.easeOutCubic,
            builder: (context, val, _) => Text(
              '$val',
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.w900,
                color: iconColor,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
