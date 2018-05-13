'use strict';

const debug = require('debug')('example-tests:role-manager'),
  appRolesById = {};

const roleManager = {

  getAppRoles: () => Object.values(appRolesById),

  /**
   * Registers static roles names for the app
   *
   * @param  app
   * @param  {string[]} roles names
   * @return {Promise<Role[]>}
   */
  setAppRoles: (app, roles) => {
    debug(`Initialize roles: ${roles}`);

    return app.models.Role.create(roles.map(name => ({name: name})))
      .then(res => {
        // cache role name for quick mapping
        res.forEach(role => appRolesById[role.id] = role.name);
        return res;
      });
  },

  /**
   * Returns a promise which resolves with the role ids
   *
   * @param   app
   * @param   userId
   * @return  {Promise<[string|number]>}
   */
  getUserRoles: (app, userId) => {
    return app.models.Role.getRoles({
      principalType: app.models.RoleMapping.USER,
      principalId: userId
    });
  },

  /**
   * Returns a promise which resolves with the role names
   *
   * @param   app
   * @param   userId
   * @return  {Promise<[string]>}
   */
  getUserRoleNames: (app, userId) => {
    return roleManager.getUserRoles(app, userId)
      .then(roles => roles.map(role => appRolesById[role] || role));
  },

  /**
   * Returns a promise which resolves when the role is set
   *
   * @param app
   * @param userId
   * @param {string}  roleName
   * @param {boolean} reset delete previous role
   * @return {Promise}
   */
  setUserRole: (app, userId, roleName, reset = false) => {
    debug(`${reset ? 'Removing previous role' : `Setting role ${roleName}`} for user ${userId}`);

    if (reset) {
      return roleManager.getUserRoleNames(app, userId)
        .then(roles => {
          // the user has same role
          if (roles.includes(roleName)) {
            return;
          }

          const appRoles = roleManager.getAppRoles(),
            roleToRevoke = roles.find(role => appRoles.includes(role)),
            // call self without the reset
            setRoleNoReset = () => roleManager.setUserRole(app, userId, roleName);

          if (!roleToRevoke) {
            return setRoleNoReset();
          }

          return roleManager.removeUserRole(app, userId, roleToRevoke)
            .then(() => setRoleNoReset());
        });
    }

    return app.models.Role.findOne({where: {name: roleName}})
      .then(role =>
        role.principals
          .create({
            principalType: app.models.RoleMapping.USER,
            principalId: userId
          })
      )
      .tap(() => debug(`Role ${roleName} assigned to ${userId}`));
  },

  /**
   * Removes the role for the given user
   *
   * @param app
   * @param userId
   * @param {string} roleName
   * @return {Promise}
   */
  removeUserRole: (app, userId, roleName) => {
    debug(`Removing role' : ${roleName} from user ${userId}`);
    return app.models.Role.findOne({where: {name: roleName}})
      .then(role => {
        return role.principals.destroyAll({where: {principalId: userId}});
      })
      .tap(() => debug(`Role ${roleName} removed from ${userId}`));
  }
};

module.exports = roleManager;
