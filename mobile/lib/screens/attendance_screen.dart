import 'dart:async';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

import '../l10n/strings.dart';
import '../saknny_mobile_app.dart';
import '../services/attendance_service.dart';
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
    with TickerProviderStateMixin, WidgetsBindingObserver {
  AttendanceState _state = AttendanceState.beforeWindow;
  bool _isArabic = false;
  String _userName = '';

  // Demo mode
  bool _demoModeEnabled = false;
  AttendanceState _mockState = AttendanceState.beforeWindow;
  double _mockDistance = 347.0;

  // Real data
  int _scoreDays = 0;
  bool _checkedInToday = false;
  String? _errorMessage;

  // Room geofence data (from allocation)
  double? _roomLat;
  double? _roomLng;
  int? _allowedRadius;
  double? _distanceMeters;

  late final AnimationController _pulseCtrl;
  late final AnimationController _scanCtrl;
  late final Animation<double> _pulseAnim;

  late Timer _refreshTimer;

  S get s => S(_isArabic);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
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

    _refreshTimer = Timer.periodic(const Duration(minutes: 1), (_) {
      _determineState();
    });

    _loadData();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _determineState();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _refreshTimer.cancel();
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
          _checkedInToday = scoreData['checked_in_today'] == true;
        });
      }
    } catch (_) {
      // Ignore score fetch error
    }

    // Fetch allocation with room geofence data
    try {
      final allocation = await widget.services.attendanceService.fetchAllocation();
      if (allocation != null && mounted) {
        setState(() {
          _roomLat = (allocation['latitude'] as num?)?.toDouble();
          _roomLng = (allocation['longitude'] as num?)?.toDouble();
          _allowedRadius = allocation['allowed_radius_meters'] as int?;
        });
      }
    } catch (_) {
      // Ignore allocation fetch error — geofence check will be skipped
    }

    await _determineState();
  }

  Future<void> _determineState() async {
    if (_demoModeEnabled) {
      if (mounted) {
        setState(() {
          _state = _mockState;
          if (_state == AttendanceState.windowOpenFarAway) {
            _distanceMeters = _mockDistance;
          }
        });
      }
      return;
    }

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
      return;
    }
    if (now.isAfter(end)) {
      setState(() => _state = AttendanceState.windowClosed);
      return;
    }

    // Window is open — check proximity to allocated room
    if (_roomLat != null && _roomLng != null && _allowedRadius != null) {
      try {
        final position = await widget.services.attendanceService.getCurrentPosition();

        // Check for mock location
        if (position.isMocked) {
          setState(() => _state = AttendanceState.mockLocationDetected);
          return;
        }

        final distance = AttendanceService.haversineMeters(
          position.latitude, position.longitude,
          _roomLat!, _roomLng!,
        );

        if (mounted) {
          setState(() {
            _distanceMeters = distance;
            if (distance <= _allowedRadius!) {
              _state = AttendanceState.windowOpenNearby;
            } else {
              _state = AttendanceState.windowOpenFarAway;
            }
          });
        }
      } catch (_) {
        // GPS unavailable — default to far away for safety
        if (mounted) {
          setState(() => _state = AttendanceState.windowOpenFarAway);
        }
      }
    } else {
      // No geofence data available — allow attempt, backend will validate
      setState(() => _state = AttendanceState.windowOpenNearby);
    }
  }

  Future<void> _onAttendPressed() async {
    if (_state != AttendanceState.windowOpenNearby) return;

    // 1. Biometric Gate
    final bioSuccess = await widget.services.biometricService.authenticateForAttendance();
    if (!bioSuccess) {
      _showError(s.biometricFailed);
      return;
    }

    setState(() {
      _state = AttendanceState.authenticating;
      _errorMessage = null;
    });

    try {
      Position? positionOverride;
      if (_demoModeEnabled) {
        if (_mockState == AttendanceState.windowOpenNearby) {
           positionOverride = Position(latitude: _roomLat ?? 0.0, longitude: _roomLng ?? 0.0, timestamp: DateTime.now(), accuracy: 10, altitude: 0, heading: 0, speed: 0, speedAccuracy: 0, isMocked: false, altitudeAccuracy: 0, headingAccuracy: 0);
        } else if (_mockState == AttendanceState.windowOpenFarAway) {
           positionOverride = Position(latitude: (_roomLat ?? 0.0) + 0.05, longitude: (_roomLng ?? 0.0) + 0.05, timestamp: DateTime.now(), accuracy: 10, altitude: 0, heading: 0, speed: 0, speedAccuracy: 0, isMocked: false, altitudeAccuracy: 0, headingAccuracy: 0);
        } else if (_mockState == AttendanceState.mockLocationDetected) {
           positionOverride = Position(latitude: _roomLat ?? 0.0, longitude: _roomLng ?? 0.0, timestamp: DateTime.now(), accuracy: 10, altitude: 0, heading: 0, speed: 0, speedAccuracy: 0, isMocked: true, altitudeAccuracy: 0, headingAccuracy: 0);
        }
      }

      // 2. Check mock location
      final position = positionOverride ?? await Geolocator.getCurrentPosition();
      if (position.isMocked) {
        setState(() => _state = AttendanceState.mockLocationDetected);
        return;
      }

      // 3. API Call
      await widget.services.attendanceService.checkInWithCurrentLocation(positionOverride: positionOverride);

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
        floatingActionButton: _buildDebugFab(),
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
        subtitle: _distanceMeters != null
            ? s.farAwayDistance(_distanceMeters!.round())
            : s.tooFar,
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

  Widget _buildDebugFab() {
    return FloatingActionButton.small(
      onPressed: _showDebugSheet,
      backgroundColor: AppColors.primary,
      child: const Icon(
        Icons.build_rounded,
        size: 20,
        color: AppColors.accentYellow,
      ),
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
          setState(() {
            _demoModeEnabled = true;
            _mockState = st;
          });
          _determineState();
          Navigator.pop(context);
        },
        onLanguageChanged: (val) {
          setState(() => _isArabic = val);
          Navigator.pop(context);
        },
        onDistanceChanged: (val) {
          setState(() => _mockDistance = val);
          _determineState();
        },
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
      width: double.infinity,
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
              padding: const EdgeInsets.only(bottom: 12, left: 40, right: 40),
              child: Text(
                s.welcome(userName),
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: AppColors.onPrimary.withValues(alpha: 0.9),
                ),
              ),
            ),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset('assets/images/logo.png', height: 50),
              const SizedBox(width: 22),
              Text(
                s.appName,
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  color: AppColors.onPrimary,
                  letterSpacing: -0.5,
                ),
              ),
            ],
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

