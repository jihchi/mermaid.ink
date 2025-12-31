import { describe, test, expect } from 'vitest';
import {
  bufferToLockKey,
  readAsset,
  readBlob,
  insertAsset,
  updateAsset,
} from '#@/helpers/db.js';

describe('bufferToLockKey', () => {
  test.each`
    value
    ${0}
    ${'string'}
    ${null}
    ${undefined}
    ${{}}
  `('throws an error if value ($value) is not a Buffer', ({ value }) => {
    expect(() => bufferToLockKey(value)).toThrowError('value must be a Buffer');
  });

  test.each`
    len
    ${0}
    ${1}
    ${7}
  `('throws an error if Buffer has less than 8 bytes ($len)', ({ len }) => {
    expect(() => bufferToLockKey(Buffer.alloc(len))).toThrowError(
      'value must be at least 8 bytes'
    );
  });

  test('converts Buffer with exactly 8 bytes to BigInt', () => {
    // simple sequential bytes: 0x00 01 02 03 04 05 06 07
    expect(
      bufferToLockKey(
        Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07])
      )
    ).toBe(BigInt('0x0001020304050607'));
  });

  test('converts Buffer with more than 8 bytes (uses only first 8)', () => {
    expect(
      bufferToLockKey(
        Buffer.from([
          0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0xff, 0xff,
        ])
      )
    ).toBe(BigInt('0x0102030405060708'));
  });

  test('converts Buffer with all zeros to 0n', () => {
    expect(
      bufferToLockKey(
        Buffer.alloc(8) // all zeros
      )
    ).toBe(0n);
  });

  test('converts Buffer with maximum positive value', () => {
    expect(
      bufferToLockKey(
        // maximum positive signed 64-bit integer: 0x7FFFFFFFFFFFFFFF
        Buffer.from([0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff])
      )
    ).toBe(BigInt('9223372036854775807')); // 2^63 - 1
  });

  test('converts Buffer with negative BigInt value (signed interpretation)', () => {
    expect(
      bufferToLockKey(
        // all 0xFF bytes represent -1 in signed 64-bit
        Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff])
      )
    ).toBe(-1n);

    expect(
      bufferToLockKey(
        // minimum signed 64-bit integer: 0x8000000000000000 = -2^63
        Buffer.from([0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
      )
    ).toBe(BigInt('-9223372036854775808')); // -2^63
  });

  test('handles arbitrary byte patterns correctly', () => {
    expect(
      bufferToLockKey(
        Buffer.from([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0])
      )
    ).toBe(BigInt('0x123456789ABCDEF0'));
  });
});

describe('readAsset', () => {
  test('throws if sql parameter is missing', async () => {
    const id = Buffer.from('test-id');
    await expect(readAsset(null, id)).rejects.toThrowError(
      'parameter `sql` is required'
    );
  });

  test('throws if id parameter is missing', async () => {
    await expect(readAsset({}, null)).rejects.toThrowError(
      'parameter `id` is required'
    );
  });
});

describe('readBlob', () => {
  test('throws if sql parameter is missing', async () => {
    const id = Buffer.from('test-id');
    await expect(readBlob(null, id)).rejects.toThrowError(
      'parameter `sql` is required'
    );
  });

  test('throws if id parameter is missing', async () => {
    await expect(readBlob({}, null)).rejects.toThrowError(
      'parameter `id` is required'
    );
  });
});

describe('insertAsset', () => {
  test('throws if sql parameter is missing', async () => {
    const id = Buffer.from('test-id');
    await expect(
      insertAsset(null, { id, statusCode: 200 })
    ).rejects.toThrowError('parameter `sql` is required');
  });

  test('throws if id parameter is missing', async () => {
    await expect(insertAsset({}, { statusCode: 200 })).rejects.toThrowError(
      'parameter `id` is required'
    );
  });
});

describe('updateAsset', () => {
  test('throws if sql parameter is missing', async () => {
    const id = Buffer.from('test-id');
    await expect(
      updateAsset(null, { id, statusCode: 200 })
    ).rejects.toThrowError('parameter `sql` is required');
  });

  test('throws if id parameter is missing', async () => {
    await expect(updateAsset({}, { statusCode: 200 })).rejects.toThrowError(
      'parameter `id` is required'
    );
  });
});
