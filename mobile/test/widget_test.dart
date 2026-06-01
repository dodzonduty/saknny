import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:saknny_mobile/screens/login_screen.dart';
import 'package:saknny_mobile/saknny_mobile_app.dart';

void main() {
  testWidgets('renders mobile login skeleton', (WidgetTester tester) async {
    final services = SaknnyMobileServices.create();

    await tester.pumpWidget(
      MaterialApp(
        home: LoginScreen(services: services, firebaseStatus: 'test'),
      ),
    );

    expect(find.text('Saknny Mobile Login'), findsOneWidget);
    expect(find.text('Login with backend JWT'), findsOneWidget);
  });
}