class _CountdownChip extends StatefulWidget {
  const _CountdownChip({required this.s});
  final S s;

  @override
  State<_CountdownChip> createState() => _CountdownChipState();
}

class _CountdownChipState extends State<_CountdownChip> {
  late Timer _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final start = DateTime(now.year, now.month, now.day, 21, 45);
    final diff = start.difference(now);

    // Display countdown if less than 24 hours
    final label = diff.isNegative
        ? widget.s.countdown(0, 0)
        : widget.s.countdown(diff.inHours, diff.inMinutes.remainder(60));

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
            '${widget.s.opensIn}  ',
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
      (
        AttendanceState.beforeWindow,
        s.debugBeforeWindow,
        Icons.schedule_rounded,
        AppColors.accentYellow,
      ),
      (
        AttendanceState.windowOpenNearby,
        s.debugNearby,
        Icons.location_on_rounded,
        AppColors.successLight,
      ),
      (
        AttendanceState.windowOpenFarAway,
        s.debugFarAway,
        Icons.location_off_rounded,
        AppColors.warning,
      ),
      (
        AttendanceState.mockLocationDetected,
        s.debugMock,
        Icons.gpp_bad_rounded,
        AppColors.error,
      ),
      (
        AttendanceState.windowClosed,
        s.debugClosed,
        Icons.nightlight_round,
        AppColors.disabled,
      ),
      (
        AttendanceState.checkedIn,
        s.debugCheckedIn,
        Icons.check_circle_rounded,
        AppColors.success,
      ),
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
              const Icon(
                Icons.build_rounded,
                size: 20,
                color: AppColors.accentYellow,
              ),
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
                    horizontal: 14,
                    vertical: 10,
                  ),
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
                          fontWeight: isSelected
                              ? FontWeight.w700
                              : FontWeight.w500,
                          color: isSelected
                              ? color
                              : AppColors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),
          // Distance slider
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
                      const Icon(
                        Icons.language_rounded,
                        size: 20,
                        color: AppColors.primary,
                      ),
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
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 4,
                    ),
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
