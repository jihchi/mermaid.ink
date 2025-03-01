/** @returns {Promise<import('jest').Config>} */
module.exports = async () => {
  return {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  };
};
