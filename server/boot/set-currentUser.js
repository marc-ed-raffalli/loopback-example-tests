'use strict';

const debug = require('debug')('example-tests:set-currentUser');
const roleManager = require('../common/role-manager');

module.exports = app => {

  app.remotes().phases.addBefore('invoke', 'set-current-user')
    .use((ctx, next) => {
      const options = ctx.args.options || {},
        userId = options.accessToken && options.accessToken.userId;

      debug(`Incoming call to ${ctx.methodString} from ${userId ? `user-id: ${userId}` : 'anonymous'}`);

      if (!userId) return next();

      Promise.all([
        app.models.AppUser.findById(userId),
        roleManager.getUserRoleNames(app, userId)
      ])
        .then(res => {
          ctx.args.options.currentUser = {
            id: userId,
            email: res[0].email,
            roles: res[1]
          };
          next();
        });
    });

};
