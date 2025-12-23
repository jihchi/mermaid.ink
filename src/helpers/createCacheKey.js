import crypto from 'node:crypto';
import {
  extractBgColor,
  extractDimension,
  extractTheme,
  extractImageType,
  extractPaper,
  isFit,
  isLandscape,
} from '#@/helpers/utils.js';

export const getQueryKey = (assetType, query, options) => {
  const queryKey = [];
  const bgColor = extractBgColor(query);
  const dimension = extractDimension(query, options);
  const theme = extractTheme(query);

  if (bgColor) queryKey.push(`bgColor=${bgColor}`);

  if (dimension) {
    queryKey.push(`width=${dimension.width}`);
    queryKey.push(`height=${dimension.height}`);
  }

  if (theme) queryKey.push(`theme=${theme}`);

  if (assetType === 'img') {
    const type = extractImageType(query);
    if (type) queryKey.push(`type=${type}`);
  } else if (assetType === 'svg') {
  } else if (assetType === 'pdf') {
    const paper = extractPaper(query);
    const landscape = isLandscape(query);
    const fit = isFit(query);

    if (paper) queryKey.push(`paper=${paper}`);
    if (landscape) queryKey.push(`landscape=${landscape}`);
    if (fit) queryKey.push(`fit=${fit}`);
  }

  return queryKey.join(',');
};

export default ({
  assetType = 'img',
  encodedCode = '',
  query,
  options,
} = {}) => {
  if (!assetType || !encodedCode) return '';

  let rawData = `${assetType} | ${encodedCode}`;
  const queryKey = getQueryKey(assetType, query, options);

  if (queryKey) {
    rawData = `${rawData} | ${queryKey}`;
  }

  return crypto.createHash('sha256').update(rawData).digest();
};
