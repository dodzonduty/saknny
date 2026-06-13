import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

import '../l10n/strings.dart';
import '../saknny_mobile_app.dart';
import '../theme/app_colors.dart';

enum AttendanceState {
  beforeWindow,
  windowOpenNearby,
  windowOpenFarAway,
  mockLocationDetected,
  windowClosed,
  checkedIn,
  authenticating,
}

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key, required this.services});

  final SaknnyMobileServices services;

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen>
    with TickerProviderStateMixin {
  AttendanceState _state = AttendanceState.beforeWindow;
  bool _isArabic = false;
  String _userName = '';

  // Real data
  int _scoreDays = 0;
  bool _checkedInToday = false;
  String? _errorMessage;

  late final AnimationController _pulseCtrl;
  late final AnimationController _scanCtrl;
  late final Animation<double> _pulseAnim;

  S get s => S(_isArabic);

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
    _pulseAnim = Tween<double>(
      begin: 1.0,
      end: 1.12,
    ).animate(CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut));

    _scanCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();

    _loadData();
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    _scanCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final name = await widget.services.sessionStore.getUserName();
    if (mounted) {
      setState(() {
        _userName = name ?? '';
      });
    }

    try {
      final scoreData = await widget.services.attendanceService.fetchScore();
      final stats = scoreData['stats'] as Map<String, dynamic>?;
      if (mounted) {
        setState(() {
          _scoreDays = stats?['successful_checkins'] as int? ?? 0;
          // check if today is in history or if already checked in
          // the easiest way is if check_in today is true
          _checkedInToday = scoreData['checked_in_today'] == true;
        });
      }
    } catch (_) {
      // Ignore score fetch error
    }

    _determineState();
  }

  void _determineState() {
    if (_checkedInToday) {
      setState(() => _state = AttendanceState.checkedIn);
      return;
    }

    final now = DateTime.now();
    // 21:45 to 22:15
    final start = DateTime(now.year, now.month, now.day, 21, 45);
    final end = DateTime(now.year, now.month, now.day, 22, 15);

    if (now.isBefore(start)) {
      setState(() => _state = AttendanceState.beforeWindow);
    } else if (now.isAfter(end)) {
      setState(() => _state = AttendanceState.windowClosed);
    } else {
      // It's open. Let's assume nearby until they click, backend handles the rest.
      setState(() => _state = AttendanceState.windowOpenNearby);
    }
  }

  Future<void> _onAttendPressed() async {
    if (_state != AttendanceState.windowOpenNearby) return;

    // 1. Biometric Gate
    final bioSuccess = await widget.services.biometricService.authenticate(
      s.attendBiometric,
    );
    if (!bioSuccess) {
      _showError(s.biometricFailed);
      return;
    }

    setState(() {
      _state = AttendanceState.authenticating;
      _errorMessage = null;
    });

    try {
      // 2. Check mock location
      final position = await Geolocator.getCurrentPosition();
      if (position.isMocked) {
        setState(() => _state = AttendanceState.mockLocationDetected);
        return;
      }

      // 3. API Call
      await widget.services.attendanceService.checkInWithCurrentLocation();

      // Success
      setState(() {
        _state = AttendanceState.checkedIn;
        _checkedInToday = true;
        _scoreDays++;
      });
    } on FirebaseException catch (e) {
      setState(() => _state = AttendanceState.windowOpenNearby);
      if (e.code == 'permission-denied') {
        _showError(
          s.loginError,
        ); // Generic error or custom "Outside time window"
      } else {
        _showError(e.message ?? 'Error connecting to database');
      }
    } catch (e) {
      setState(() => _state = AttendanceState.windowOpenNearby);
      _showError(e.toString());
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: _isArabic ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: Column(
          children: [
            _Header(s: s, userName: _userName),
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 100),
                child: Column(
                  children: [
                    if (_errorMessage != null)
                      Container(
                        padding: const EdgeInsets.all(16),
                        margin: const EdgeInsets.only(bottom: 24),
                        decoration: BoxDecoration(
                          color: AppColors.errorContainer,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: AppColors.error.withValues(alpha: 0.3),
                          ),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.error_outline,
                              color: AppColors.error,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                _errorMessage!,
                                style: const TextStyle(color: AppColors.error),
                              ),
                            ),
                          ],
                        ),
                      ),
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
                    _buildAttendButton(),
                    const SizedBox(height: 28),
                    _buildScoreCard(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusCard() {
    return switch (_state) {
      AttendanceState.beforeWindow => _StatusCard(
        key: const ValueKey('before'),
        icon: Icons.schedule_rounded,
        iconColor: AppColors.accentYellow,
        iconBg: AppColors.accentYellow.withValues(alpha: 0.15),
        title: s.beforeWindowTitle,
        subtitle: s.opensAt,
        detail: _CountdownChip(s: s),
      ),
      AttendanceState.windowOpenNearby => _StatusCard(
        key: const ValueKey('nearby'),
        icon: Icons.location_on_rounded,
        iconColor: AppColors.successLight,
        iconBg: AppColors.successContainer,
        title: s.windowOpenTitle,
        subtitle: s.nearbySubtitle,
        titleColor: AppColors.success,
      ),
      AttendanceState.windowOpenFarAway => _StatusCard(
        key: const ValueKey('far'),
        icon: Icons.location_off_rounded,
        iconColor: AppColors.warning,
        iconBg: AppColors.warningContainer,
        title: s.farAwayTitle,
        subtitle: s.tooFar,
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
      AttendanceState.checkedIn ||
      AttendanceState.authenticating => _buildCheckedInCard(),
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
              return Transform.scale(scale: scale, child: child);
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
          child: Text(isAuthenticating ? s.authenticating : s.attendButton),
        ),
      ],
    );
  }

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
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.star_rounded,
              color: AppColors.primary,
              size: 32,
            ),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  s.score,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '$_scoreDays ${s.days}',
                  style: const TextStyle(
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
              _checkedInToday ? '✓' : '—',
              style: const TextStyle(
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
}

// ══════════════════════════════════════════════════════════
//  PRIVATE WIDGETS (copied from demo)
// ══════════════════════════════════════════════════════════

class _Header extends StatelessWidget {
  const _Header({required this.s, required this.userName});
  final S s;
  final String userName;

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
          if (userName.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(
                s.welcome(userName),
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: AppColors.onPrimary.withValues(alpha: 0.9),
                ),
              ),
            ),
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
        ],
      ),
    );
  }
}

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
          if (detail != null) ...[const SizedBox(height: 16), detail!],
        ],
      ),
    );
  }
}

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
    _scaleAnim = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _ctrl, curve: Curves.elasticOut));
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
                  widget.s.checkedInToday,
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
}

class _CountdownChip extends StatelessWidget {
  const _CountdownChip({required this.s});
  final S s;

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final start = DateTime(now.year, now.month, now.day, 21, 45);
    final diff = start.difference(now);

    // Display countdown if less than 24 hours
    final label = diff.isNegative
        ? s.countdown(0, 0)
        : s.countdown(diff.inHours, diff.inMinutes.remainder(60));

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.hourglass_bottom_rounded,
            size: 18,
            color: AppColors.primary,
          ),
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
                        (color ?? AppColors.accentYellow).withValues(
                          alpha: 0.0,
                        ),
                        (color ?? AppColors.accentYellow),
                        (color ?? AppColors.accentYellow).withValues(
                          alpha: 0.0,
                        ),
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
