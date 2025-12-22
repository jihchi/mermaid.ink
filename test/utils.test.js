import { describe, test, expect } from 'vitest';
import { validateQuery, extractDimension } from '#@/helpers/utils.js';

describe('validateQuery', () => {
  test('works without any arguments', () => {
    expect(() => validateQuery()).not.toThrowError();
  });

  describe('width', () => {
    test('works if width is valid', () => {
      expect(() => validateQuery({ width: '1' })).not.toThrowError();
    });

    test.each`
      width
      ${'nan'}
      ${'0'}
      ${'-1'}
    `('throws an error if width is $width', ({ width }) => {
      expect(() => validateQuery({ width })).toThrowError(
        'invalid width value'
      );
    });
  });

  describe('height', () => {
    test('works if height is valid', () => {
      expect(() => validateQuery({ height: '1' })).not.toThrowError();
    });

    test.each`
      height
      ${'nan'}
      ${'0'}
      ${'-1'}
    `('throws an error if height is $height', ({ height }) => {
      expect(() => validateQuery({ height })).toThrowError(
        'invalid height value'
      );
    });
  });

  describe('scale', () => {
    describe('valid scale values', () => {
      test.each`
        scale     | description
        ${'1'}    | ${'integer minimum'}
        ${'1.0'}  | ${'decimal minimum'}
        ${'1.00'} | ${'decimal minimum with trailing zeros'}
        ${'1.5'}  | ${'decimal value'}
        ${'2.0'}  | ${'decimal middle value'}
        ${'2.25'} | ${'quarter decimal'}
        ${'2.5'}  | ${'half decimal'}
        ${'2.75'} | ${'three-quarter decimal'}
        ${'3'}    | ${'integer maximum'}
        ${'3.0'}  | ${'decimal maximum'}
        ${'3.00'} | ${'decimal maximum with trailing zeros'}
      `(
        'accepts valid scale $scale ($description) with width and height',
        ({ scale }) => {
          expect(() =>
            validateQuery({ scale, width: '100', height: '100' })
          ).not.toThrowError();
        }
      );

      test.each`
        scale    | description
        ${'1'}   | ${'integer minimum'}
        ${'1.0'} | ${'decimal minimum'}
        ${'2.5'} | ${'decimal value'}
        ${'3'}   | ${'integer maximum'}
      `(
        'accepts valid scale $scale ($description) with only width',
        ({ scale }) => {
          expect(() =>
            validateQuery({ scale, width: '100' })
          ).not.toThrowError();
        }
      );

      test.each`
        scale    | description
        ${'1'}   | ${'integer minimum'}
        ${'1.0'} | ${'decimal minimum'}
        ${'2.5'} | ${'decimal value'}
        ${'3'}   | ${'integer maximum'}
      `(
        'accepts valid scale $scale ($description) with only height',
        ({ scale }) => {
          expect(() =>
            validateQuery({ scale, height: '100' })
          ).not.toThrowError();
        }
      );
    });

    describe('validates unrounded scale values', () => {
      test.each`
        scale        | description
        ${'1.234'}   | ${'decimal value between 1 and 3'}
        ${'1.235'}   | ${'decimal value between 1 and 3'}
        ${'1.23456'} | ${'many decimal places between 1 and 3'}
        ${'1.23567'} | ${'many decimal places between 1 and 3'}
        ${'2.994'}   | ${'near upper bound but under 3'}
        ${'2.995'}   | ${'near upper bound but under 3'}
        ${'2.999'}   | ${'very close to 3 but still valid'}
        ${'1.004'}   | ${'near lower bound but above 1'}
        ${'1.005'}   | ${'near lower bound but above 1'}
        ${'1.001'}   | ${'very close to 1 but still valid'}
      `('accepts scale $scale ($description)', ({ scale }) => {
        expect(() =>
          validateQuery({ scale, width: '100', height: '100' })
        ).not.toThrowError();
      });

      test('accepts scale exactly at upper bound 3.0', () => {
        expect(() =>
          validateQuery({ scale: '3.0', width: '100', height: '100' })
        ).not.toThrowError();
      });

      test('accepts scale exactly at upper bound 3.00', () => {
        expect(() =>
          validateQuery({ scale: '3.00', width: '100', height: '100' })
        ).not.toThrowError();
      });

      test('rejects scale just above upper bound 3.001', () => {
        expect(() =>
          validateQuery({ scale: '3.001', width: '100', height: '100' })
        ).toThrowError(
          'invalid scale value - must be a number between 1 and 3'
        );
      });

      test('rejects scale above upper bound 3.005', () => {
        expect(() =>
          validateQuery({ scale: '3.005', width: '100', height: '100' })
        ).toThrowError(
          'invalid scale value - must be a number between 1 and 3'
        );
      });

      test('accepts scale exactly at lower bound 1.0', () => {
        expect(() =>
          validateQuery({ scale: '1.0', width: '100', height: '100' })
        ).not.toThrowError();
      });

      test('accepts scale exactly at lower bound 1.00', () => {
        expect(() =>
          validateQuery({ scale: '1.00', width: '100', height: '100' })
        ).not.toThrowError();
      });

      test('rejects scale just below lower bound 0.999', () => {
        expect(() =>
          validateQuery({ scale: '0.999', width: '100', height: '100' })
        ).toThrowError(
          'invalid scale value - must be a number between 1 and 3'
        );
      });
    });

    describe('string format variations', () => {
      test.each`
        scale       | description
        ${' 1.5 '}  | ${'leading/trailing whitespace'}
        ${'001.50'} | ${'leading zeros'}
        ${'1.5000'} | ${'trailing zeros'}
        ${'2.000'}  | ${'many trailing zeros'}
      `('accepts valid format: $description', ({ scale }) => {
        expect(() =>
          validateQuery({ scale, width: '100', height: '100' })
        ).not.toThrowError();
      });
    });

    describe('invalid scale values', () => {
      test.each`
        scale          | description
        ${'0'}         | ${'zero'}
        ${'0.9'}       | ${'below minimum'}
        ${'0.99'}      | ${'just below minimum'}
        ${'3.01'}      | ${'just above maximum'}
        ${'3.1'}       | ${'above maximum'}
        ${'4'}         | ${'way above maximum'}
        ${'-1'}        | ${'negative integer'}
        ${'-0.5'}      | ${'negative decimal'}
        ${'nan'}       | ${'not a number string'}
        ${'NaN'}       | ${'NaN string'}
        ${'infinity'}  | ${'infinity string'}
        ${'-infinity'} | ${'negative infinity'}
        ${'abc'}       | ${'non-numeric string'}
        ${' '}         | ${'space only'}
        ${'null'}      | ${'null string'}
        ${'undefined'} | ${'undefined string'}
        ${'1e10'}      | ${'scientific notation too large'}
        ${'1e-10'}     | ${'scientific notation too small'}
      `('rejects invalid scale "$scale" ($description)', ({ scale }) => {
        expect(() => validateQuery({ scale, width: '100' })).toThrowError(
          'invalid scale value - must be a number between 1 and 3'
        );
      });
    });

    describe('scale without required dimensions', () => {
      test('throws error when scale provided without width or height', () => {
        expect(() => validateQuery({ scale: '1.5' })).toThrowError(
          'scale can only be set when either width or height is set'
        );
      });

      test('throws error when scale provided with invalid width and height', () => {
        expect(() =>
          validateQuery({ scale: '1.5', width: 'invalid', height: 'invalid' })
        ).toThrowError('invalid width value');
      });
    });

    describe('scaled dimension limits', () => {
      describe('width limits', () => {
        test('throws error when scaled width exceeds maxWidth', () => {
          expect(() =>
            validateQuery({ scale: '2', width: '100' }, { maxWidth: 150 })
          ).toThrowError('the scaled width must be between 0 and 150');
        });

        test('throws error when width is zero (before scale validation)', () => {
          expect(() =>
            validateQuery({ scale: '2', width: '0' }, { maxWidth: 100 })
          ).toThrowError('invalid width value');
        });

        test('accepts when scaled width equals maxWidth', () => {
          expect(() =>
            validateQuery({ scale: '1.5', width: '100' }, { maxWidth: 150 })
          ).not.toThrowError();
        });

        test('accepts when no maxWidth specified', () => {
          expect(() =>
            validateQuery({ scale: '3', width: '10000' })
          ).not.toThrowError();
        });
      });

      describe('height limits', () => {
        test('throws error when scaled height exceeds maxHeight', () => {
          expect(() =>
            validateQuery({ scale: '2', height: '100' }, { maxHeight: 150 })
          ).toThrowError('the scaled height must be between 0 and 150');
        });

        test('throws error when height is zero (before scale validation)', () => {
          expect(() =>
            validateQuery({ scale: '2', height: '0' }, { maxHeight: 100 })
          ).toThrowError('invalid height value');
        });

        test('accepts when scaled height equals maxHeight', () => {
          expect(() =>
            validateQuery({ scale: '1.5', height: '100' }, { maxHeight: 150 })
          ).not.toThrowError();
        });

        test('accepts when no maxHeight specified', () => {
          expect(() =>
            validateQuery({ scale: '3', height: '10000' })
          ).not.toThrowError();
        });
      });

      describe('both dimensions with limits', () => {
        test('throws error when scaled width exceeds maxWidth (height ok)', () => {
          expect(() =>
            validateQuery(
              { scale: '2', width: '100', height: '50' },
              { maxWidth: 150, maxHeight: 200 }
            )
          ).toThrowError('the scaled width must be between 0 and 150');
        });

        test('throws error when scaled height exceeds maxHeight (width ok)', () => {
          expect(() =>
            validateQuery(
              { scale: '2', width: '50', height: '100' },
              { maxWidth: 200, maxHeight: 150 }
            )
          ).toThrowError('the scaled height must be between 0 and 150');
        });

        test('accepts when both scaled dimensions within limits', () => {
          expect(() =>
            validateQuery(
              { scale: '2', width: '50', height: '50' },
              { maxWidth: 200, maxHeight: 200 }
            )
          ).not.toThrowError();
        });
      });
    });

    describe('edge cases and special scenarios', () => {
      test('handles very long decimal strings', () => {
        expect(() =>
          validateQuery({ scale: '1.123456789012345', width: '100' })
        ).not.toThrowError();
      });

      test('handles decimal strings with leading zeros', () => {
        expect(() =>
          validateQuery({ scale: '001.500', width: '100' })
        ).not.toThrowError();
      });

      test('rounding with very small decimals', () => {
        expect(() =>
          validateQuery({ scale: '1.0000001', width: '100' })
        ).not.toThrowError();
      });

      test('boundary rounding - exactly 1.005 rounds to 1.01', () => {
        expect(() =>
          validateQuery({ scale: '1.0049', width: '100' })
        ).not.toThrowError();
      });

      test('boundary rounding - exactly 2.995 rounds to 3.00', () => {
        expect(() =>
          validateQuery({ scale: '2.9949', width: '100' })
        ).not.toThrowError();
      });
    });
  });
});

