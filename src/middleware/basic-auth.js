const AuthService = require('../auth/auth-service');

function requireAuth(req, res, next) {
  console.log('validating....');
  const authToken = req.get('Authorization') || '';
  console.log('authToken', authToken);

  let basicToken;

  if (!authToken.toLowerCase().startsWith('basic ')) {
    return res.status(401).json({ error: 'Missing basic token' });
  } else {
    basicToken = authToken.slice('basic '.length, authToken.length);
  }

  const [tokenUserName, tokenPassword] = AuthService.parseBasicToken(
    basicToken
  );

  if (!tokenUserName || !tokenPassword) {
    return res.status(401).json({ error: 'Unauthorized request' });
  }

  AuthService.getUserWithUserName(req.app.get('db'), tokenUserName)
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized request' });
      }

      return AuthService.compare(tokenPassword, user.password).then(
        (passwordsMatch) => {
          if (!passwordsMatch) {
            return res.status(401).json({ error: 'Unauthorized request' });
          }
          req.user = user;
          next();
        }
      );
    })
    .catch(next);
}

module.exports = {
  requireAuth
};
