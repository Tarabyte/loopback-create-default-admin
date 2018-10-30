const asyncHandler = require('loopback-async-boot');

module.exports = (config = {}) => {
  const {
    userModel = 'User',
    roleModel = 'Role',
    roleMappingModel = 'RoleMapping',
    username = 'admin',
    defaultUserData,
    rolename = 'admin',
    defaultRoleData
  } = config;

  if (!defaultUserData) {
    throw new Error('CreateDefaultAdmin: defaultUserData is required.');
  }

  const createAdmin = async app => {
    const [[user, newUser], [role, newRole]] = await Promise.all([
      app.models[userModel].findOrCreate({ username }, defaultUserData),
      app.models[roleModel].findOrCreate({ name: rolename }, defaultRoleData)
    ]);

    const principalData = {
      principalId: user.id,
      principalType: app.models[roleMappingModel].USER
    };

    // relations don't provide findOrCreate
    if (
      newUser ||
      newRole ||
      // lazyly check if principal exists if neither user nor role was new
      !(await role.principals.findOne({ where: principalData }))
    ) {
      await role.principals.create(principalData);
    }
  };

  return asyncHandler(createAdmin);
};
