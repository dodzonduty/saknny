import 'dart:math';

import 'package:flutter/material.dart';

import '../l10n/strings.dart';
import '../theme/app_colors.dart';

// ──────────────────────────────────────────────────────
//  Attendance states the screen can be in
// ──────────────────────────────────────────────────────

enum AttendanceState {
  beforeWindow,
  windowOpenNearby,
  windowOpenFarAway,
  mockLocationDetected,
  windowClosed,
  checkedIn,
  authenticating,
}

// ──────────────────────────────────────────────────────
//  Main screen
// ──────────────────────────────────────────────────────

class AttendanceDemoScreen extends StatefulWidget {
  const AttendanceDemoScreen({super.key});

  @override
  State<AttendanceDemoScreen> createState() => _AttendanceDemoScreenState();
}

class _AttendanceDemoScreenState extends State<AttendanceDemoScreen>
    with TickerProviderStateMixin {
  AttendanceState _state = AttendanceState.beforeWindow;
  bool _isArabic = false;
  double _mockDistance = 347;

  late final AnimationController _pulseCtrl;
  late final AnimationController _scanCtrl;
  late final Animation<double> _pulseAnim;

  S get s => S(_isArabic);

  // ── Lifecycle ────────────────────────────────────────

  @override
  void initState() {
    super.initState();
    final langCode =
        WidgetsBinding.instance.platformDispatcher.locale.languageCode;
    _isArabic = langCode == 'ar';

    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 1.0, end: 1.12).animate(
      CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut),
    );

    _scanCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    _scanCtrl.dispose();
    super.dispose();
  }

  // ── Actions ──────────────────────────────────────────

  void _onAttendPressed() async {
    if (_state != AttendanceState.windowOpenNearby) return;
    setState(() => _state = AttendanceState.authenticating);
    await Future.delayed(const Duration(milliseconds: 1600));
    if (mounted) setState(() => _state = AttendanceState.checkedIn);
  }

  // ── Build ────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: _isArabic ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: Column(
          children: [
            _Header(s: s),
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 100),
                child: Column(
                  children: [
                    // Status card with animated crossfade
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 500),
                      switchInCurve: Curves.easeOutCubic,
                      switchOutCurve: Curves.easeInCubic,
                      transitionBuilder: (child, anim) {
                        return FadeTransition(
                          opacity: anim,
                          child: SlideTransition(
                            position: Tween<Offset>(
                              begin: const Offset(0, 0.08),
                              end: Offset.zero,
                            ).animate(anim),
                            child: child,
                          ),
                        );
                      },
                      child: _buildStatusCard(),
                    ),
                    const SizedBox(height: 32),
                    // Attend button
                    _buildAttendButton(),
                    const SizedBox(height: 28),
                    // Score card (visible in most states)
                    _buildScoreCard(),
                  ],
                ),
              ),
            ),
          ],
        ),
        floatingActionButton: _buildDebugFab(),
      ),
    );
  }

  // ══════════════════════════════════════════════════════
  //  STATUS CARD (changes per state)
  // ══════════════════════════════════════════════════════

  Widget _buildStatusCard() {
    return switch (_state) {
      AttendanceState.beforeWindow => _StatusCard(
          key: const ValueKey('before'),
          icon: Icons.schedule_rounded,
          iconColor: AppColors.accentYellow,
          iconBg: AppColors.accentYellow.withValues(alpha: 0.15),
          title: s.beforeWindowTitle,
          subtitle: s.opensAt,
          detail: _CountdownChip(label: s.countdown(1, 23), s: s),
        ),
      AttendanceState.windowOpenNearby => _StatusCard(
          key: const ValueKey('nearby'),
          icon: Icons.location_on_rounded,
          iconColor: AppColors.successLight,
          iconBg: AppColors.successContainer,
          title: s.windowOpenTitle,
          subtitle: s.nearbySubtitle,
          detail: _TimeRemainingChip(label: s.windowCloses(12)),
          titleColor: AppColors.success,
        ),
      AttendanceState.windowOpenFarAway => _StatusCard(
          key: const ValueKey('far'),
          icon: Icons.location_off_rounded,
          iconColor: AppColors.warning,
          iconBg: AppColors.warningContainer,
          title: s.farAwayTitle,
          subtitle: s.farAwayDistance(_mockDistance.round()),
          detail: _TimeRemainingChip(label: s.windowCloses(12)),
          titleColor: AppColors.warning,
        ),
      AttendanceState.mockLocationDetected => _StatusCard(
          key: const ValueKey('mock'),
          icon: Icons.gpp_bad_rounded,
          iconColor: AppColors.error,
          iconBg: AppColors.errorContainer,
          title: s.mockTitle,
          subtitle: s.mockSubtitle,
          titleColor: AppColors.error,
        ),
      AttendanceState.windowClosed => _StatusCard(
          key: const ValueKey('closed'),
          icon: Icons.nightlight_round,
          iconColor: AppColors.disabled,
          iconBg: AppColors.disabledContainer,
          title: s.windowClosedTitle,
          subtitle: s.nextWindow,
        ),
      AttendanceState.checkedIn || AttendanceState.authenticating =>
        _buildCheckedInCard(),
    };
  }

  Widget _buildCheckedInCard() {
    if (_state == AttendanceState.authenticating) {
      return _StatusCard(
        key: const ValueKey('auth'),
        icon: Icons.fingerprint_rounded,
        iconColor: AppColors.accentYellow,
        iconBg: AppColors.accentYellow.withValues(alpha: 0.15),
        title: s.authenticating,
        subtitle: '',
        customIcon: _ScanningFingerprint(controller: _scanCtrl),
      );
    }
    return _CheckedInCard(key: const ValueKey('done'), s: s);
  }

  // ══════════════════════════════════════════════════════
  //  ATTEND BUTTON
  // ══════════════════════════════════════════════════════

  Widget _buildAttendButton() {
    final isActive = _state == AttendanceState.windowOpenNearby;
    final isAuthenticating = _state == AttendanceState.authenticating;
    final isCheckedIn = _state == AttendanceState.checkedIn;

    if (isCheckedIn) return const SizedBox.shrink();

    return Column(
      children: [
        GestureDetector(
          onTap: isActive ? _onAttendPressed : null,
          child: AnimatedBuilder(
            animation: _pulseAnim,
            builder: (context, child) {
              final scale = isActive ? _pulseAnim.value : 1.0;
              return Transform.scale(
                scale: scale,
                child: child,
              );
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 400),
              curve: Curves.easeOutCubic,
              width: 140,
              height: 140,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isActive
                    ? AppColors.accentYellow
                    : isAuthenticating
                        ? AppColors.accentYellow.withValues(alpha: 0.7)
                        : AppColors.disabledContainer,
                boxShadow: isActive
                    ? [
                        BoxShadow(
                          color: AppColors.accentYellow.withValues(alpha: 0.4),
                          blurRadius: 30,
                          spreadRadius: 4,
                        ),
                      ]
                    : [],
              ),
              child: Center(
                child: isAuthenticating
                    ? _ScanningFingerprint(
                        controller: _scanCtrl,
                        size: 56,
                        color: AppColors.primary,
                      )
                    : Icon(
                        Icons.fingerprint_rounded,
                        size: 56,
                        color: isActive
                            ? AppColors.primary
                            : AppColors.disabled,
                      ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        AnimatedDefaultTextStyle(
          duration: const Duration(milliseconds: 300),
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: isActive ? AppColors.primary : AppColors.disabled,
            letterSpacing: isActive ? 1.5 : 0.5,
          ),
          child: Text(
            isAuthenticating ? s.authenticating : s.attendButton,
          ),
        ),
      ],
    );
  }

  // ══════════════════════════════════════════════════════
  //  SCORE CARD
  // ══════════════════════════════════════════════════════

  Widget _buildScoreCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          // Circular progress
          SizedBox(
            width: 64,
            height: 64,
            child: Stack(
              fit: StackFit.expand,
              children: [
                CircularProgressIndicator(
                  value: 0.87,
                  strokeWidth: 6,
                  strokeCap: StrokeCap.round,
                  backgroundColor: AppColors.surfaceVariant,
                  valueColor: const AlwaysStoppedAnimation(AppColors.accentYellow),
                ),
                Center(
                  child: Text(
                    '87%',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  s.score,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '13 / 15 ${s.days}',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.successContainer,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              _state == AttendanceState.checkedIn ? '✓' : '—',
              style: TextStyle(
                color: AppColors.success,
                fontWeight: FontWeight.w800,
                fontSize: 16,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════
  //  DEBUG FAB & PANEL
  // ══════════════════════════════════════════════════════

  Widget _buildDebugFab() {
    return FloatingActionButton.small(
      onPressed: _showDebugSheet,
      backgroundColor: AppColors.primary,
      child: const Icon(Icons.build_rounded, size: 20, color: AppColors.accentYellow),
    );
  }

  void _showDebugSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _DebugSheet(
        currentState: _state,
        isArabic: _isArabic,
        distance: _mockDistance,
        onStateChanged: (st) {
          setState(() => _state = st);
          Navigator.pop(context);
        },
        onLanguageChanged: (val) {
          setState(() => _isArabic = val);
          Navigator.pop(context);
        },
        onDistanceChanged: (val) {
          setState(() => _mockDistance = val);
        },
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
//  PRIVATE WIDGETS
// ══════════════════════════════════════════════════════════

// ── Header ─────────────────────────────────────────────

class _Header extends StatelessWidget {
  const _Header({required this.s});
  final S s;

  @override
  Widget build(BuildContext context) {
    final topPad = MediaQuery.of(context).padding.top;
    return Container(
      padding: EdgeInsets.fromLTRB(24, topPad + 20, 24, 28),
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
          // App name
          Text(
            s.appName,
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w900,
              color: AppColors.onPrimary,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            s.attendanceWindow,
            style: TextStyle(
              fontSize: 14,
              color: AppColors.onPrimary.withValues(alpha: 0.7),
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 14),
          // Time window pill
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(30),
              border: Border.all(
                color: AppColors.accentYellow.withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.access_time_filled_rounded,
                  color: AppColors.accentYellow,
                  size: 20,
                ),
                const SizedBox(width: 10),
                Text(
                  s.timeRange,
                  style: const TextStyle(
                    color: AppColors.onPrimary,
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 4),
          // Decorative element
          Align(
            alignment: Alignment.centerRight,
            child: Transform.rotate(
              angle: -0.15,
              child: Icon(
                Icons.apartment_rounded,
                size: 40,
                color: Colors.white.withValues(alpha: 0.08),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Status card ────────────────────────────────────────

class _StatusCard extends StatelessWidget {
  const _StatusCard({
    super.key,
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.title,
    required this.subtitle,
    this.detail,
    this.titleColor,
    this.customIcon,
  });

  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String title;
  final String subtitle;
  final Widget? detail;
  final Color? titleColor;
  final Widget? customIcon;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24),
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
          // Icon circle
          customIcon ??
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: iconBg,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: iconColor, size: 36),
              ),
          const SizedBox(height: 20),
          // Title
          Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: titleColor ?? AppColors.onSurface,
              height: 1.3,
            ),
          ),
          if (subtitle.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 15,
                color: AppColors.onSurfaceVariant,
                height: 1.4,
              ),
            ),
          ],
          if (detail != null) ...[
            const SizedBox(height: 16),
            detail!,
          ],
        ],
      ),
    );
  }
}

// ── Checked-in card (special design) ──────────────────

class _CheckedInCard extends StatefulWidget {
  const _CheckedInCard({super.key, required this.s});
  final S s;

  @override
  State<_CheckedInCard> createState() => _CheckedInCardState();
}

class _CheckedInCardState extends State<_CheckedInCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scaleAnim;
  late final Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _scaleAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.elasticOut),
    );
    _fadeAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _ctrl,
        curve: const Interval(0.0, 0.5, curve: Curves.easeOut),
      ),
    );
    _ctrl.forward();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (context, child) {
        return Opacity(
          opacity: _fadeAnim.value,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  AppColors.successContainer,
                  AppColors.successContainer.withValues(alpha: 0.5),
                ],
              ),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: AppColors.success.withValues(alpha: 0.2),
              ),
            ),
            child: Column(
              children: [
                Transform.scale(
                  scale: _scaleAnim.value,
                  child: Container(
                    width: 88,
                    height: 88,
                    decoration: BoxDecoration(
                      color: AppColors.success,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.success.withValues(alpha: 0.3),
                          blurRadius: 24,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.check_rounded,
                      size: 48,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  widget.s.checkedInTitle,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: AppColors.success,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '${widget.s.checkedInToday}, ${_todayFormatted()}',
                  style: const TextStyle(
                    fontSize: 15,
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  String _todayFormatted() {
    final now = DateTime.now();
    final months = widget.s.isArabic
        ? [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
          ]
        : [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December',
          ];
    return '${now.day} ${months[now.month - 1]} ${now.year}';
  }
}

// ── Countdown chip ────────────────────────────────────

class _CountdownChip extends StatelessWidget {
  const _CountdownChip({required this.label, required this.s});
  final String label;
  final S s;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.hourglass_bottom_rounded,
              size: 18, color: AppColors.primary),
          const SizedBox(width: 8),
          Text(
            '${s.opensIn}  ',
            style: const TextStyle(
              fontSize: 14,
              color: AppColors.onSurfaceVariant,
              fontWeight: FontWeight.w500,
            ),
          ),
          Text(
            label,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Time remaining chip ───────────────────────────────

class _TimeRemainingChip extends StatelessWidget {
  const _TimeRemainingChip({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.accentYellow.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.timer_outlined,
              size: 16, color: AppColors.accentYellowHover),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.accentYellowHover,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Scanning fingerprint animation ────────────────────

class _ScanningFingerprint extends StatelessWidget {
  const _ScanningFingerprint({
    required this.controller,
    this.size = 36,
    this.color,
  });
  final AnimationController controller;
  final double size;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size + 36,
      height: size + 36,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Icon(
            Icons.fingerprint_rounded,
            size: size,
            color: color ?? AppColors.accentYellow,
          ),
          // Scanning line
          AnimatedBuilder(
            animation: controller,
            builder: (context, _) {
              return Positioned(
                top: (size + 36) * controller.value,
                left: 8,
                right: 8,
                child: Container(
                  height: 2,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        (color ?? AppColors.accentYellow).withValues(alpha: 0.0),
                        (color ?? AppColors.accentYellow),
                        (color ?? AppColors.accentYellow).withValues(alpha: 0.0),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
//  DEBUG BOTTOM SHEET
// ══════════════════════════════════════════════════════════

class _DebugSheet extends StatefulWidget {
  const _DebugSheet({
    required this.currentState,
    required this.isArabic,
    required this.distance,
    required this.onStateChanged,
    required this.onLanguageChanged,
    required this.onDistanceChanged,
  });

  final AttendanceState currentState;
  final bool isArabic;
  final double distance;
  final ValueChanged<AttendanceState> onStateChanged;
  final ValueChanged<bool> onLanguageChanged;
  final ValueChanged<double> onDistanceChanged;

  @override
  State<_DebugSheet> createState() => _DebugSheetState();
}

class _DebugSheetState extends State<_DebugSheet> {
  late double _dist;

  @override
  void initState() {
    super.initState();
    _dist = widget.distance;
  }

  S get s => S(widget.isArabic);

  @override
  Widget build(BuildContext context) {
    final states = [
      (AttendanceState.beforeWindow, s.debugBeforeWindow, Icons.schedule_rounded, AppColors.accentYellow),
      (AttendanceState.windowOpenNearby, s.debugNearby, Icons.location_on_rounded, AppColors.successLight),
      (AttendanceState.windowOpenFarAway, s.debugFarAway, Icons.location_off_rounded, AppColors.warning),
      (AttendanceState.mockLocationDetected, s.debugMock, Icons.gpp_bad_rounded, AppColors.error),
      (AttendanceState.windowClosed, s.debugClosed, Icons.nightlight_round, AppColors.disabled),
      (AttendanceState.checkedIn, s.debugCheckedIn, Icons.check_circle_rounded, AppColors.success),
    ];

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.outlineVariant,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),
          // Title
          Row(
            children: [
              const Icon(Icons.build_rounded, size: 20, color: AppColors.accentYellow),
              const SizedBox(width: 8),
              Text(
                s.debugTitle,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // State grid
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: states.map((entry) {
              final (state, label, icon, color) = entry;
              final isSelected = widget.currentState == state;
              return GestureDetector(
                onTap: () => widget.onStateChanged(state),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? color.withValues(alpha: 0.15)
                        : AppColors.surfaceVariant,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isSelected ? color : Colors.transparent,
                      width: 2,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(icon, size: 18, color: color),
                      const SizedBox(width: 6),
                      Text(
                        label,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight:
                              isSelected ? FontWeight.w700 : FontWeight.w500,
                          color: isSelected ? color : AppColors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),
          // Distance slider (for far away state)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      s.distanceLabel,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.onSurfaceVariant,
                      ),
                    ),
                    Text(
                      '${_dist.round()}m',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
                Slider(
                  value: _dist,
                  min: 50,
                  max: 2000,
                  activeColor: AppColors.accentYellow,
                  inactiveColor: AppColors.outlineVariant,
                  onChanged: (val) {
                    setState(() => _dist = val);
                    widget.onDistanceChanged(val);
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Language toggle
          GestureDetector(
            onTap: () => widget.onLanguageChanged(!widget.isArabic),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.language_rounded,
                          size: 20, color: AppColors.primary),
                      const SizedBox(width: 10),
                      Text(
                        s.language,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.onSurface,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      widget.isArabic ? 'عربي' : 'EN',
                      style: const TextStyle(
                        color: AppColors.onPrimary,
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
