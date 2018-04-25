'use strict';

const roleManager = require('../common/role-manager'),
  errors = require('../common/errors');

function onBeforeSave(ctx, next) {
  const data = ctx.data || ctx.instance || ctx.currentInstance,
    appRoles = roleManager.getAppRoles(),
    authorizedRoles = ctx.options && ctx.options.authorizedRoles ? ctx.options.authorizedRoles : {},
    isAdmin = ctx.options && ctx.options.currentUser && ctx.options.currentUser.roles.includes('admin');
  // isAdmin = ctx.options && ctx.options.authorizedRoles && ctx.options.authorizedRoles.admin;

  data.role = appRoles.includes(data.role)
    ? data.role
    : 'user';

  const nonAdminChangingRoleToAdmin = data.role === 'admin' && !isAdmin,
    nonOwnerChangingPassword = !ctx.isNewInstance && authorizedRoles.owner !== true && data.password !== undefined;

  if (nonAdminChangingRoleToAdmin || nonOwnerChangingPassword) {
    return next(errors.make(403));
  }

  next();
}

function onAfterSave(ctx, next) {
  // if the user is updated, set role if necessary
  // else if new and admin, set admin role
  if (!ctx.isNewInstance || ctx.instance.role === 'admin') {
    roleManager.setUserRole(ctx.Model.app, ctx.instance.id, ctx.instance.role, !ctx.isNewInstance)
      .then(() => next());

    return;
  }

  next();
}


module.exports = function (AppUser) {

  AppUser.observe('before save', onBeforeSave);
  AppUser.observe('after save', onAfterSave);

};
