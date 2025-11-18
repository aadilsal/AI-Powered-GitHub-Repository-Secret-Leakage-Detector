import { SECRET_PATTERNS } from '../regexPatterns';

describe('SECRET_PATTERNS basic smoke tests', () => {
  test('AWS access key matches', () => {
    const sample = 'AKIA1234567890ABCD12';
    expect(SECRET_PATTERNS.AWS_ACCESS_KEY.test(sample)).toBe(true);
  });

  test('Stripe test key matches', () => {
    const sample = 'sk_test_51HkqYEXAMPLEKEY1234567890';
    expect(SECRET_PATTERNS.STRIPE_TEST_KEY.test(sample)).toBe(true);
  });

  test('Google API key matches', () => {
    const sample = 'AIzaSyD-EXAMPLEKEY1234567890abcdefg';
    expect(SECRET_PATTERNS.GOOGLE_API_KEY.test(sample)).toBe(true);
  });

  test('Generic base64-like long token matches', () => {
    const sample = 'qwertyuiopASDFGHJKLzxcvbnm123456+';
    expect(SECRET_PATTERNS.GENERIC_BASE64_TOKEN.test(sample)).toBe(true);
  });

  test('Does not match safe placeholder', () => {
    const sample = 'your_api_key_here_with_high_entropy_value_12345';
    // Should not falsely match stripe or google
    expect(SECRET_PATTERNS.STRIPE_TEST_KEY.test(sample)).toBe(false);
    expect(SECRET_PATTERNS.GOOGLE_API_KEY.test(sample)).toBe(false);
  });
});
