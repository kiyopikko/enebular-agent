var fs = require('fs');
var jwt = require('jsonwebtoken');
var store = require('../store');

module.exports = function(publicKeyPath, options) {
  var publicKey = fs.readFileSync(publicKeyPath, 'utf8');
  return function authenticate(req, res, next) {
    if (!req.session) {
      throw new Error('Session is not available. Confirm the server setting.');
    } else if (req.session.identity) {
      next();
    } else {
      var token = req.query.auth_token;
      if (token) {
        console.log('token=', token);
        store.get('agentid', function(err, agent_id) {
          options.audience = agent_id
          jwt.verify(token, publicKey, options, function(err, identity) {
            if (err) {
              return res.status(401).render('../views/error', {message:err.message});
            }
            store.get('user_id', function(err, user_id) {
              if(user_id != identity.sub) {
                res.status(401).render('../views/error', {message:'Unauthorized: userId does not match.'});
              }else{
                console.log('Verified identity=', identity);
                req.session.identity = identity;
                res.redirect(req.path);
              }
            });
          });
        });
      } else {
        res.status(401).send('Unauthorized');
      }
    }
  };
};
