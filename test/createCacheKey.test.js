import { describe, test, expect } from 'vitest';
import createCacheKey, { getQueryKey } from '#@/helpers/createCacheKey.js';

test('works', () => {
  expect(
    createCacheKey({
      assetType: 'img',
      encodedCode:
        'pako:eNpVkM1qw0AMhF9F6NRC_AI-BBo7zSWQQHLz5iC8SnZJ9gd5TQm2373r_ECrk9B8MwwasA2ascSLUDRwrJWHPF9NZcR2yVF3gqJYjhtO4ILn-wirj02AzoQYrb98PvnVDEE1bGeMIRnrr9NTqh7-necR6mZLMYV4-qscf8II68buTY7_rxjh7PpuzlSeqWhJoCJ5IbhAx-LI6lx-mG8Kk2HHCsu8apKrQuWnzPVRU-K1tikI5qRbxwukPoXD3bdYJun5DdWW8iPci5p-AUT3W9o',
    }).toString('hex')
  ).toEqual('bf1124a1afd44220d64ca9fbe5a25ecdc6aa233362a1f85f7ed19b16902de95e');
});

test('works with query', () => {
  expect(
    createCacheKey({
      assetType: 'img',
      encodedCode:
        'pako:eNpVkM1qw0AMhF9F6NRC_AI-BBo7zSWQQHLz5iC8SnZJ9gd5TQm2373r_ECrk9B8MwwasA2ascSLUDRwrJWHPF9NZcR2yVF3gqJYjhtO4ILn-wirj02AzoQYrb98PvnVDEE1bGeMIRnrr9NTqh7-necR6mZLMYV4-qscf8II68buTY7_rxjh7PpuzlSeqWhJoCJ5IbhAx-LI6lx-mG8Kk2HHCsu8apKrQuWnzPVRU-K1tikI5qRbxwukPoXD3bdYJun5DdWW8iPci5p-AUT3W9o',
      query: {
        type: 'png',
      },
    }).toString('hex')
  ).toEqual('4ed5db750c700436186b8bf2df5110a372f6c19c79da49e987b5dd71b5a65d4d');
});

test('creates 32 bytes result', () => {
  expect(
    createCacheKey({
      assetType: 'img',
      encodedCode:
        'pako:eNpVkM1qw0AMhF9F6NRC_AI-BBo7zSWQQHLz5iC8SnZJ9gd5TQm2373r_ECrk9B8MwwasA2ascSLUDRwrJWHPF9NZcR2yVF3gqJYjhtO4ILn-wirj02AzoQYrb98PvnVDEE1bGeMIRnrr9NTqh7-necR6mZLMYV4-qscf8II68buTY7_rxjh7PpuzlSeqWhJoCJ5IbhAx-LI6lx-mG8Kk2HHCsu8apKrQuWnzPVRU-K1tikI5qRbxwukPoXD3bdYJun5DdWW8iPci5p-AUT3W9o',
    })
  ).toHaveLength(32);

  expect(
    createCacheKey({
      assetType: 'img',
      encodedCode: '0',
    })
  ).toHaveLength(32);
});

test('throws when code is empty', () => {
  expect(() => createCacheKey({ assetType: 'img', encodedCode: '' })).toThrow(
    'encodedCode is required to create cache key'
  );
});

test('throws when asset type is empty', () => {
  expect(() =>
    createCacheKey({
      assetType: '',
      encodedCode:
        'pako:eNpVkM1qw0AMhF9F6NRC_AI-BBo7zSWQQHLz5iC8SnZJ9gd5TQm2373r_ECrk9B8MwwasA2ascSLUDRwrJWHPF9NZcR2yVF3gqJYjhtO4ILn-wirj02AzoQYrb98PvnVDEE1bGeMIRnrr9NTqh7-necR6mZLMYV4-qscf8II68buTY7_rxjh7PpuzlSeqWhJoCJ5IbhAx-LI6lx-mG8Kk2HHCsu8apKrQuWnzPVRU-K1tikI5qRbxwukPoXD3bdYJun5DdWW8iPci5p-AUT3W9o',
    })
  ).toThrow('assetType is required to create cache key');
});

test('throws when argument is absent', () => {
  expect(() => createCacheKey()).toThrow(
    'assetType is required to create cache key'
  );
});

