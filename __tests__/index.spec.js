const createAdmin = require('../');

describe('Create Default Admin User Boot', () => {
  it('should be a function', () => {
    expect(typeof createAdmin).toBe('function');
  });

  it('should return a function', () => {
    const creator = createAdmin({
      defaultUserData: {}
    });

    expect(typeof creator).toBe('function');
  });

  it('should find or create user and role', async () => {
    const creator = createAdmin({
      userModel: 'TestUser',
      roleModel: 'TestRole',
      roleMappingModel: 'TestRoleMapping',
      username: 'test-user-name',
      rolename: 'test-admin',
      defaultUserData: {
        username: 'test-default-user-data'
      },
      defaultRoleData: {
        name: 'test-default-role-data'
      }
    });

    const findOrCreateUser = jest
      .fn()
      .mockResolvedValue([{ id: 'test-user-id' }, true]);

    const createPrincipal = jest
      .fn()
      .mockResolvedValue({ id: 'test-role-principal-id' });

    const findPrincipal = jest
      .fn()
      .mockRejectedValue(new Error('should not be called'));

    const findOrCreateRole = jest.fn().mockResolvedValue([
      {
        id: 'test-role-id',
        principals: {
          findOne: findPrincipal,
          create: createPrincipal
        }
      },
      true
    ]);

    const app = {
      models: {
        TestUser: {
          findOrCreate: findOrCreateUser
        },
        TestRole: {
          findOrCreate: findOrCreateRole
        },
        TestRoleMapping: {
          USER: 'test-rolemapping-user'
        }
      }
    };
    const done = jest.fn();

    await creator(app, done);

    expect(done).toBeCalledWith(null);

    expect(app.models.TestUser.findOrCreate).toBeCalledWith(
      { username: 'test-user-name' },
      { username: 'test-default-user-data' }
    );

    expect(app.models.TestRole.findOrCreate).toBeCalledWith(
      { name: 'test-admin' },
      { name: 'test-default-role-data' }
    );

    expect(findPrincipal).not.toBeCalled();

    expect(createPrincipal).toBeCalledWith({
      principalId: 'test-user-id',
      principalType: 'test-rolemapping-user'
    });
  });

  it('should throw if no defaultUserData were passed', () => {
    expect(() => createAdmin()).toThrowError(/defaultUserData is required/);
  });

  it('should reuse pricipal if it exists', async () => {
    const creator = createAdmin({
      defaultUserData: {}
    });

    const findOrCreateUser = jest
      .fn()
      .mockResolvedValue([{ id: 'test-user-id' }, false]);
    const createPrincipal = jest
      .fn()
      .mockRejectedValue(new Error('Should not be called'));
    const findPrincipal = jest.fn().mockReturnValue({});
    const findOrCreateRole = jest.fn().mockResolvedValue([
      {
        id: 'test-role-id',
        principals: {
          findOne: findPrincipal,
          create: createPrincipal
        }
      },
      false
    ]);

    const app = {
      models: {
        User: {
          findOrCreate: findOrCreateUser
        },
        Role: {
          findOrCreate: findOrCreateRole
        },
        RoleMapping: {
          USER: 'test-role-mapping'
        }
      }
    };

    const done = jest.fn();
    await creator(app, done);

    expect(done).toBeCalledWith(null);

    expect(createPrincipal).not.toBeCalled();

    expect(findPrincipal).toBeCalledWith({
      where: { principalId: 'test-user-id', principalType: 'test-role-mapping' }
    });
  });
});
