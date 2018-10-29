const createAdmin = require('../');

describe('Create Default Admin User Boot', () => {
  it('should be a function', () => {
    expect(typeof createAdmin).toBe('function');
  });
});