describe('getQueryKey', () => {
  const supportedQuery = {
    bgColor: 'c0c0c0',
    width: '800',
    height: '600',
    scale: '1.5',
    theme: 'forest',
    type: 'png',
    paper: 'a0',
    landscape: '',
    fit: '',
  };

  test('do not change width and height if the scale is equal or smaller than 0', () => {
    expect(getQueryKey('img', { ...supportedQuery, scale: '0' })).toEqual(
      'bgColor=#c0c0c0,width=800,height=600,theme=forest,type=png'
    );
  });

  test('do not change width and height if the scale is greater than 3', () => {
    expect(getQueryKey('img', { ...supportedQuery, scale: '3.001' })).toEqual(
      'bgColor=#c0c0c0,width=800,height=600,theme=forest,type=png'
    );
  });

  test('do not change width if the value exceeds the maxWidth', () => {
    expect(
      getQueryKey('img', supportedQuery, { maxWidth: supportedQuery.width })
    ).toEqual('bgColor=#c0c0c0,width=800,height=900,theme=forest,type=png');
  });

  test('do not change height if the value exceeds the maxHeight', () => {
    expect(
      getQueryKey('img', supportedQuery, { maxHeight: supportedQuery.height })
    ).toEqual('bgColor=#c0c0c0,width=1200,height=600,theme=forest,type=png');
  });

  describe('img', () => {
    test('works with common query', () => {
      expect(getQueryKey('img', supportedQuery)).toEqual(
        'bgColor=#c0c0c0,width=1200,height=900,theme=forest,type=png'
      );
    });

    test.each`
      type
      ${'png'}
      ${'webp'}
      ${'jpeg'}
      ${'Png'}
      ${'Webp'}
      ${'Jpeg'}
    `('works with type $type', ({ type }) => {
      expect(getQueryKey('img', { ...supportedQuery, type })).toEqual(
        `bgColor=#c0c0c0,width=1200,height=900,theme=forest,type=${type.toLowerCase()}`
      );
    });

    test('works when query is absent', () => {
      expect(getQueryKey('img')).toEqual('type=jpeg');
    });

    test('skips unsupported type', () => {
      expect(getQueryKey('img', { ...supportedQuery, type: 'mp4' })).toEqual(
        'bgColor=#c0c0c0,width=1200,height=900,theme=forest,type=jpeg'
      );
    });
  });

  describe('svg', () => {
    test('works with common query', () => {
      expect(getQueryKey('svg', supportedQuery)).toEqual(
        'bgColor=#c0c0c0,width=1200,height=900,theme=forest'
      );
    });

    test('works when query is absent', () => {
      expect(getQueryKey('svg')).toEqual('');
    });
  });

  describe('pdf', () => {
    test('works with common query', () => {
      expect(getQueryKey('pdf', supportedQuery)).toEqual(
        'bgColor=#c0c0c0,width=1200,height=900,theme=forest,paper=a0,landscape=true,fit=true'
      );
    });

    test.each`
      paper
      ${'letter'}
      ${'legal'}
      ${'tabloid'}
      ${'ledger'}
      ${'a0'}
      ${'a1'}
      ${'a2'}
      ${'a3'}
      ${'a4'}
      ${'a5'}
      ${'a6'}
      ${'Letter'}
      ${'Legal'}
      ${'Tabloid'}
      ${'Ledger'}
      ${'A0'}
      ${'A1'}
      ${'A2'}
      ${'A3'}
      ${'A4'}
      ${'A5'}
      ${'A6'}
    `('works with paper $paper', ({ paper }) => {
      expect(getQueryKey('pdf', { ...supportedQuery, paper })).toEqual(
        `bgColor=#c0c0c0,width=1200,height=900,theme=forest,paper=${paper.toLowerCase()},landscape=true,fit=true`
      );
    });

    test('works when query is absent', () => {
      expect(getQueryKey('pdf')).toEqual('paper=a4');
    });

    test('skips landscape if value is undefined', () => {
      expect(
        getQueryKey('pdf', { ...supportedQuery, landscape: undefined })
      ).toEqual(
        'bgColor=#c0c0c0,width=1200,height=900,theme=forest,paper=a0,fit=true'
      );

      expect(
        getQueryKey('pdf', { ...supportedQuery, landscape: null })
      ).toEqual(
        'bgColor=#c0c0c0,width=1200,height=900,theme=forest,paper=a0,fit=true'
      );
    });

    test('skips fit if value is undefined', () => {
      expect(getQueryKey('pdf', { ...supportedQuery, fit: undefined })).toEqual(
        'bgColor=#c0c0c0,width=1200,height=900,theme=forest,paper=a0,landscape=true'
      );

      expect(getQueryKey('pdf', { ...supportedQuery, fit: null })).toEqual(
        'bgColor=#c0c0c0,width=1200,height=900,theme=forest,paper=a0,landscape=true'
      );
    });
  });
});
