const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    console.log('token: ' + token);
    const decodedToken = jwt.verify(token, "secret_this_should_be_longer");
    console.log('auth succeded');
    req.userData = { "_UserId": decodedToken.id, "isAdmin": decodedToken.isAdmin };
    next();
  } catch (error) {
    console.log('auth faild');
    res.status(401).json({ message: "Auth failed!" });
  }
};
