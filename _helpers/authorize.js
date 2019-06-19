const expressJwt = require('express-jwt');

module.exports = authorize;

function authorize(roles = []) {
    // roles param can be a single role string (e.g. Role.User or 'User') 
    // or an array of roles (e.g. [Role.Admin, Role.User] or ['Admin', 'User'])
    if (typeof roles === 'string') {
        roles = [roles];
    }
    return [
        // authenticate JWT token and attach user to request object (req.user)
        expressJwt({
            secret: process.env.JWT_SECRET,
            credentialsRequired: false,
            getToken: function fromHeaderOrQuerystring (req) {
              if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
                  return req.headers.authorization.split(' ')[1];
              } else if (req.query && req.query.token) {
                return req.query.token;
              } else if (req.cookies && req.cookies.token) {
                return req.cookies.token;
              }
              return null;
            }
          }),

        // authorize based on user role
        (req, res, next) => {
             if (!req.user || (roles.length && !roles.includes(req.user.role))) {
                // user's role is not authorized
                return res.status(401).json({ message: 'users role is not authorized' });
            }

            // authentication and authorization successful
            next();
        }
    ];
}