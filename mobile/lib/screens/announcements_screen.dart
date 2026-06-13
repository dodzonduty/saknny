import 'package:flutter/material.dart';

import '../l10n/strings.dart';
import '../saknny_mobile_app.dart';
import '../theme/app_colors.dart';

class AnnouncementsScreen extends StatefulWidget {
  const AnnouncementsScreen({super.key, required this.services});

  final SaknnyMobileServices services;

  @override
  State<AnnouncementsScreen> createState() => _AnnouncementsScreenState();
}

class _AnnouncementsScreenState extends State<AnnouncementsScreen> {
  bool _isArabic = false;
  bool _loading = true;
  List<Map<String, dynamic>> _announcements = [];
  String? _error;

  S get s => S(_isArabic);

  @override
  void initState() {
    super.initState();
    _fetchAnnouncements();
  }

  Future<void> _fetchAnnouncements() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final result = await widget.services.announcementsService.fetchAnnouncements();
      final items = (result['items'] as List?)
              ?.cast<Map<String, dynamic>>() ??
          [];
      if (mounted) {
        setState(() {
          _announcements = items;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  String _formatDate(String? isoDate) {
    if (isoDate == null) return '';
    try {
      final dt = DateTime.parse(isoDate);
      final monthName = s.monthNames[dt.month - 1];
      return '${dt.day} $monthName ${dt.year}';
    } catch (_) {
      return isoDate;
    }
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
              child: RefreshIndicator(
                onRefresh: _fetchAnnouncements,
                color: AppColors.primary,
                child: _loading
                    ? const Center(
                        child: CircularProgressIndicator(
                          color: AppColors.primary,
                        ),
                      )
                    : _error != null
                        ? _buildErrorState()
                        : _announcements.isEmpty
                            ? _buildEmptyState()
                            : _buildAnnouncementsList(),
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
            Icons.campaign_rounded,
            size: 40,
            color: AppColors.accentYellow.withValues(alpha: 0.9),
          ),
          const SizedBox(height: 10),
          Text(
            s.tabAnnouncements,
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

  Widget _buildEmptyState() {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        const SizedBox(height: 80),
        Center(
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.08),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.campaign_outlined,
                  size: 56,
                  color: AppColors.disabled,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                s.noAnnouncements,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppColors.onSurface,
                ),
              ),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 48),
                child: Text(
                  s.noAnnouncementsDesc,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.onSurfaceVariant,
                    height: 1.5,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildErrorState() {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        const SizedBox(height: 80),
        Center(
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.errorContainer,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.wifi_off_rounded,
                  size: 56,
                  color: AppColors.error,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                s.networkError,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppColors.onSurface,
                ),
              ),
              const SizedBox(height: 16),
              TextButton.icon(
                onPressed: _fetchAnnouncements,
                icon: const Icon(Icons.refresh_rounded),
                label: Text(s.refreshing),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildAnnouncementsList() {
    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(
        parent: BouncingScrollPhysics(),
      ),
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
      itemCount: _announcements.length,
      itemBuilder: (context, index) {
        final ann = _announcements[index];
        return TweenAnimationBuilder<double>(
          tween: Tween(begin: 0, end: 1),
          duration: Duration(milliseconds: 400 + index * 100),
          curve: Curves.easeOutCubic,
          builder: (context, value, child) => Opacity(
            opacity: value,
            child: Transform.translate(
              offset: Offset(0, 20 * (1 - value)),
              child: child,
            ),
          ),
          child: _AnnouncementCard(
            title: ann['title']?.toString() ?? '',
            content: ann['content']?.toString() ?? '',
            date: _formatDate(ann['published_at']?.toString()),
            publishedLabel: s.publishedOn,
          ),
        );
      },
    );
  }
}

class _AnnouncementCard extends StatelessWidget {
  const _AnnouncementCard({
    required this.title,
    required this.content,
    required this.date,
    required this.publishedLabel,
  });

  final String title;
  final String content;
  final String date;
  final String publishedLabel;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
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
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.accentYellow.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.campaign_rounded,
                  color: AppColors.accentYellow,
                  size: 22,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                        height: 1.3,
                      ),
                    ),
                    if (date.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        '$publishedLabel $date',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: AppColors.onSurfaceVariant.withValues(alpha: 0.7),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          if (content.isNotEmpty) ...[
            const SizedBox(height: 14),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                content,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.onSurface,
                  height: 1.6,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
