// Mock queues for development
const mockQueue = {
  add: async (name, data, options) => {
    console.log(`📋 Mock queue job: ${name}`, data);
    return { id: `mock-${Date.now()}` };
  },
  on: () => {},
  process: () => {}
};

console.log('⚠️  Using mock queues for development');

module.exports = {
  analysisQueue: mockQueue,
  uploadQueue: mockQueue,
};