describe('extractDimension', () => {
  describe('basic functionality', () => {
    test('returns undefined when query is null', () => {
      expect(extractDimension(null)).toBeUndefined();
    });

    test('returns undefined when query is undefined', () => {
      expect(extractDimension(undefined)).toBeUndefined();
    });

    test('returns null width and height when no dimensions provided', () => {
      expect(extractDimension({})).toEqual({ width: null, height: null });
    });

    test('parses width correctly', () => {
      expect(extractDimension({ width: '800' })).toEqual({
        width: 800,
        height: null,
      });
    });

    test('parses height correctly', () => {
      expect(extractDimension({ height: '600' })).toEqual({
        width: null,
        height: 600,
      });
    });

    test('parses both width and height', () => {
      expect(extractDimension({ width: '800', height: '600' })).toEqual({
        width: 800,
        height: 600,
      });
    });

    test('ignores invalid width values', () => {
      expect(extractDimension({ width: 'invalid' })).toEqual({
        width: null,
        height: null,
      });
    });

    test('ignores invalid height values', () => {
      expect(extractDimension({ height: 'invalid' })).toEqual({
        width: null,
        height: null,
      });
    });
  });

  describe('scale rounding to 2 decimal places', () => {
    test('rounds scale to 2 decimal places - rounding down', () => {
      const result = extractDimension({
        width: '100',
        height: '100',
        scale: '1.234',
      });
      // scale 1.234 rounds to 1.23
      expect(result).toEqual({ width: 123, height: 123 });
    });

    test('rounds scale to 2 decimal places - rounding up', () => {
      const result = extractDimension({
        width: '100',
        height: '100',
        scale: '1.235',
      });
      // scale 1.235 rounds to 1.24
      expect(result).toEqual({ width: 124, height: 124 });
    });

    test('rounds scale with many decimal places - down', () => {
      const result = extractDimension({
        width: '100',
        height: '100',
        scale: '1.23456',
      });
      // scale 1.23456 rounds to 1.23
      expect(result).toEqual({ width: 123, height: 123 });
    });

    test('rounds scale with many decimal places - up', () => {
      const result = extractDimension({
        width: '100',
        height: '100',
        scale: '1.23567',
      });
      // scale 1.23567 rounds to 1.24
      expect(result).toEqual({ width: 124, height: 124 });
    });

    test('rounds scale near upper bound - down', () => {
      const result = extractDimension({
        width: '100',
        scale: '2.994',
      });
      // scale 2.994 rounds to 2.99
      expect(result).toEqual({ width: 299, height: null });
    });

    test('rounds scale near upper bound - up to exactly 3.00', () => {
      const result = extractDimension({
        width: '100',
        scale: '2.995',
      });
      // scale 2.995 rounds to 3.00
      expect(result).toEqual({ width: 300, height: null });
    });

    test('rounds scale near lower bound - down', () => {
      const result = extractDimension({
        width: '100',
        scale: '1.004',
      });
      // scale 1.004 rounds to 1.00
      expect(result).toEqual({ width: 100, height: null });
    });

    test('rounds scale near lower bound - up', () => {
      const result = extractDimension({
        width: '100',
        scale: '1.005',
      });
      // scale 1.005 rounds to 1.01
      expect(result).toEqual({ width: 101, height: null });
    });

    test('handles scale of exactly 1.0', () => {
      const result = extractDimension({
        width: '100',
        height: '100',
        scale: '1.0',
      });
      expect(result).toEqual({ width: 100, height: 100 });
    });

    test('handles scale of exactly 2.0', () => {
      const result = extractDimension({
        width: '100',
        height: '100',
        scale: '2.0',
      });
      expect(result).toEqual({ width: 200, height: 200 });
    });

    test('handles scale of exactly 3.0', () => {
      const result = extractDimension({
        width: '100',
        height: '100',
        scale: '3.0',
      });
      expect(result).toEqual({ width: 300, height: 300 });
    });

    test('handles integer scale values', () => {
      const result = extractDimension({
        width: '100',
        height: '100',
        scale: '2',
      });
      expect(result).toEqual({ width: 200, height: 200 });
    });
  });

  describe('scale precision edge cases with Number.EPSILON', () => {
    test('handles floating point precision issues correctly - case 1', () => {
      const result = extractDimension({
        width: '100',
        scale: '1.555',
      });
      // 1.555 should round to 1.56
      expect(result).toEqual({ width: 156, height: null });
    });

    test('handles floating point precision issues correctly - case 2', () => {
      const result = extractDimension({
        width: '100',
        scale: '2.445',
      });
      expect(result.width).toBeCloseTo(245, 10);
      expect(result.height).toBeNull();
    });

    test('handles very small decimal increments', () => {
      const result = extractDimension({
        width: '1000',
        scale: '1.0001',
      });
      // 1.0001 rounds to 1.00
      expect(result).toEqual({ width: 1000, height: null });
    });

    test('handles values just below rounding threshold', () => {
      const result = extractDimension({
        width: '1000',
        scale: '1.0049',
      });
      // 1.0049 rounds to 1.00
      expect(result).toEqual({ width: 1000, height: null });
    });

    test('handles values just above rounding threshold', () => {
      const result = extractDimension({
        width: '1000',
        scale: '1.0050',
      });
      // 1.0050 rounds to 1.01
      expect(result).toEqual({ width: 1010, height: null });
    });
  });

  describe('scale validation boundaries', () => {
    test('applies scale when scale is exactly 1', () => {
      const result = extractDimension({
        width: '100',
        scale: '1',
      });
      expect(result).toEqual({ width: 100, height: null });
    });

    test('applies scale when scale is exactly 3', () => {
      const result = extractDimension({
        width: '100',
        scale: '3',
      });
      expect(result).toEqual({ width: 300, height: null });
    });

    test('ignores scale when less than 1', () => {
      const result = extractDimension({
        width: '100',
        scale: '0.9',
      });
      // scale < 1 is ignored, so scale defaults to 1
      expect(result).toEqual({ width: 100, height: null });
    });

    test('ignores scale when greater than 3', () => {
      const result = extractDimension({
        width: '100',
        scale: '3.01',
      });
      // scale > 3 is ignored, so scale defaults to 1
      expect(result).toEqual({ width: 100, height: null });
    });

    test('ignores scale when invalid (NaN)', () => {
      const result = extractDimension({
        width: '100',
        scale: 'invalid',
      });
      expect(result).toEqual({ width: 100, height: null });
    });

    test('ignores scale when width and height are not provided', () => {
      const result = extractDimension({
        scale: '2',
      });
      // scale is ignored when no dimensions provided
      expect(result).toEqual({ width: null, height: null });
    });
  });

  describe('scale with maxWidth and maxHeight constraints', () => {
    test('respects maxWidth when scaling width', () => {
      const result = extractDimension(
        { width: '100', scale: '2' },
        { maxWidth: 150 }
      );
      expect(result).toEqual({ width: 100, height: null });
    });

    test('respects maxHeight when scaling height', () => {
      const result = extractDimension(
        { height: '100', scale: '2' },
        { maxHeight: 150 }
      );
      expect(result).toEqual({ width: null, height: 100 });
    });

    test('applies scale when scaled dimensions are within limits', () => {
      const result = extractDimension(
        { width: '100', height: '100', scale: '1.5' },
        { maxWidth: 200, maxHeight: 200 }
      );
      expect(result).toEqual({ width: 150, height: 150 });
    });

    test('applies scale when scaled dimensions equal the limits', () => {
      const result = extractDimension(
        { width: '100', height: '100', scale: '2' },
        { maxWidth: 200, maxHeight: 200 }
      );
      expect(result).toEqual({ width: 200, height: 200 });
    });

    test('handles mixed scenario - width exceeds limit, height ok', () => {
      const result = extractDimension(
        { width: '100', height: '50', scale: '2' },
        { maxWidth: 150, maxHeight: 200 }
      );
      expect(result).toEqual({ width: 100, height: 100 });
    });

    test('handles mixed scenario - height exceeds limit, width ok', () => {
      const result = extractDimension(
        { width: '50', height: '100', scale: '2' },
        { maxWidth: 200, maxHeight: 150 }
      );
      expect(result).toEqual({ width: 100, height: 100 });
    });

    test('respects both limits when both scaled dimensions exceed', () => {
      const result = extractDimension(
        { width: '100', height: '100', scale: '3' },
        { maxWidth: 200, maxHeight: 200 }
      );
      expect(result).toEqual({ width: 100, height: 100 });
    });
  });

  describe('scale rounding with constraints interaction', () => {
    test('rounds scale before checking maxWidth constraint', () => {
      const result = extractDimension(
        { width: '100', scale: '1.995' },
        { maxWidth: 199 }
      );
      // scale 1.995 rounds to 2.00
      // scaled width would be 200, which exceeds maxWidth 199
      expect(result).toEqual({ width: 100, height: null });
    });

    test('rounds scale before checking maxHeight constraint', () => {
      const result = extractDimension(
        { height: '100', scale: '1.995' },
        { maxHeight: 199 }
      );
      // scale 1.995 rounds to 2.00
      // scaled height would be 200, which exceeds maxHeight 199
      expect(result).toEqual({ width: null, height: 100 });
    });

    test('rounding down allows dimension within constraint', () => {
      const result = extractDimension(
        { width: '100', scale: '1.994' },
        { maxWidth: 199 }
      );
      // scale 1.994 rounds to 1.99
      // scaled width would be 199, which is within maxWidth 199
      expect(result).toEqual({ width: 199, height: null });
    });
  });
});
