'use strict';

const roleManager = require('../common/role-manager');

module.exports = (app, next) => {
  roleManager.setAppRoles(app, ['admin', 'user'])
    .then(() => next())
    .catch(next);
};
